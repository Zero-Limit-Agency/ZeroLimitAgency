"use client";

import { LearnYoutubeErrorState } from "@/components/learn-youtube/learn-youtube-shell";

export default function LearnYoutubeError({ reset }) {
  return <LearnYoutubeErrorState onRetry={reset} />;
}
