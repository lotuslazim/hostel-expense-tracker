
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, ShieldCheck, User, Copy, Utensils, DollarSign, ShoppingCart } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useMemo } from "react";
import placeholderImages from "@/lib/placeholder-images.json";
import { useFirebase, useUser, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

// In a real app, this would be fetched or calculated
const MOCK_MEMBER_DETAILS = {
  '1': { meals: 84, expenses: 12500, purchases: 15 },
  '2': { meals: 75, expenses: 9500, purchases: 12 },
  '3': { meals: 80, expenses: 11000, purchases: 18 },
};

type Member = { id: string; name: string; email: string; role: string; avatarId: string; };

export default function AdminPage() {
  const { firestore } = useFirebase();
  const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // 1. Get current user's profile to find their groupId
  const currentUserRef = useMemoFirebase(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData, isLoading: isCurrentUserDataLoading } = useDoc(currentUserRef);

  const groupId = currentUserData?.groupId;

  // 2. Get the group document
  const groupRef = useMemoFirebase(() => groupId ? doc(firestore, "groups", groupId) : null, [firestore, groupId]);
  const { data: groupData, isLoading: isGroupLoading } = useDoc(groupRef);

  const memberIds = useMemo(() => groupData?.memberIds || [], [groupData]);

  // 3. Get all members of the group
  const membersQuery = useMemoFirebase(
    () =>
      memberIds.length > 0
        ? query(collection(firestore, 'users'), where('__name__', 'in', memberIds))
        : null,
    [firestore, memberIds]
  );
  const { data: membersData, isLoading: areMembersLoading } = useCollection(membersQuery);

  const handleRowClick = (member: Member) => {
    setSelectedMember(member);
  };

  const getAvatar = (avatarId: string) => {
    return placeholderImages.placeholderImages.find(p => p.id === avatarId);
  };
  
  const memberDetails = selectedMember ? MOCK_MEMBER_DETAILS[selectedMember.id as keyof typeof MOCK_MEMBER_DETAILS] : null;

  const isLoading = isCurrentUserLoading || isCurrentUserDataLoading || isGroupLoading || areMembersLoading;
  
  const members = useMemo(() => {
    if (!membersData || !groupData) return [];
    return membersData.map(member => ({
      id: member.id,
      name: member.email.split('@')[0], // Placeholder name
      email: member.email,
      role: groupData.adminId === member.id ? 'Admin' : 'Member',
      avatarId: 'user-avatar', // Placeholder avatar
    }));
  }, [membersData, groupData]);

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
            <p className="text-lg font-semibold">{groupData?.memberIds?.length || 0}</p>
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
                <Button size="icon" className="h-12 w-12" onClick={() => navigator.clipboard.writeText(groupData?.invitationCode)}>
                  <span className="sr-only">Copy</span>
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
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
                      <DollarSign className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Total Expenses</p>
                      <p className="text-2xl font-bold">Tk{memberDetails.expenses.toLocaleString()}</p>
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
        </CardContent>
      </Card>
    </div>
  );
}
    