// Pitch detection using autocorrelation algorithm
// Detects the fundamental frequency from microphone input

let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let mediaStream: MediaStream | null = null;
let bufferLength = 0;
let dataArray: Float32Array | null = null;

export async function startPitchDetection(): Promise<void> {
  try {
    // Request microphone access
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Create audio context and analyser
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    
    const source = audioContext.createMediaStreamSource(mediaStream);
    source.connect(analyser);
    
    bufferLength = analyser.fftSize;
    dataArray = new Float32Array(bufferLength);
  } catch (error) {
    console.error("Error accessing microphone:", error);
    throw new Error("Microphone access denied");
  }
}

export function stopPitchDetection(): void {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  analyser = null;
  dataArray = null;
}

export function detectPitch(): number | null {
  if (!analyser || !dataArray) return null;
  
  analyser.getFloatTimeDomainData(dataArray);
  
  // Autocorrelation algorithm
  const sampleRate = audioContext?.sampleRate || 44100;
  const frequency = autoCorrelate(dataArray, sampleRate);
  
  return frequency;
}

function autoCorrelate(buffer: Float32Array, sampleRate: number): number | null {
  // Find the RMS (root mean square) to check if there's enough signal
  let rms = 0;
  for (let i = 0; i < buffer.length; i++) {
    const val = buffer[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / buffer.length);
  
  // Not enough signal
  if (rms < 0.01) return null;
  
  // Autocorrelation
  let bestCorrelation = 0;
  let bestOffset = -1;
  let lastCorrelation = 1;
  
  // Start at A0 (27.5 Hz) and go up to C8 (4186 Hz)
  const minSamples = Math.floor(sampleRate / 4186); // C8
  const maxSamples = Math.ceil(sampleRate / 27.5);  // A0
  
  for (let offset = minSamples; offset < maxSamples; offset++) {
    let correlation = 0;
    
    for (let i = 0; i < buffer.length - offset; i++) {
      correlation += Math.abs(buffer[i] - buffer[i + offset]);
    }
    
    correlation = 1 - correlation / (buffer.length - offset);
    
    // Find the peak
    if (correlation > 0.9 && correlation > lastCorrelation) {
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    }
    
    lastCorrelation = correlation;
  }
  
  if (bestCorrelation > 0.9 && bestOffset !== -1) {
    const frequency = sampleRate / bestOffset;
    return frequency;
  }
  
  return null;
}

export function frequencyToMidi(frequency: number): number {
  // MIDI note = 69 + 12 * log2(frequency / 440)
  const midi = 69 + 12 * Math.log2(frequency / 440);
  return Math.round(midi);
}

export function isPitchDetectionActive(): boolean {
  return analyser !== null && mediaStream !== null;
}
