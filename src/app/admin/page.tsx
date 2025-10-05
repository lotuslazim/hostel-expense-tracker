
"use client";

import { useUser, useDoc, useFirebase, useCollection } from "@/firebase";
import { doc, collection, query, addDoc, serverTimestamp, updateDoc, where, getDocs, writeBatch } from "firebase/firestore";
import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, Home, Building, PlusCircle, LogIn, Loader2, Group } from "lucide-react";
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppHeader } from "@/components/app/header";

function AdminPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="mb-8">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton className="h-96 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    </div>
  );
}

function NewUserAdminPanel({ user }: { user: any }) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({ variant: "destructive", title: "Group name is required." });
      return;
    }
    if (!user) return;
    setIsCreating(true);
    try {
      // Create invitation code
      const invitationCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Create group document
      const groupRef = await addDoc(collection(firestore, "groups"), {
        groupName: groupName,
        invitationCode: invitationCode,
        adminId: user.uid,
        createdAt: serverTimestamp(),
        settings: { // Default settings
            mealTypes: ["Lunch", "Dinner"],
            isMealItemNameRequired: false,
            isExpenseDescriptionRequired: false,
            isUtilityReceiptRequired: false,
        }
      });
      
      const groupId = groupRef.id;

      // Update user document with groupId and set as admin
      const userRef = doc(firestore, "users", user.uid);
      const memberRef = doc(firestore, `groups/${groupId}/members`, user.uid);

      const batch = writeBatch(firestore);
      batch.update(userRef, { groupId: groupId, isAdmin: true });
      batch.set(memberRef, {
        id: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: "admin",
        joinedAt: serverTimestamp()
      });

      await batch.commit();

      toast({ title: "Group Created!", description: `The group "${groupName}" has been successfully created.` });
    } catch (error) {
      console.error("Error creating group:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not create group." });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) {
      toast({ variant: "destructive", title: "Invite code is required." });
      return;
    }
    if (!user) return;
    setIsJoining(true);

    try {
      const groupsRef = collection(firestore, "groups");
      const q = query(groupsRef, where("invitationCode", "==", inviteCode.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({ variant: "destructive", title: "Invalid Code", description: "No group found with that invite code." });
        setIsJoining(false);
        return;
      }

      const groupDoc = querySnapshot.docs[0];
      const groupId = groupDoc.id;
      
      const userRef = doc(firestore, "users", user.uid);
      const memberRef = doc(firestore, `groups/${groupId}/members`, user.uid);

      const batch = writeBatch(firestore);
      batch.update(userRef, { groupId: groupId, isAdmin: false }); // New members are not admins by default
      batch.set(memberRef, {
        id: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: "member",
        joinedAt: serverTimestamp()
      });

      await batch.commit();
      
      toast({ title: "Welcome to the Group!", description: `You have successfully joined "${groupDoc.data().groupName}".` });

    } catch (error) {
      console.error("Error joining group: ", error);
      toast({ variant: "destructive", title: "Error", description: "Could not join the group." });
    } finally {
      setIsJoining(false);
    }
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="text-center mb-8">
        <Group className="h-12 w-12 mx-auto text-primary mb-4" />
        <h1 className="text-3xl font-bold font-headline">Admin Panel</h1>
        <p className="text-muted-foreground mt-2 max-w-md">
          A group allows you and your roommates to track meals and manage shared expenses together.
        </p>
      </div>

      <Tabs defaultValue="create" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">
            <PlusCircle className="mr-2 h-4 w-4" /> Create Group
          </TabsTrigger>
          <TabsTrigger value="join">
            <LogIn className="mr-2 h-4 w-4" /> Join Group
          </TabsTrigger>
        </TabsList>
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create a New Group</CardTitle>
              <CardDescription>Start a new hostel group and invite your roommates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Enter Hostel or Group Name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
              <Button onClick={handleCreateGroup} className="w-full" disabled={isCreating}>
                {isCreating && <Loader2 className="mr-2 animate-spin" />}
                Create & Become Admin
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="join">
          <Card>
            <CardHeader>
              <CardTitle>Join an Existing Group</CardTitle>
              <CardDescription>Use an invite code from a roommate to join their group.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Enter Invite Code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="font-mono tracking-widest text-center"
              />
              <Button onClick={handleJoinGroup} variant="secondary" className="w-full" disabled={isJoining}>
                {isJoining && <Loader2 className="mr-2 animate-spin" />}
                Join Group
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AdminPanel() {
    const { firestore } = useFirebase();
    
    // Note: This is a simplified query. For a large app, querying all users/groups/expenses is inefficient.
    // This should be replaced with more targeted queries or summary collections in a production scenario.
    const usersQuery = useMemo(() => collection(firestore, 'users'), [firestore]);
    const groupsQuery = useMemo(() => collection(firestore, 'groups'), [firestore]);
    const expensesQuery = useMemo(() => collection(firestore, 'expenses'), [firestore]);

    const { data: users, isLoading: usersLoading } = useCollection(usersQuery);
    const { data: groups, isLoading: groupsLoading } = useCollection(groupsQuery);
    const { data: expenses, isLoading: expensesLoading } = useCollection(expensesQuery);
    
    const totalExpenses = useMemo(() => expenses?.reduce((sum, expense) => sum + expense.amount, 0) ?? 0, [expenses]);

    const chartData = useMemo(() => {
        if (!groups || !users) return [];
        return groups.map(group => ({
            name: group.groupName.length > 15 ? `${group.groupName.substring(0,12)}...` : group.groupName,
            members: users.filter(u => u.groupId === group.id).length
        }));
    }, [groups, users]);


    if (usersLoading || groupsLoading || expensesLoading) {
        return <AdminPageSkeleton />;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">Oversee users, groups, and expenses across the app.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users?.length ?? 0}</div>
                        <p className="text-xs text-muted-foreground">All registered users</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">৳{totalExpenses.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Across all groups</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Groups</CardTitle>
                        <Home className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{groups?.length ?? 0}</div>
                         <p className="text-xs text-muted-foreground">Hostels currently managed</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>User Management</CardTitle>
                        <CardDescription>View and manage all registered users.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Group Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users?.map(user => {
                                    const userGroup = groups?.find(g => g.id === user.groupId);
                                    return (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={user.photoURL} alt={user.displayName} />
                                                        <AvatarFallback>{user.displayName?.charAt(0) ?? 'U'}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">{user.displayName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                            <TableCell>
                                                {user.groupId ? (
                                                    <Badge variant="secondary">{userGroup?.groupName ?? "In a group"}</Badge>
                                                ) : (
                                                    <Badge variant="outline">No Group</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                         <CardTitle className="flex items-center gap-2"><Building /> Group Overview</CardTitle>
                        <CardDescription>Member distribution across groups.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ResponsiveContainer width="100%" height={300}>
                            <RechartsBarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false}/>
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                    color: 'hsl(var(--foreground))'
                                  }}
                                  labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                                />
                                <Bar dataKey="members" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

const AdminPageContent = () => {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();

    const userDocRef = useMemo(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    
    const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

    const isLoading = isUserLoading || isUserDataLoading;
    
    if (isLoading) {
        return <AdminPageSkeleton />;
    }
    
    if (!user) {
        // This case should ideally not happen if routes are protected, but as a fallback:
        return (
             <div className="text-center py-16">
                <h1 className="text-2xl font-bold">Authentication Error</h1>
                <p className="text-muted-foreground">Please log in to access this page.</p>
            </div>
        )
    }
    
    const hasGroup = !!userData?.groupId;
    const isUserAdmin = userData?.isAdmin ?? false;

    if (isUserAdmin) {
        return <AdminPanel />;
    } else if (!hasGroup) {
        return <NewUserAdminPanel user={user} />;
    } else {
        // A regular member is in a group but not an admin.
        return (
            <div className="text-center py-16">
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">You do not have administrative privileges.</p>
            </div>
        );
    }
}


export default function AdminPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <AppHeader />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AdminPageContent />
            </main>
        </div>
    )
}

    