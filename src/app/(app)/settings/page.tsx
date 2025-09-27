
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
import { AlertTriangle, UserCog, Settings, Bell, Palette, Globe, LogOut, Trash2, Shield, Edit, ShieldCheck, FileDown, SlidersHorizontal, Loader2, KeyRound } from "lucide-react"
import { ThemeSwitcher } from "@/components/settings/theme-switcher"
import { useI18n } from "@/i18n/client-provider"
import { Switch } from "@/components/ui/switch"
import { useFirebase, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc, deleteDoc, writeBatch } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { EmailAuthProvider, reauthenticateWithCredential, deleteUser, updatePassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const deleteFormSchema = z.object({
  password: z.string().min(1, { message: "Password is required." }),
});

const passwordFormSchema = z.object({
  newPassword: z.string().min(8, { message: "New password must be at least 8 characters." }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
});


export default function SettingsPage() {
  const { lang, setLang, t } = useI18n();
  const [mealReminders, setMealReminders] = React.useState(true);
  const [expenseAlerts, setExpenseAlerts] = React.useState(false);
  const [missedDayAlerts, setMissedDayAlerts] = React.useState(true);
  
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = React.useState(false);


  const { firestore, auth } = useFirebase();
  const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();


  const currentUserRef = useMemoFirebase(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData, isLoading: isCurrentUserDataLoading } = useDoc(currentUserRef);

  const groupId = currentUserData?.groupId;

  const groupRef = useMemoFirebase(() => groupId ? doc(firestore, "groups", groupId) : null, [firestore, groupId]);
  const { data: groupData, isLoading: isGroupLoading } = useDoc(groupRef);
  
  const isGoogleUser = currentUser?.providerData.some(p => p.providerId === 'google.com');

  const deleteForm = useForm<z.infer<typeof deleteFormSchema>>({
    resolver: zodResolver(deleteFormSchema),
    defaultValues: { password: "" },
  });
  
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const handleDeleteAccount = async (values: z.infer<typeof deleteFormSchema>) => {
    if (!currentUser || !currentUser.email) {
        toast({ variant: "destructive", title: "Error", description: "Could not find user information." });
        return;
    }
    setIsDeleting(true);

    try {
        const credential = EmailAuthProvider.credential(currentUser.email, values.password);
        await reauthenticateWithCredential(currentUser, credential);
        
        const userDocRef = doc(firestore, "users", currentUser.uid);
        await deleteDoc(userDocRef);
        await deleteUser(currentUser);

        toast({ title: "Account Deleted", description: "Your account has been permanently deleted." });
        setDeleteDialogOpen(false);
        router.push('/');

    } catch (error: any) {
        console.error("Error deleting account: ", error);
        let description = "An unexpected error occurred.";
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            description = "Incorrect password. Please try again.";
            deleteForm.setError("password", { type: "manual", message: "Incorrect password." });
        }
        toast({ variant: "destructive", title: "Deletion Failed", description });
    } finally {
        setIsDeleting(false);
    }
  };

  const handleChangePassword = async (values: z.infer<typeof passwordFormSchema>) => {
    if (!currentUser) {
        toast({ variant: "destructive", title: "Error", description: "Could not find user information." });
        return;
    }
    setIsChangingPassword(true);
    try {
        await updatePassword(currentUser, values.newPassword);
        
        toast({ title: "Password Updated", description: "Your password has been changed successfully." });
        setPasswordDialogOpen(false);
        passwordForm.reset();

    } catch (error: any) {
        console.error("Error changing password: ", error);
        let description = "An unexpected error occurred. You may need to log in again to change your password.";
        if (error.code === 'auth/requires-recent-login') {
            description = "This action requires you to have signed in recently. Please log out and log back in to change your password.";
        }
        toast({ variant: "destructive", title: "Password Change Failed", description });
    } finally {
        setIsChangingPassword(false);
    }
  }


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
                <CardTitle className="text-base flex items-center gap-2"><KeyRound/>Password</CardTitle>
              </CardHeader>
               <CardContent>
                  <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="w-full">
                            <Button variant="outline" className="w-full justify-start" disabled={isGoogleUser} onClick={() => isGoogleUser ? {} : setPasswordDialogOpen(true)}>
                                Change Password
                            </Button>
                          </div>
                        </TooltipTrigger>
                         {isGoogleUser && (
                          <TooltipContent>
                            <p>Password cannot be changed for Google Sign-In accounts.</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>

                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Your Password</DialogTitle>
                    </DialogHeader>
                    <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4 pt-4">
                           <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                                <FormItem>
                                  <FormLabel>New Password</FormLabel>
                                  <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                           <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Confirm New Password</FormLabel>
                                  <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="submit" className="w-full" disabled={isChangingPassword}>
                               {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                               Save New Password
                            </Button>
                        </form>
                    </Form>
                  </DialogContent>
                </Dialog>
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
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="w-full">
                            <Button variant="destructive" className="w-full justify-start" disabled={isGoogleUser} onClick={() => isGoogleUser ? {} : setDeleteDialogOpen(true)}>
                                <Trash2 className="mr-2 h-4 w-4" /> {t('settings.account_settings.actions.delete_account')}
                            </Button>
                          </div>
                        </TooltipTrigger>
                         {isGoogleUser && (
                          <TooltipContent>
                            <p>Account deletion for Google Sign-In is managed through your Google account settings.</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>

                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('settings.account_settings.actions.delete_account_confirm_title')}</DialogTitle>
                      <DialogDescription>
                        {t('settings.account_settings.actions.delete_account_confirm_desc')} To proceed, please enter your password.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...deleteForm}>
                        <form onSubmit={deleteForm.handleSubmit(handleDeleteAccount)} className="space-y-4 pt-4">
                           <FormField
                              control={deleteForm.control}
                              name="password"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Password</FormLabel>
                                  <FormControl>
                                    <Input type="password" placeholder="••••••••" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="submit" variant="destructive" className="w-full" disabled={isDeleting}>
                               {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                               {t('settings.account_settings.actions.delete_account')}
                            </Button>
                        </form>
                    </Form>
                  </DialogContent>
                </Dialog>
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
                  <Dialog>
                    <DialogTrigger asChild><Button variant="outline" className="w-full justify-start">{t('settings.admin_controls.group_management.edit_group_name')}</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t('settings.admin_controls.group_management.edit_group_name')}</DialogTitle>
                        <DialogDescription>Enter a new name for your group.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                           <Label htmlFor="group-name">New Group Name</Label>
                           <Input id="group-name" defaultValue={groupData?.groupName} />
                        </div>
                        <Button className="w-full">Save Changes</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <AlertDialog>
                     <AlertDialogTrigger asChild><Button variant="outline" className="w-full justify-start">{t('settings.admin_controls.group_management.reset_invite_code')}</Button></AlertDialogTrigger>
                     <AlertDialogContent>
                       <AlertDialogHeader>
                         <AlertDialogTitle>Are you sure you want to reset the invite code?</AlertDialogTitle>
                         <AlertDialogDescription>The old invite code will no longer work. All members will need the new code to join.</AlertDialogDescription>
                       </AlertDialogHeader>
                       <AlertDialogFooter>
                         <AlertDialogCancel>Cancel</AlertDialogCancel>
                         <AlertDialogAction>Reset Code</AlertDialogAction>
                       </AlertDialogFooter>
                     </AlertDialogContent>
                   </AlertDialog>
                </CardContent>
              </Card>
               <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4"/> {t('settings.admin_controls.member_management.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Dialog>
                    <DialogTrigger asChild><Button variant="outline" className="w-full justify-start">{t('settings.admin_controls.member_management.approve_requests')}</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Pending Member Requests</DialogTitle></DialogHeader>
                      <div className="py-4"><p className="text-sm text-muted-foreground">No pending requests.</p></div>
                    </DialogContent>
                  </Dialog>
                  <Dialog>
                    <DialogTrigger asChild><Button variant="outline" className="w-full justify-start">{t('settings.admin_controls.member_management.assign_admin')}</Button></DialogTrigger>
                     <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Assign New Admin</DialogTitle>
                        <DialogDescription>Choose a member to promote to an admin role.</DialogDescription>
                      </DialogHeader>
                       <div className="space-y-4 py-4">
                        <div className="space-y-2">
                           <Label htmlFor="member-select">Select Member</Label>
                           <Select><SelectTrigger><SelectValue placeholder="Select a member" /></SelectTrigger><SelectContent></SelectContent></Select>
                        </div>
                        <Button className="w-full">Assign Admin</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><SlidersHorizontal className="h-4 w-4"/> {t('settings.admin_controls.expense_rules.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                   <Dialog>
                    <DialogTrigger asChild><Button variant="outline" className="w-full justify-start">{t('settings.admin_controls.expense_rules.set_categories')}</Button></DialogTrigger>
                    <DialogContent><DialogHeader><DialogTitle>Set Expense Categories</DialogTitle></DialogHeader><div className="py-4"><p>Functionality to be implemented.</p></div></DialogContent>
                  </Dialog>
                   <Dialog>
                    <DialogTrigger asChild><Button variant="outline" className="w-full justify-start">{t('settings.admin_controls.expense_rules.define_cost_sharing')}</Button></DialogTrigger>
                    <DialogContent><DialogHeader><DialogTitle>Define Cost-Sharing Method</DialogTitle></DialogHeader><div className="py-4"><p>Functionality to be implemented.</p></div></DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><FileDown className="h-4 w-4"/> {t('settings.admin_controls.data_reports.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="outline" className="w-full justify-start">{t('settings.admin_controls.data_reports.export_data')}</Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Export Group Data</AlertDialogTitle><AlertDialogDescription>This will generate a CSV file of all meals, expenses, and items for the current month.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction>Export</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
               <Alert variant="default" className="bg-primary/10 border-primary/20">
                  <AlertTriangle className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-primary">{t('settings.admin_controls.admin_responsibility.title')}</AlertTitle>
                  <AlertDescription className="text-primary/80">
                    {t('settings.admin_controls.admin_responsibility.description')}
                  </AlertDescription>
                </Alert>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}
