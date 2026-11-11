"use client";

import nextDynamic from "next/dynamic";

const PracticeApp = nextDynamic(() => import("../src/App"), {
  ssr: false,
  loading: () => <div role="status">Loading ReadNote Studio…</div>,
});

export const dynamic = "force-static";

export default function Home() {
  return <PracticeApp />;
}
