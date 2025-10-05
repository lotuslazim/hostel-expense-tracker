
"use client";

import { useMemo } from "react";
import { useUser, useDoc, useFirebase, useCollection } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import { AppHeader } from "@/components/app/header";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileDown, Users, Shield, Copy, Edit, UserPlus, Settings, BarChart2, Package, MessageSquare } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";


function AdminProfilePageSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-4 w-72 mt-2" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
      <Skeleton className="h-96 rounded-lg" />
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

function AdminProfilePageContent() {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();

    const userDocRef = useMemo(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    
    const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

    const groupId = userData?.groupId;

    const groupDocRef = useMemo(() => {
        if (!groupId) return null;
        return doc(firestore, 'groups', groupId);
    }, [groupId, firestore]);

    const { data: groupData, isLoading: isGroupDataLoading } = useDoc(groupDocRef);
    
    const membersQuery = useMemo(() => {
        if (!groupId) return null;
        return query(collection(firestore, `groups/${groupId}/members`));
    }, [groupId, firestore]);

    const { data: members, isLoading: areMembersLoading } = useCollection(membersQuery);

    const isLoading = isUserLoading || isUserDataLoading || isGroupDataLoading || areMembersLoading;
    
    if (isLoading) {
        return <AdminProfilePageSkeleton />;
    }

    if (!userData?.isAdmin) {
        return <AccessDenied />;
    }
    
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Admin Profile</h1>
                <p className="text-muted-foreground">Manage your group, members, and settings.</p>
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
                        <Button variant="ghost" size="icon">
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
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={member.photoURL} />
                                                    <AvatarFallback>{member.displayName?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span>{member.displayName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{member.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>{member.role}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Admin Actions</CardTitle>
                        <CardDescription>Control your group's settings and data.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button variant="outline" className="w-full justify-start gap-2"><Settings className="h-4 w-4"/> Manage Meal Types</Button>
                        <Button variant="outline" className="w-full justify-start gap-2"><Package className="h-4 w-4"/> Edit Purchased Items</Button>
                        <Button variant="outline" className="w-full justify-start gap-2"><FileDown className="h-4 w-4"/> Export Group Data</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}


export default function AdminProfilePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminProfilePageContent />
      </main>
    </div>
  );
}
