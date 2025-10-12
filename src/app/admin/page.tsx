
"use client";

import { useUser, useDoc, useCollection } from "@/firebase";
import { firestore } from "@/firebase/config";
import { doc, collection, query, addDoc, serverTimestamp, updateDoc, where, getDocs, writeBatch, getDoc, setDoc } from "firebase/firestore";
import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, Home, Building, PlusCircle, LogIn, Loader2, Group, Copy, History } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppHeader } from "@/components/app/header";
import type { Member, User as UserType } from "@/lib/types";
import { User } from "firebase/auth";

function AdminPageSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-36 rounded-lg" />
        <Skeleton className="h-36 rounded-lg" />
        <Skeleton className="h-36 rounded-lg" />
      </div>
      <Card>
          <CardHeader>
              <Skeleton className="h-7 w-1/3" />
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
    </div>
  );
}

function NewUserAdminPanel({ user }: { user: User }) {
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
      const invitationCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const groupRef = await addDoc(collection(firestore, "groups"), {
        groupName: groupName,
        invitationCode: invitationCode,
        adminId: user.uid,
        createdAt: serverTimestamp(),
        settings: {
            mealTypes: ["Lunch", "Dinner"],
            isMealItemNameRequired: false,
            isExpenseDescriptionRequired: false,
            isUtilityReceiptRequired: false,
        }
      });
      
      const groupId = groupRef.id;

      const userRef = doc(firestore, "users", user.uid);
      const memberRef = doc(firestore, `groups/${groupId}/members`, user.uid);

      const batch = writeBatch(firestore);
      batch.update(userRef, { groupId: groupId, isAdmin: true });
      batch.set(memberRef, {
        role: "admin",
        status: "active",
        joinedAt: serverTimestamp(),
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
        const memberDoc = await getDoc(memberRef);

        const batch = writeBatch(firestore);
        
        batch.update(userRef, { groupId: groupId, isAdmin: false });

        if (memberDoc.exists()) {
            batch.update(memberRef, {
                status: 'active',
                leftAt: null,
                role: 'member'
            });
        } else {
            batch.set(memberRef, {
                role: "member",
                status: "active",
                joinedAt: serverTimestamp(),
            });
        }

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
        <h1 className="text-3xl font-bold font-headline">Get Started with Your Group</h1>
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

// A new component to render member rows, fetching user data individually.
function MemberRow({ member }: { member: Member }) {
    const userRef = useMemo(() => doc(firestore, 'users', member.id), [member.id]);
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
        );
    }
    
    if (!userData) return null; // Or some fallback UI

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
                <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                    {member.role === 'admin' ? 'Admin' : 'Member'}
                </Badge>
            </TableCell>
        </TableRow>
    );
}


function GroupDetailsPanel({ groupId }: { groupId: string }) {
    const { toast } = useToast();

    const groupRef = useMemo(() => doc(firestore, "groups", groupId), [groupId]);
    const { data: groupData, isLoading: isGroupDataLoading } = useDoc(groupRef);

    const membersQuery = useMemo(() => query(collection(firestore, `groups/${groupId}/members`)), [groupId]);
    const { data: members, isLoading: areMembersLoading } = useCollection<Member>(membersQuery);

    const activeMembers = useMemo(() => members?.filter(m => m.status === 'active'), [members]);
    const pastMembers = useMemo(() => members?.filter(m => m.status === 'inactive'), [members]);

    const handleCopyInviteCode = () => {
        if (groupData?.invitationCode) {
            navigator.clipboard.writeText(groupData.invitationCode);
            toast({ title: "Copied!", description: "Invite code copied to clipboard." });
        }
    };

    if (isGroupDataLoading || areMembersLoading) {
        return <AdminPageSkeleton />;
    }

    if (!groupData) {
        return (
            <div className="text-center py-16">
                <h1 className="text-2xl font-bold">Group Not Found</h1>
                <p className="text-muted-foreground">The group details could not be loaded.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline tracking-tight">Group Details</h1>
                <p className="text-muted-foreground">Information about your current group.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Group Name</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold">{groupData.groupName}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Active Members</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <p className="text-2xl font-semibold">{activeMembers?.length || 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Invite Code</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-2">
                        <Input value={groupData.invitationCode} readOnly className="font-mono"/>
                        <Button variant="outline" size="icon" onClick={handleCopyInviteCode}>
                            <Copy className="h-4 w-4"/>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Active Members</CardTitle>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {activeMembers?.map(member => (
                               <MemberRow key={member.id} member={member} />
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {pastMembers && pastMembers.length > 0 && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><History /> Past Members</CardTitle>
                        <CardDescription>Members who have previously left the group.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Table>
                           <TableHeader>
                               <TableRow>
                                   <TableHead>Name</TableHead>
                                   <TableHead>Email</TableHead>
                                   <TableHead>Status</TableHead>
                               </TableRow>
                           </TableHeader>
                           <TableBody>
                               {pastMembers.map(member => (
                                   <MemberRow key={member.id} member={member} />
                               ))}
                           </TableBody>
                       </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default function AdminPage() {
    const { user, isUserLoading } = useUser();

    const userDocRef = useMemo(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid);
    }, [user]);
    
    const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

    const isLoading = isUserLoading || isUserDataLoading;

    return (
        <div className="flex flex-col min-h-screen">
            <AppHeader />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isLoading ? (
                    <AdminPageSkeleton />
                ) : !user ? (
                    <div className="text-center py-16">
                       <h1 className="text-2xl font-bold">Authentication Error</h1>
                       <p className="text-muted-foreground">Please log in to access this page.</p>
                   </div>
                ) : userData?.groupId ? (
                    <GroupDetailsPanel groupId={userData.groupId} />
                ) : (
                    <NewUserAdminPanel user={user} />
                )}
            </main>
        </div>
    )
}
