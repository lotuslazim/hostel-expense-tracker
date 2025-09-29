
"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, User, Copy, Loader2, KeyRound, Shield, UserCog, Settings, Palette, Globe, LogOut, Edit, AlertTriangle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useMemo } from "react";
import placeholderImages from "@/lib/placeholder-images.json";
import { useFirebase, useUser, useDoc, useCollection } from "@/firebase";
import { doc, collection, writeBatch, getDocs, query, where, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { WelcomeCard } from "@/components/app/welcome-card";
import { useRouter } from "next/navigation";

function NewUserAdminPanel() {
  const { firestore } = useFirebase();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [groupName, setGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
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
          displayName: currentUser.displayName,
          id: currentUser.uid
      });

      batch.update(userRef, {
        groupId: newGroupRef.id,
        isAdmin: true,
      });

      await batch.commit();
      toast({ title: "Success", description: `Group "${groupName}" created successfully!` });
      router.push('/dashboard');

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
            You&apos;re not part of a group yet. Create one or go to your profile to join one.
            </p>
        </div>
        <Card className="max-w-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><PlusCircle/> Create a New Group</CardTitle>
                <CardDescription>Start a new group and invite others to join.</CardDescription>
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
    </div>
  );
}


export default function AdminPage() {
  const { firestore } = useFirebase();
  const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();
  const { toast } = useToast();

  const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData, isLoading: isCurrentUserDataLoading } = useDoc(currentUserRef);

  const groupId = currentUserData?.groupId;

  const groupRef = useMemo(() => (groupId) ? doc(firestore, "groups", groupId) : null, [firestore, groupId]);
  const { data: groupData, isLoading: isGroupLoading } = useDoc(groupRef);

  const membersQuery = useMemo(
    () => (groupId ? collection(firestore, `groups/${groupId}/members`) : null),
    [firestore, groupId]
  );
  const { data: membersCollection, isLoading: areMembersLoading, error: membersError } = useCollection(membersQuery);
  
  const members = useMemo(() => {
    if (!membersCollection) return [];
    return membersCollection.map(member => ({
      id: member.id,
      name: member.displayName || member.email.split('@')[0],
      email: member.email,
      role: member.role === 'admin' ? 'Admin' : 'Member',
      avatarId: 'user-avatar',
    }));
  }, [membersCollection]);

  const isLoading = isCurrentUserLoading || isCurrentUserDataLoading || (!!groupId && (isGroupLoading || areMembersLoading));

  if (isLoading) {
    return (
       <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-80 mt-2" />
        </div>
        <Card>
          <CardHeader><Skeleton className="h-20 w-full" /></CardHeader>
          <CardContent><Skeleton className="h-40 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  // If user is not in a group, show the new user panel
  if (!groupId || !currentUser) {
    return <NewUserAdminPanel />;
  }

  if (!groupData) {
     return <WelcomeCard />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage your group members and settings.
        </p>
      </div>
        <Card>
            <CardHeader>
              <CardTitle>Group Details</CardTitle>
              <CardDescription>
                Your group&apos;s information and invite code.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Group Name</p>
                <p className="text-lg font-semibold">{groupData?.groupName || 'N/A'}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Invite Code</p>
                <div className="flex items-center gap-2">
                    <p className="text-lg font-mono font-semibold bg-background/50 px-2 py-1 rounded inline-block">{groupData?.invitationCode || 'N/A'}</p>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {if(groupData?.invitationCode) {
                        navigator.clipboard.writeText(groupData?.invitationCode);
                        toast({title: "Copied!", description: "Invite code copied to clipboard."})
                    }}}>
                        <Copy className="h-4 w-4"/>
                    </Button>
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Members</p>
                <p className="text-lg font-semibold">{members.length || 0}</p>
              </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Group Members</CardTitle>
                <CardDescription>View members in your group.</CardDescription>
            </CardHeader>
            <CardContent>
               {areMembersLoading && <Skeleton className="h-40 w-full" />}
               {membersError && (
                <div className="text-destructive">Error loading members.</div>
               )}
               {!areMembersLoading && !membersError && (
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
                          return (
                            <TableRow key={member.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarImage src={placeholderImages.placeholderImages.find(p => p.id === member.avatarId)?.imageUrl} />
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
                                  <Badge variant="outline" className="text-primary border-primary">
                                    <Shield className="mr-1 h-3 w-3" />
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
                                {member.id !== currentUser?.uid && currentUserData?.isAdmin && (
                                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); alert('Remove member functionality to be implemented.'); }}>
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Remove member</span>
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                        )}) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center h-24">No members found in this group.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    </div>
  );
}

    