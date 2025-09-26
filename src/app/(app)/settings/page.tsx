
"use client";
import * as React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, UserCog, Settings, Bell, Palette, Globe, LogOut, Trash2, Shield, Edit, ShieldCheck, FileDown, SlidersHorizontal, Loader2 } from "lucide-react"
import { ThemeSwitcher } from "@/components/settings/theme-switcher"
import { useI18n } from "@/i18n/client-provider"
import { Switch } from "@/components/ui/switch"
import { useFirebase, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const { lang, setLang, t } = useI18n();
  const [mealReminders, setMealReminders] = React.useState(true);
  const [expenseAlerts, setExpenseAlerts] = React.useState(false);
  const [missedDayAlerts, setMissedDayAlerts] = React.useState(true);

  const { firestore } = useFirebase();
  const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();

  const currentUserRef = useMemoFirebase(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData, isLoading: isCurrentUserDataLoading } = useDoc(currentUserRef);

  const groupId = currentUserData?.groupId;

  const groupRef = useMemoFirebase(() => groupId ? doc(firestore, "groups", groupId) : null, [firestore, groupId]);
  const { data: groupData, isLoading: isGroupLoading } = useDoc(groupRef);

  const isLoading = isCurrentUserLoading || isCurrentUserDataLoading || isGroupLoading;

  if (isLoading) {
    return (
       <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">{t('settings.title')}</h1>
        <p className="text-muted-foreground">
          {t('settings.description')}
        </p>
      </div>

      <Accordion type="single" collapsible defaultValue="app-settings" className="w-full">
        {/* App Settings */}
        <AccordionItem value="app-settings">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5" />
              {t('settings.app_settings.title')}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pt-4">
            <Card>
               <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Palette className="h-4 w-4"/>{t('settings.app_settings.appearance.title')} </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Label htmlFor="dark-mode">{t('settings.app_settings.appearance.dark_mode')}</Label>
                  <ThemeSwitcher />
                </div>
              </CardContent>
            </Card>
            <Card>
               <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Globe className="h-4 w-4"/> {t('settings.app_settings.language.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                 <Select value={lang} onValueChange={(value) => setLang(value as 'en' | 'bn')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t('settings.app_settings.language.english')}</SelectItem>
                    <SelectItem value="bn">{t('settings.app_settings.language.bangla')}</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4 w-4"/> {t('settings.app_settings.notifications.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="meal-reminders">{t('settings.app_settings.notifications.meal_reminders')}</Label>
                  <Switch
                    id="meal-reminders"
                    checked={mealReminders}
                    onCheckedChange={setMealReminders}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="expense-alerts">{t('settings.app_settings.notifications.expense_alerts')}</Label>
                  <Switch
                    id="expense-alerts"
                    checked={expenseAlerts}
                    onCheckedChange={setExpenseAlerts}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="missed-day-alerts">{t('settings.app_settings.notifications.missed_day_alerts')}</Label>
                   <Switch
                    id="missed-day-alerts"
                    checked={missedDayAlerts}
                    onCheckedChange={setMissedDayAlerts}
                  />
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Account Settings */}
        <AccordionItem value="account-settings">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-3">
              <UserCog className="h-5 w-5" />
              {t('settings.account_settings.title')}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                  <CardTitle className="text-base">{t('settings.account_settings.group_info.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupData ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">{t('settings.account_settings.group_info.group_name')}</span>
                      <span className="font-medium">{groupData.groupName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">{t('settings.account_settings.group_info.invite_code')}</span>
                      <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{groupData.invitationCode}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">You are not currently in a group. Go to the Admin Panel to create or join one.</p>
                )}
              </CardContent>
            </Card>
            <Card>
               <CardHeader>
                <CardTitle className="text-base">{t('settings.account_settings.actions.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start" disabled={!groupData}>
                      <LogOut className="mr-2 h-4 w-4" /> {t('settings.account_settings.actions.leave_group')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('settings.account_settings.actions.leave_group_confirm_title')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('settings.account_settings.actions.leave_group_confirm_desc')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive hover:bg-destructive/90">{t('settings.account_settings.actions.leave_group')}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full justify-start">
                      <Trash2 className="mr-2 h-4 w-4" /> {t('settings.account_settings.actions.delete_account')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('settings.account_settings.actions.delete_account_confirm_title')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('settings.account_settings.actions.delete_account_confirm_desc')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive hover:bg-destructive/90">{t('settings.account_settings.actions.delete_account')}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
        
        {/* Admin Settings */}
        {currentUserData?.isAdmin && (
          <AccordionItem value="admin-settings">
            <AccordionTrigger className="text-lg font-semibold">
              <div className="flex items-center gap-3 text-primary">
                <Shield className="h-5 w-5" />
                {t('settings.admin_controls.title')}
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-6 pt-4">
               <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><Edit className="h-4 w-4"/> {t('settings.admin_controls.group_management.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                   <Button variant="outline" className="w-full justify-start">{t('settings.admin_controls.group_management.edit_group_name')}</Button>
                   <Button variant="outline" className="w-full justify-start">{t('settings.admin_controls.group_management.reset_invite_code')}</Button>
                </CardContent>
              </Card>
               <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4"/> {t('settings.admin_controls.member_management.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                   <Button variant="outline" className="w-full justify-start">{t('settings.admin_controls.member_management.approve_requests')}</Button>
                   <Button variant="outline" className="w-full justify-start">{t('settings.admin_controls.member_management.assign_admin')}</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><SlidersHorizontal className="h-4 w-4"/> {t('settings.admin_controls.expense_rules.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                   <Button variant="outline" className="w-full justify-start">{t('settings.admin_controls.expense_rules.set_categories')}</Button>
                   <Button variant="outline" className="w-full justify-start">{t('settings.admin_controls.expense_rules.define_cost_sharing')}</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><FileDown className="h-4 w-4"/> {t('settings.admin_controls.data_reports.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full justify-start">{t('settings.admin_controls.data_reports.export_data')}</Button>
                </CardContent>
              </Card>
               <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{t('settings.admin_controls.admin_responsibility.title')}</AlertTitle>
                  <AlertDescription>
                    {t('settings.admin_controls.admin_responsibility.description')}
                  </AlertDescription>
                </Alert>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  )
}

    