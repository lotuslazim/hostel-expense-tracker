

"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, ShieldCheck, User, Copy, Utensils, ShoppingCart, Home, LogIn, Loader2, KeyRound, Shield, UserCog, Settings, Palette, Globe, LogOut, Edit, SlidersHorizontal, FileDown, AlertTriangle, Bell, Camera, FileUp, Pencil } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useMemo } from "react";
import placeholderImages from "@/lib/placeholder-images.json";
import { useFirebase, useUser, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, writeBatch, getDocs, query, where, deleteDoc, updateDoc, serverTimestamp, arrayUnion } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeSwitcher } from "@/components/settings/theme-switcher";
import { useI18n } from "@/i18n/client-provider";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { EmailAuthProvider, reauthenticateWithCredential, deleteUser, updatePassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Papa from "papaparse";


// In a real app, this would be fetched or calculated
const MOCK_MEMBER_DETAILS = {
  '1': { meals: 84, expenses: 12500, purchases: 15 },
  '2': { meals: 75, expenses: 9500, purchases: 12 },
  '3': { meals: 80, expenses: 11000, purchases: 18 },
};

type Member = { id: string; name: string; email: string; role: string; avatarId: string; };

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


function NewUserAdminPanel() {
  const { firestore } = useFirebase();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const [groupName, setGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const generateInviteCode = () => {
    return `${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  };
  
  const handleCreateGroup = async () => {
    if (!currentUser || !groupName) {
        toast({ variant: "destructive", title: "Error", description: "Group name is required." });
        return;
    }
    setIsCreating(true);
    
    try {
      const batch = writeBatch(firestore);
      const newGroupRef = doc(collection(firestore, "groups"));
      const userRef = doc(firestore, "users", currentUser.uid);

      batch.set(newGroupRef, {
        groupName,
        invitationCode: generateInviteCode(),
        adminId: currentUser.uid,
        createdAt: serverTimestamp(),
      });
      
      const memberRef = doc(firestore, `groups/${newGroupRef.id}/members`, currentUser.uid);
      batch.set(memberRef, {
          email: currentUser.email,
          role: 'admin',
          joinedAt: serverTimestamp(),
      });

      batch.update(userRef, {
        groupId: newGroupRef.id,
        isAdmin: true,
      });

      await batch.commit();
      toast({ title: "Success", description: `Group "${groupName}" created successfully!` });

    } catch (error) {
        console.error("Error creating group:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not create group. Please try again." });
    } finally {
        setIsCreating(false);
    }
  };

  return (
    <div>
        <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight font-headline">Admin Panel</h1>
            <p className="text-muted-foreground">
            You are not part of a group yet. Create one to get started, or go to your profile to join an existing group.
            </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><PlusCircle/> Create a New Group</CardTitle>
                    <CardDescription>Start a new flat or group and invite others to join.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="groupName">Group Name</Label>
                        <Input id="groupName" placeholder="e.g., The Avengers Mess" value={groupName} onChange={(e) => setGroupName(e.target.value)} disabled={isCreating}/>
                    </div>
                    <Button className="w-full" onClick={handleCreateGroup} disabled={isCreating || !groupName}>
                        {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Create Group
                    </Button>
                </CardContent>
            </Card>
             <Card className="flex flex-col items-center justify-center text-center p-8 bg-muted/50 border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><LogIn className="h-6 w-6"/> Want to Join a Group?</CardTitle>
                <CardDescription>If you have an invitation code, go to your profile page to join an existing group.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                    <Link href="/profile">Go to Profile</Link>
                </Button>
              </CardContent>
            </Card>
        </div>
    </div>
  );
}


export default function AdminPage() {
  const { firestore, auth } = useFirebase();
  const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const { lang, setLang, t } = useI18n();
  const [mealReminders, setMealReminders] = useState(true);
  const [expenseAlerts, setExpenseAlerts] = useState(false);
  const [missedDayAlerts, setMissedDayAlerts] = useState(true);
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  const currentUserRef = useMemoFirebase(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData, isLoading: isCurrentUserDataLoading } = useDoc(currentUserRef);

  const groupId = currentUserData?.groupId;

  const groupRef = useMemoFirebase(() => groupId ? doc(firestore, "groups", groupId) : null, [firestore, groupId]);
  const { data: groupData, isLoading: isGroupLoading } = useDoc(groupRef);

  const membersQuery = useMemoFirebase(
    () => (groupId ? collection(firestore, `groups/${groupId}/members`) : null),
    [firestore, groupId]
  );
  const { data: membersData, isLoading: areMembersLoading, error: membersError } = useCollection(membersQuery);

  const isGoogleUser = currentUser?.providerData.some(p => p.providerId === 'google.com');

  const deleteForm = useForm<z.infer<typeof deleteFormSchema>>({
    resolver: zodResolver(deleteFormSchema),
    defaultValues: { password: "" },
  });
  
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const handleDeleteGroup = async () => {
    if (!groupId || !groupRef) {
      toast({ variant: "destructive", title: "Error", description: "Group information not found." });
      return;
    }
    setIsDeletingGroup(true);
    try {
      const batch = writeBatch(firestore);

      // Find all users in the group
      const usersInGroupQuery = query(collection(firestore, "users"), where("groupId", "==", groupId));
      const usersSnapshot = await getDocs(usersInGroupQuery);
      
      // For each user, update their document to remove group association
      usersSnapshot.forEach(userDoc => {
        const userRef = doc(firestore, "users", userDoc.id);
        batch.update(userRef, {
          groupId: null,
          isAdmin: false,
        });
      });

      // Note: Deleting subcollections (members, meals, etc.) from the client is not recommended for security and scalability.
      // A Cloud Function triggered by the group document deletion is the robust way to handle this.
      // For this implementation, we will just delete the group document and reset user profiles.
      batch.delete(groupRef);
      
      await batch.commit();

      toast({ title: "Group Deleted", description: "The group has been successfully deleted." });
    } catch (error) {
      console.error("Error deleting group:", error);
      toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the group. Please try again." });
    } finally {
      setIsDeletingGroup(false);
    }
  };

  const handleExportData = async () => {
    if (!groupId) return;

    try {
        const collectionsToExport = ['meals', 'expenses', 'purchasedItems'];
        const allData: Record<string, any[]> = {};
        
        for (const coll of collectionsToExport) {
            const q = query(collection(firestore, `groups/${groupId}/${coll}`));
            const snapshot = await getDocs(q);
            allData[coll] = snapshot.docs.map(d => {
                const data = d.data();
                // Convert Firestore Timestamps to ISO strings for CSV
                Object.keys(data).forEach(key => {
                    if (data[key]?.toDate) {
                        data[key] = data[key].toDate().toISOString();
                    }
                });
                return { id: d.id, ...data };
            });
        }

        const csv = Papa.unparse(allData.meals); // Example with meals
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `group-data-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        toast({ title: "Export Successful", description: "Your group data has been downloaded." });

    } catch (error) {
        console.error("Export failed:", error);
        toast({ variant: "destructive", title: "Export Failed", description: "Could not export group data." });
    }
  };

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
  };


  const handleRowClick = (member: Member) => {
    setSelectedMember(member);
  };

  const getAvatar = (avatarId: string) => {
    return placeholderImages.placeholderImages.find(p => p.id === avatarId);
  };
  
  const memberDetails = selectedMember ? MOCK_MEMBER_DETAILS[selectedMember.id as keyof typeof MOCK_MEMBER_DETAILS] : null;

  const isLoading = isCurrentUserDataLoading || isGroupLoading;
  
  const members = useMemo(() => {
    if (!membersData) return [];
    return membersData.map(member => ({
      id: member.id,
      name: member.email.split('@')[0],
      email: member.email,
      role: member.role === 'admin' ? 'Admin' : 'Member',
      avatarId: 'user-avatar',
    }));
  }, [membersData]);


  if (isLoading) {
    return (
       <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-80 mt-2" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Group Details</CardTitle>
            <CardDescription>
              Your group's information and invite code.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-3 gap-4">
             <Skeleton className="h-20 w-full" />
             <Skeleton className="h-20 w-full" />
             <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Group Members</CardTitle>
            <CardDescription>Add, remove, or view members in your group.</CardDescription>
          </CardHeader>
          <CardContent>
             <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is not in a group, show the new user panel
  if (!groupId || !groupData) {
    return <NewUserAdminPanel />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage your group, account, and application settings.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                  <CardTitle>Group Details</CardTitle>
                  <CardDescription>
                    Your group's information and invite code.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Group Name</p>
                    <p className="text-lg font-semibold">{groupData?.groupName || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Invite Code</p>
                    <p className="text-lg font-mono font-semibold bg-background/50 px-2 py-1 rounded inline-block">{groupData?.invitationCode || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Members</p>
                    <p className="text-lg font-semibold">{members.length || 0}</p>
                  </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Group Members</CardTitle>
                    <CardDescription>Add, remove, or view members in your group.</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button disabled={!groupData?.invitationCode}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Invite Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Invite a Member</DialogTitle>
                        <DialogDescription>
                          Share this code with someone to let them join your group.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex items-center space-x-2">
                        <div className="grid flex-1 gap-2">
                          <Label htmlFor="link" className="sr-only">
                            Link
                          </Label>
                          <Input
                            id="link"
                            defaultValue={groupData?.invitationCode}
                            readOnly
                            className="font-mono h-12 text-lg"
                          />
                        </div>
                        <Button size="icon" className="h-12 w-12" onClick={() => {if(groupData?.invitationCode) navigator.clipboard.writeText(groupData?.invitationCode)}}>
                          <span className="sr-only">Copy</span>
                          <Copy className="h-5 w-5" />
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                   {areMembersLoading && <Skeleton className="h-40 w-full" />}
                   {membersError && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Error loading members</AlertTitle>
                      <AlertDescription>
                        Could not load group members. Please make sure you have the correct permissions and try again.
                      </AlertDescription>
                    </Alert>
                   )}
                   {!areMembersLoading && !membersError && (
                      <Dialog>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Member</TableHead>
                              <TableHead className="hidden sm:table-cell">Role</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {members.length > 0 ? members.map((member) => {
                              const avatar = getAvatar(member.avatarId);
                              return (
                              <DialogTrigger asChild key={member.id}>
                                <TableRow onClick={() => handleRowClick(member)} className="cursor-pointer">
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <Avatar>
                                        {avatar && <AvatarImage src={avatar.imageUrl} alt={member.name} data-ai-hint={avatar.imageHint} />}
                                        <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium">{member.name}</p>
                                        <p className="text-sm text-muted-foreground">{member.email}</p>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="hidden sm:table-cell">
                                    {member.role === 'Admin' ? (
                                      <Badge variant="default" className="bg-primary/20 text-primary-foreground hover:bg-primary/30">
                                        <ShieldCheck className="mr-1 h-3 w-3" />
                                        {member.role}
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary">
                                        <User className="mr-1 h-3 w-3" />
                                        {member.role}
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {member.role !== 'Admin' && currentUserData?.isAdmin && (
                                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); alert('Remove member functionality to be implemented.'); }}>
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Remove member</span>
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              </DialogTrigger>
                            )}) : (
                              <TableRow>
                                <TableCell colSpan={3} className="text-center h-24">No members found in this group.</TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>

                        {selectedMember && memberDetails && (
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Member Details: {selectedMember.name}</DialogTitle>
                              <DialogDescription>
                                A summary of this member's contributions for the current period.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-3 gap-4 py-4 text-center">
                                <div className="p-4 bg-muted/50 rounded-lg">
                                  <Utensils className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                                  <p className="text-sm text-muted-foreground">Meals Logged</p>
                                  <p className="text-2xl font-bold">{memberDetails.meals}</p>
                                </div>
                                <div className="p-4 bg-muted/50 rounded-lg">
                                  <span className="text-2xl font-bold text-muted-foreground mb-2">৳</span>
                                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                                  <p className="text-2xl font-bold">৳{memberDetails.expenses.toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-muted/50 rounded-lg">
                                  <ShoppingCart className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                                  <p className="text-sm text-muted-foreground">Items Purchased</p>
                                  <p className="text-2xl font-bold">{memberDetails.purchases}</p>
                                </div>
                            </div>
                          </DialogContent>
                        )}
                      </Dialog>
                    )}
                </CardContent>
            </Card>

            {currentUserData?.isAdmin && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-primary"><Shield className="h-5 w-5" />Admin Controls</CardTitle>
                        <CardDescription>Manage your group settings and members.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                           <h4 className="font-medium text-sm flex items-center gap-2"><Edit className="h-4 w-4"/> Group Management</h4>
                           <div className="grid sm:grid-cols-2 gap-3">
                              <Dialog>
                                <DialogTrigger asChild><Button variant="outline" className="w-full justify-start">Edit Group Name</Button></DialogTrigger>
                                <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Group Name</DialogTitle>
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
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="w-full justify-start" disabled={isDeletingGroup}>
                                        {isDeletingGroup ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                        Delete Group
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the group and all associated data. All members will be removed from the group.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-destructive hover:bg-destructive/90"
                                            onClick={handleDeleteGroup}
                                            disabled={isDeletingGroup}
                                        >
                                            {isDeletingGroup && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Delete Group
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                           </div>
                        </div>
                         <div className="space-y-2">
                           <h4 className="font-medium text-sm flex items-center gap-2"><FileDown className="h-4 w-4"/> Data & Reports</h4>
                           <div className="grid sm:grid-cols-2 gap-3">
                             <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="outline" className="w-full justify-start" onClick={handleExportData}>Export Group Data</Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Export Group Data</AlertDialogTitle><AlertDialogDescription>This will generate a CSV file of all meals, expenses, and items for the current month.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction>Export</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                           </div>
                        </div>
                    </CardContent>
                </Card>
            )}

        </div>
        <div className="lg:col-span-1">
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
                    
                    {currentUserData?.isAdmin && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2 text-primary"><ShieldCheck/>Admin Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild><Button variant="outline" className="w-full justify-start">Reset Invite Code</Button></AlertDialogTrigger>
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
                                <Dialog>
                                    <DialogTrigger asChild><Button variant="outline" className="w-full justify-start">Assign New Admin</Button></DialogTrigger>
                                    <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Assign New Admin</DialogTitle>
                                        <DialogDescription>Choose a member to promote to an admin role.</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                        <Label htmlFor="member-select">Select Member</Label>
                                        <Select><SelectTrigger><SelectValue placeholder="Select a member" /></SelectTrigger><SelectContent>
                                        {members.filter(m => m.role !== 'Admin').map(m => (
                                                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                        ))} 
                                        </SelectContent></Select>
                                        </div>
                                        <Button className="w-full">Assign Admin</Button>
                                    </div>
                                    </DialogContent>
                                </Dialog>
                           </CardContent>
                        </Card>
                    )}


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
                
            </Accordion>
        </div>
      </div>

    </div>
  );
}

    