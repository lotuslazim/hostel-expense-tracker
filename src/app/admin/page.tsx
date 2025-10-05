
"use client";

import { useUser, useDoc, useFirebase, useCollection } from "@/firebase";
import { doc, collection, query } from "firebase/firestore";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, Home, BarChart, Building } from "lucide-react";
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

function NewUserAdminPanel() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Welcome to BachelorBite!</h1>
      <p className="text-muted-foreground">Please create or join a group to get started.</p>
      {/* A more descriptive welcome card or instructions can go here */}
       <Card className="max-w-2xl mx-auto mt-8 text-center shadow-lg">
            <CardHeader>
                <CardTitle className="text-3xl font-headline">Get Started</CardTitle>
                <CardDescription className="text-md pt-2">
                    It looks like you&apos;re not part of a group yet.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Create a new group to start tracking meals and expenses, or join an existing one if you have an invitation code.
                </p>
            </CardContent>
        </Card>
    </div>
  );
}

function AdminPanel() {
    const { firestore } = useFirebase();
    
    const usersQuery = useMemo(() => collection(firestore, 'users'), [firestore]);
    const groupsQuery = useMemo(() => collection(firestore, 'groups'), [firestore]);
    const expensesQuery = useMemo(() => collection(firestore, 'expenses'), [firestore]); // Note: This might be slow if there are many groups. A better approach would be a separate summary collection.

    const { data: users, isLoading: usersLoading } = useCollection(usersQuery);
    const { data: groups, isLoading: groupsLoading } = useCollection(groupsQuery);
    const { data: expenses, isLoading: expensesLoading } = useCollection(expensesQuery);
    
    const totalExpenses = useMemo(() => expenses?.reduce((sum, expense) => sum + expense.amount, 0) ?? 0, [expenses]);

    const chartData = useMemo(() => {
        return groups?.map(group => ({
            name: group.groupName.length > 15 ? `${group.groupName.substring(0,12)}...` : group.groupName,
            members: users?.filter(u => u.groupId === group.id).length ?? 0
        })) ?? [];
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

            {/* ====== Summary Cards ====== */}
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
                {/* ====== User Management Table ====== */}
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

                {/* ====== Group Stats Chart ====== */}
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

export default function AdminPage() {
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
    
    // An admin should always have a group, but we handle the edge case.
    // The main check is if they are an admin.
    const isUserAdmin = userData?.isAdmin ?? false;

    if (!user) {
        return <AdminPageSkeleton />;
    }
    
    if (isUserAdmin) {
        return <AdminPanel />;
    } else {
        // Show a non-admin view or redirect. For now, a simple message.
        return (
            <div className="text-center py-16">
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">You do not have administrative privileges.</p>
            </div>
        );
    }
}

    