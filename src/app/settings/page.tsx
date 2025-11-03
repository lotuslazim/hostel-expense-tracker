
"use client";

import { Settings as SettingsComponent } from "@/components/settings/Settings";
import { AppHeader } from "@/components/app/header";
import { Settings as SettingsIcon } from "lucide-react";
import { useI18n } from "@/i18n/client-provider";

export default function SettingsPage() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
         <div className="space-y-8">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold font-headline text-mint-500 flex items-center gap-3">
                    <SettingsIcon className="h-8 w-8" />
                    {t('settings.title')}
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">{t('settings.description')}</p>
            </div>
            <SettingsComponent />
        </div>
      </main>
    </div>
  );
}
