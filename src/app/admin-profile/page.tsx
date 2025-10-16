
"use client";

import { useMemo, useState } from "react";
import { useUser, useDoc, useCollection } from "@/firebase";
import { firestore } from "@/firebase/config";
import { doc, collection, query, updateDoc, arrayUnion, arrayRemove, getDocs, where, Timestamp } from "firebase/firestore";
import { AppHeader } from "@/components/app/header";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileDown, Users, Shield, Copy, Settings, Package, Plus, Trash2, Loader2, Info } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { startOfMonth } from 'date-fns/startOfMonth';
import { endOfMonth } from 'date-fns/endOfMonth';
import { format } from 'date-fns/format';
import type { Member, User as UserType } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";


function AdminProfilePageSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
            <CardHeader>
                <Skeleton className="h-7 w-2/3" />
                <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead><Skeleton className="h-5 w-24"/></TableHead>
                            <TableHead><Skeleton className="h-5 w-32"/></TableHead>
                            <TableHead><Skeleton className="h-5 w-16"/></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...Array(3)].map((_, i) => (
                             <TableRow key={i}>
                                 <TableCell>
                                     <div className="flex items-center gap-3">
                                         <Skeleton className="h-8 w-8 rounded-full" />
                                         <Skeleton className="h-5 w-28" />
                                     </div>
                                 </TableCell>
                                 <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                 <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                             </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <Skeleton className="h-7 w-1/3" />
                <Skeleton className="h-4 w-3/4 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AccessDenied() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <Alert variant="destructive" className="max-w-lg text-center">
                <Shield className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>
                    You do not have the necessary permissions to view this page. This area is for group administrators only.
                </AlertDescription>
            </Alert>
        </div>
    )
}

function MemberRow({ memberId, role }: { memberId: string, role: string }) {
    const userRef = useMemo(() => doc(firestore, 'users', memberId), [memberId]);
    const { data: userData, isLoading } = useDoc<UserType>(userRef);

    if (isLoading) {
        return (
             <TableRow>
                <TableCell>
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-5 w-28" />
                    </div>
                </TableCell>
                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
            </TableRow>
        )
    }

    if (!userData) return null;

    return (
        <TableRow>
            <TableCell>
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={userData.photoURL} />
                        <AvatarFallback>{userData.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{userData.displayName}</span>
                </div>
            </TableCell>
            <TableCell>{userData.email}</TableCell>
            <TableCell>
                <Badge variant={role === 'admin' ? 'default' : 'secondary'}>{role}</Badge>
            </TableCell>
        </TableRow>
    );
}


function AdminActionsCard({ groupDocRef, groupData, groupId }: { groupDocRef: any, groupData: any, groupId: string }) {
    const { toast } = useToast();
    const [newMealType, setNewMealType] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const [isMealItemNameRequired, setIsMealItemNameRequired] = useState(groupData?.settings?.isMealItemNameRequired ?? false);

    const handleMealItemNameRequiredToggle = async (checked: boolean) => {
        if (!groupDocRef) return;
        setIsUpdating(true);
        try {
            await updateDoc(groupDocRef, {
                "settings.isMealItemNameRequired": checked
            });
            setIsMealItemNameRequired(checked);
            toast({ title: "Setting Updated", description: `Meal item name is now ${checked ? 'required' : 'optional'}.` });
        } catch (error) {
            toast({ variant: "destructive", title: "Error updating setting." });
        } finally {
            setIsUpdating(false);
        }
    };
    
    const handleAddMealType = async () => {
        if (!newMealType.trim() || !groupDocRef) return;
        setIsUpdating(true);
        try {
            await updateDoc(groupDocRef, {
                "settings.mealTypes": arrayUnion(newMealType.trim())
            });
            toast({ title: "Meal Type Added" });
            setNewMealType("");
        } catch (error) {
            toast({ variant: "destructive", title: "Error adding meal type." });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRemoveMealType = async (mealType: string) => {
        if (!groupDocRef) return;
        setIsUpdating(true);
        try {
            await updateDoc(groupDocRef, {
                "settings.mealTypes": arrayRemove(mealType)
            });
            toast({ title: "Meal Type Removed" });
        } catch (error) {
            toast({ variant: "destructive", title: "Error removing meal type." });
        } finally {
            setIsUpdating(false);
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
            
            // CSV Headers
            const expenseHeaders = "Type,Date,Member,Item,Category,Amount\n";
            const mealHeaders = "Type,Date,Member,Meal Type,Meal Count,Item Name\n";

            // Process Expenses
            let expenseRows = expensesSnapshot.docs.map(doc => {
                const data = doc.data();
                const row = [
                    "Expense",
                    format(data.date.toDate(), 'yyyy-MM-dd'),
                    `"${data.userName}"`,
                    `"${data.expenseItem}"`,
                    data.category,
                    data.amount
                ];
                return row.join(",");
            }).join("\n");

            // Process Meals
            let mealRows = mealsSnapshot.docs.map(doc => {
                const data = doc.data();
                const row = [
                    "Meal",
                    format(data.date.toDate(), 'yyyy-MM-dd'),
                    `"${data.userName}"`,
                    data.mealType,
                    data.mealNumber,
                    `"${data.itemName || ''}"`
                ];
                return row.join(",");
            }).join("\n");
            
            const combinedHeaders = "Type,Date,Member,Details,Category/Type,Amount/Count,Meal Item\n";
             const combinedRows = [
                ...expensesSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return ["Expense", format(data.date.toDate(), 'yyyy-MM-dd'), `"${data.userName}"`, `"${data.expenseItem}"`, data.category, data.amount, ''].join(',');
                }),
                ...mealsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return ["Meal", format(data.date.toDate(), 'yyyy-MM-dd'), `"${data.userName}"`, `"${data.description}"`, data.mealType, data.mealNumber, `"${data.itemName || ''}"`].join(',');
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
        <Card>
            <CardHeader>
                <CardTitle>Admin Actions</CardTitle>
                <CardDescription>Control your group's settings and data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start gap-2"><Settings className="h-4 w-4"/> Manage Meal Types</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Manage Meal Types</DialogTitle>
                            <DialogDescription>
                                Add or remove meal types for your group members to log.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="flex gap-2">
                                <Input 
                                    value={newMealType}
                                    onChange={(e) => setNewMealType(e.target.value)}
                                    placeholder="e.g., Snack"
                                />
                                <Button onClick={handleAddMealType} disabled={isUpdating || !newMealType.trim()}>
                                    {isUpdating ? <Loader2 className="animate-spin" /> : <Plus />}
                                    <span className="ml-2">Add</span>
                                </Button>
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Existing Types</h4>
                                {groupData?.settings?.mealTypes?.map((type: string) => (
                                    <div key={type} className="flex items-center justify-between p-2 rounded-md bg-muted">
                                        <p className="font-medium">{type}</p>
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveMealType(type)} disabled={isUpdating}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                                {(!groupData?.settings?.mealTypes || groupData.settings.mealTypes.length === 0) && (
                                    <p className="text-sm text-muted-foreground text-center py-2">No meal types configured.</p>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                    <Label htmlFor="meal-item-required" className="flex flex-col gap-1">
                        <span>Require Meal Item Name</span>
                        <span className="text-xs font-normal text-muted-foreground">Makes the 'Item Name' field mandatory when logging a meal.</span>
                    </Label>
                    <Switch
                        id="meal-item-required"
                        checked={isMealItemNameRequired}
                        onCheckedChange={handleMealItemNameRequiredToggle}
                        disabled={isUpdating}
                    />
                </div>

                <Button variant="outline" className="w-full justify-start gap-2" disabled>
                    <Package className="h-4 w-4"/> Edit Purchased Items
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={handleExportData} disabled={isExporting}>
                    {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileDown className="mr-2 h-4 w-4"/>}
                    Export Group Data
                </Button>
            </CardContent>
        </Card>
    );
}

export default function AdminProfilePage() {
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();

    const userDocRef = useMemo(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid);
    }, [user]);
    
    const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

    const groupId = userData?.groupId;

    const groupDocRef = useMemo(() => {
        if (!groupId) return null;
        return doc(firestore, 'groups', groupId);
    }, [groupId]);

    const { data: groupData, isLoading: isGroupDataLoading } = useDoc(groupDocRef);
    
    const membersQuery = useMemo(() => {
        if (!groupId) return null;
        return query(collection(firestore, `groups/${groupId}/members`));
    }, [groupId]);

    const { data: members, isLoading: areMembersLoading } = useCollection<Member>(membersQuery);

    const handleCopyInviteCode = () => {
        if (groupData?.invitationCode) {
            navigator.clipboard.writeText(groupData.invitationCode);
            toast({ title: "Copied!", description: "Invite code copied to clipboard." });
        }
    };
    
    const isLoading = isUserLoading || isUserDataLoading || (!!groupId && (isGroupDataLoading || areMembersLoading));
    
    return (
        <div className="flex flex-col min-h-screen">
          <AppHeader />
          <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {isLoading ? <AdminProfilePageSkeleton /> :
            !userData?.isAdmin ? <AccessDenied /> :
            !groupId || !groupData || !members ? (
                 <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
                    <Alert className="max-w-lg text-center">
                        <Shield className="h-4 w-4" />
                        <AlertTitle>No Group Found</AlertTitle>
                        <AlertDescription>
                            You are an admin, but not currently part of a group. Please create or join a group first.
                        </AlertDescription>
                    </Alert>
                </div>
            ) : (
                <div className="space-y-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold font-headline">Admin Dashboard</h1>
                        <p className="text-sm md:text-base text-muted-foreground">Manage your group, members, and settings.</p>
                    </div>
        
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2"><Users/>Group Members</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">{members?.length || 0}</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Group Name</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">{groupData?.groupName}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Invitation Code</CardTitle>
                            </CardHeader>
                            <CardContent className="flex items-center gap-2">
                                <p className="text-2xl font-bold font-mono tracking-widest">{groupData?.invitationCode}</p>
                                <Button variant="ghost" size="icon" onClick={handleCopyInviteCode}>
                                    <Copy className="h-5 w-5"/>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
        
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Member Management</CardTitle>
                                <CardDescription>View and manage all members of your group.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Member</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Role</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {members?.map(member => (
                                            <MemberRow key={member.id} memberId={member.id} role={member.role} />
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
        
                        <AdminActionsCard groupDocRef={groupDocRef} groupData={groupData} groupId={groupId} />
                    </div>
                </div>
            )}
          </main>
        </div>
      );
}

    