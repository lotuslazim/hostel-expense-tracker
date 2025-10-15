
"use client";

import { useState, useMemo } from "react";
import { useUser, useDoc, useCollection } from "@/firebase";
import { auth, firestore } from "@/firebase/config";
import { doc, updateDoc, deleteDoc, getDocs, collection, query, where, writeBatch, serverTimestamp, Timestamp } from "firebase/firestore";
import { signOut, sendPasswordResetEmail, deleteUser } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/i18n/client-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ThemeSwitcher } from "./theme-switcher";
import {
  Settings as SettingsIcon,
  Shield,
  User,
  Palette,
  Bell,
  Languages,
  LogOut,
  Trash2,
  Copy,
  KeyRound,
  FileDown,
  Edit,
  Loader2,
} from "lucide-react";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { startOfMonth } from 'date-fns/startOfMonth';
import { endOfMonth } from 'date-fns/endOfMonth';
import { format } from 'date-fns/format';


function SettingsSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="md:col-span-2">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
      <Separator />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="md:col-span-2">
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
}

function AdminControls({ groupData, members, groupId }: { groupData: any, members: any[], groupId: string }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleResetInviteCode = async () => {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const groupRef = doc(firestore, "groups", groupId);
    try {
      await updateDoc(groupRef, { invitationCode: newCode });
      toast({ title: "Invite Code Reset", description: "A new invite code has been generated." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not reset invite code." });
    }
  };
  
   const handleAssignAdmin = async (memberId: string, currentIsAdmin: boolean) => {
    const userRef = doc(firestore, 'users', memberId);
    const memberRef = doc(firestore, `groups/${groupId}/members`, memberId);
    const batch = writeBatch(firestore);

    batch.update(userRef, { isAdmin: !currentIsAdmin });
    batch.update(memberRef, { role: !currentIsAdmin ? 'admin' : 'member' });

    try {
      await batch.commit();
      toast({
        title: 'Admin Status Updated',
        description: `User's admin status has been toggled.`,
      });
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update user role.',
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const memberRef = doc(firestore, `groups/${groupId}/members`, memberId);
    const userRef = doc(firestore, 'users', memberId);
    const batch = writeBatch(firestore);
    try {
        batch.update(memberRef, { status: 'inactive', leftAt: serverTimestamp() });
        batch.update(userRef, { groupId: null, isAdmin: false });
        await batch.commit();
        toast({ title: "Member Removed", description: "The member has been removed from the group." });
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not remove the member." });
    }
  };
  
  const handleExportData = async () => {
        setIsExporting(true);
        try {
            const currentMonth = new Date();
            const monthStart = startOfMonth(currentMonth);
            const monthEnd = endOfMonth(currentMonth);

            const expensesQuery = query(
                collection(firestore, `groups/${groupId}/expenses`),
                where("date", ">=", Timestamp.fromDate(monthStart)),
                where("date", "<=", Timestamp.fromDate(monthEnd))
            );
            const mealsQuery = query(
                collection(firestore, `groups/${groupId}/meals`),
                where("date", ">=", Timestamp.fromDate(monthStart)),
                where("date", "<=", Timestamp.fromDate(monthEnd))
            );

            const [expensesSnapshot, mealsSnapshot] = await Promise.all([
                getDocs(expensesQuery),
                getDocs(mealsQuery)
            ]);

            let csvContent = "data:text/csv;charset=utf-8,";
            
            const combinedHeaders = "Type,Date,Member,Details,Category/Type,Amount/Count,Meal Item\n";
             const combinedRows = [
                ...expensesSnapshot.docs.map(doc => {
                    const data = doc.data();
                    const date = data.date instanceof Timestamp ? data.date.toDate() : new Date();
                    return ["Expense", format(date, 'yyyy-MM-dd'), `"${data.userName}"`, `"${data.expenseItem}"`, data.category, data.amount, ''].join(',');
                }),
                ...mealsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    const date = data.date instanceof Timestamp ? data.date.toDate() : new Date();
                    return ["Meal", format(date, 'yyyy-MM-dd'), `"${data.userName}"`, `"${data.description}"`, data.mealType, data.mealNumber, `"${data.itemName || ''}"`].join(',');
                })
            ].join('\n');
            
            csvContent += combinedHeaders + combinedRows;

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            const monthName = format(currentMonth, "MMMM-yyyy");
            link.setAttribute("download", `bachelorbite-export-${groupData.groupName}-${monthName}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({ title: "Export Successful", description: "Your data has been downloaded." });

        } catch (error) {
            console.error("Error exporting data: ", error);
            toast({ variant: "destructive", title: "Export Failed", description: "Could not export group data." });
        } finally {
            setIsExporting(false);
        }
    };


  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3 items-start">
        <div className="md:col-span-1">
          <h2 className="text-xl font-bold flex items-center gap-2"><Shield /> {t('settings.admin_controls.title')}</h2>
          <p className="text-muted-foreground">{t('settings.admin_controls.admin_responsibility.description')}</p>
        </div>
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.admin_controls.group_management.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center justify-between">
                        <Label htmlFor="group-name" className="flex-1">{t('settings.admin_controls.group_management.edit_group_name')}</Label>
                        <div className="flex gap-2 w-1/2">
                           <Input id="group-name" defaultValue={groupData?.groupName} className="w-full" />
                           <Button><Edit className="h-4 w-4"/></Button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <Label>{t('settings.admin_controls.group_management.reset_invite_code')}</Label>
                        <Button variant="outline" onClick={handleResetInviteCode}>Reset</Button>
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.admin_controls.member_management.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={member.photoURL} />
                                    <AvatarFallback>{member.displayName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{member.displayName}</p>
                                    <p className="text-xs text-muted-foreground">{member.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="sm" variant={member.role === 'admin' ? "secondary" : "outline"}>
                                            {member.role === 'admin' ? "Admin" : "Make Admin"}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to {member.role === 'admin' ? 'remove admin privileges from' : 'grant admin privileges to'} {member.displayName}?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleAssignAdmin(member.id, member.role === 'admin')}>
                                                Confirm
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="destructive">Remove</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Remove {member.displayName}?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to remove this member? Their status will be set to 'inactive' and their data will be preserved.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleRemoveMember(member.id)} className="bg-destructive hover:bg-destructive/90">
                                                Confirm Removal
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
            
             <Card>
                <CardHeader>
                    <CardTitle>{t('settings.admin_controls.data_reports.title')}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{t('settings.admin_controls.data_reports.export_data')}</p>
                    <Button variant="outline" onClick={handleExportData} disabled={isExporting}>
                        {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileDown className="mr-2 h-4 w-4"/>}
                        Export
                    </Button>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}


function AccountSettings({ user, userData, groupData, groupId }: { user: any, userData: any, groupData: any, groupId: string | null }) {
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useI18n();

    const handleCopyInviteCode = () => {
        navigator.clipboard.writeText(groupData?.invitationCode);
        toast({ title: "Copied!", description: "Invite code copied to clipboard." });
    };

    const handleLeaveGroup = async () => {
        if (!user || !groupId) return;
        
        const batch = writeBatch(firestore);
        const userRef = doc(firestore, "users", user.uid);
        const memberRef = doc(firestore, `groups/${groupId}/members`, user.uid);

        batch.update(userRef, { groupId: null });
        batch.update(memberRef, { status: 'inactive', leftAt: serverTimestamp() });

        try {
            await batch.commit();
            toast({ title: "You have left the group." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not leave the group." });
        }
    };
    
    const handlePasswordReset = async () => {
        if (!user.email) return;
        try {
            await sendPasswordResetEmail(auth, user.email);
            toast({ title: "Password Reset Email Sent", description: "Check your inbox for instructions."});
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not send reset email."});
        }
    }

    const handleDeleteAccount = async () => {
        if (!user) return;
        try {
            const userRef = doc(firestore, "users", user.uid);
            await deleteDoc(userRef);

            await deleteUser(user);
            
            toast({ title: "Account Deleted", description: "Your account has been permanently deleted." });
            router.push("/");
        } catch (error: any) {
            toast({ variant: "destructive", title: "Deletion Failed", description: error.message || "Please sign in again to delete your account." });
        }
    };

    return (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 items-start">
          <div className="md:col-span-1">
            <h2 className="text-xl font-bold flex items-center gap-2"><User />{t('settings.account_settings.title')}</h2>
            <p className="text-muted-foreground">Manage your group and account actions.</p>
          </div>
          <div className="md:col-span-2 space-y-6">
            {groupData && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('settings.account_settings.group_info.title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>{t('settings.account_settings.group_info.group_name')}</Label>
                            <span className="text-muted-foreground font-medium">{groupData.groupName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>{t('settings.account_settings.group_info.invite_code')}</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground font-mono bg-muted px-2 py-1 rounded">{groupData.invitationCode}</span>
                                <Button variant="ghost" size="icon" onClick={handleCopyInviteCode}><Copy className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.account_settings.actions.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="font-medium">Password</p>
                        <Button variant="outline" onClick={handlePasswordReset}>
                            <KeyRound className="mr-2 h-4 w-4"/> Send Reset Link
                        </Button>
                    </div>
                     <Separator />
                    <div className="flex items-center justify-between">
                        <p className="font-medium text-destructive">{t('settings.account_settings.actions.leave_group')}</p>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" disabled={!groupId || userData?.isAdmin}><LogOut className="mr-2 h-4 w-4"/> Leave</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{t('settings.account_settings.actions.leave_group_confirm_title')}</AlertDialogTitle>
                                    <AlertDialogDescription>{t('settings.account_settings.actions.leave_group_confirm_desc')}</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleLeaveGroup} className="bg-destructive hover:bg-destructive/90">Confirm Leave</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                         <p className="font-medium text-destructive">{t('settings.account_settings.actions.delete_account')}</p>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="text-white"><Trash2 className="mr-2 h-4 w-4"/> Delete Account</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{t('settings.account_settings.actions.delete_account_confirm_title')}</AlertDialogTitle>
                                    <AlertDialogDescription>{t('settings.account_settings.actions.delete_account_confirm_desc')}</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">Yes, Delete Everything</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>
          </div>
        </div>
    );
}

function AppSettings() {
    const { t, lang, setLang } = useI18n();

    return (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 items-start">
          <div className="md:col-span-1">
            <h2 className="text-xl font-bold flex items-center gap-2"><SettingsIcon /> {t('settings.app_settings.title')}</h2>
            <p className="text-muted-foreground">Customize the application's look and feel.</p>
          </div>
          <div className="md:col-span-2 space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>{t('settings.app_settings.appearance.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="dark-mode" className="flex items-center gap-2">
                           <Palette /> {t('settings.app_settings.appearance.dark_mode')}
                        </Label>
                        <ThemeSwitcher />
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>{t('settings.app_settings.language.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="language" className="flex items-center gap-2">
                           <Languages /> Select Language
                        </Label>
                        <Select onValueChange={(value: 'en' | 'bn') => setLang(value)} value={lang}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Language" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">{t('settings.app_settings.language.english')}</SelectItem>
                                <SelectItem value="bn">{t('settings.app_settings.language.bangla')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>{t('settings.app_settings.notifications.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="meal-reminders">{t('settings.app_settings.notifications.meal_reminders')}</Label>
                        <Switch id="meal-reminders" />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="expense-alerts">{t('settings.app_settings.notifications.expense_alerts')}</Label>
                        <Switch id="expense-alerts" defaultChecked/>
                    </div>
                </CardContent>
            </Card>
          </div>
        </div>
    );
}

export function Settings() {
  const { user, isUserLoading } = useUser();
  const { t } = useI18n();

  const userRef = useMemo(() => (user ? doc(firestore, "users", user.uid) : null), [user]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userRef);

  const groupId = userData?.groupId;

  const groupRef = useMemo(() => (groupId ? doc(firestore, `groups`, groupId) : null), [groupId]);
  const { data: groupData, isLoading: isGroupDataLoading } = useDoc(groupRef);

  const membersQuery = useMemo(() => (groupId ? query(collection(firestore, `groups/${groupId}/members`), where('status', '==', 'active')) : null), [groupId]);
  const { data: members, isLoading: areMembersLoading } = useCollection(membersQuery);


  const isLoading = isUserLoading || isUserDataLoading || (groupId && (isGroupDataLoading || areMembersLoading));

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  const isUserAdmin = userData?.isAdmin ?? false;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">{t('settings.title')}</h1>
        <p className="text-muted-foreground">{t('settings.description')}</p>
      </div>
      
      <AppSettings />
      
      {user && <AccountSettings user={user} userData={userData} groupData={groupData} groupId={groupId}/>}
      
      {isUserAdmin && groupData && members && (
        <>
            
            <AdminControls groupData={groupData} members={members} groupId={groupId!} />
        </>
      )}
    </div>
  );
}
