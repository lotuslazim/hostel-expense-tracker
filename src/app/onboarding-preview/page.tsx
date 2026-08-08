"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { OnboardingExperience } from "@/components/onboarding/OnboardingExperience";

export default function OnboardingPreviewPage() {
  const router = useRouter();
  const [previewRun, setPreviewRun] = useState(0);

  return (
    <OnboardingExperience
      key={previewRun}
      onComplete={() => setPreviewRun((run) => run + 1)}
      onSkip={() => router.back()}
    />
  );
}
