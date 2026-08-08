"use client";

import { useState } from "react";
import Image from "next/image";
import { Mail } from "lucide-react";

import { AppHeader } from "@/components/app/header";
import { LandingHeader } from "@/components/app/landing-header";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useUser } from "@/firebase";

const DEVELOPER_NAME = "Lotus Lazim";
const DEVELOPER_EMAIL = "lotuslazim@gmail.com";
const PROFILE_IMAGE = "/12345-6.jpg";

export default function ContactPage() {
  const { user, isUserLoading } = useUser();
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {user ? (
        <AppHeader />
      ) : !isUserLoading ? (
        <div className="mx-auto flex w-full justify-center px-4 py-4">
          <LandingHeader />
        </div>
      ) : null}

      <main className="container mx-auto flex flex-1 items-start justify-center px-4 py-10 sm:px-6 md:items-center lg:px-8">
        <section className="w-full max-w-3xl" aria-labelledby="developer-title">
          <h1
            id="developer-title"
            className="mb-5 text-center font-headline text-2xl font-bold text-header-yellow md:text-3xl"
          >
            Developer
          </h1>

          <Card className="overflow-hidden rounded-3xl border-[#f6cf58]/20 bg-gradient-to-br from-card via-card to-[#f6cf58]/[0.04] shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
            <CardContent className="p-6 pt-6 sm:p-8 sm:pt-8 md:p-10 md:pt-10">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
                <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full border-4 border-[#f6cf58] bg-muted shadow-[0_12px_35px_rgba(246,207,88,0.18)] sm:h-36 sm:w-36">
                  {imageFailed ? (
                    <span
                      className="grid h-full w-full place-items-center bg-[#f6cf58] text-3xl font-bold text-[#10241c]"
                      aria-label={DEVELOPER_NAME}
                    >
                      LL
                    </span>
                  ) : (
                    <Image
                      src={PROFILE_IMAGE}
                      alt={DEVELOPER_NAME}
                      fill
                      sizes="144px"
                      className="object-cover object-[50%_35%]"
                      priority
                      onError={() => setImageFailed(true)}
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#f6cf58]/80">
                    BachelorBite creator
                  </p>
                  <h2 className="text-xl font-bold sm:text-2xl">
                    {DEVELOPER_NAME}
                  </h2>

                  <a
                    href={`mailto:${DEVELOPER_EMAIL}`}
                    className="mt-2 inline-flex max-w-full items-center gap-2 break-all text-sm font-medium text-[#f6cf58] hover:underline sm:text-base"
                  >
                    <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {DEVELOPER_EMAIL}
                  </a>
                </div>
              </div>

              <p className="mt-8 border-t border-border/80 pt-6 text-center text-sm leading-6 text-muted-foreground sm:text-base">
                For any help or query, mail me at{" "}
                <a
                  href={`mailto:${DEVELOPER_EMAIL}`}
                  className="font-medium text-[#f6cf58] hover:underline"
                >
                  {DEVELOPER_EMAIL}
                </a>
                .
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
