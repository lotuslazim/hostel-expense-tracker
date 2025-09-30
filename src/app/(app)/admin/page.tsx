"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, User, Copy, Loader2, Shield, Utensils, X, SlidersHorizontal, ToggleRight, Check } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useMemo } from "react";
import { useFirebase, useUser, useDoc, useCollection } from "@/firebase";
import { doc, collection, writeBatch, updateDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { WelcomeCard } from "@/components/app/welcome-card";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// TypeScript Interfaces
interface GroupSettings {
  mealTypes: string[];
  isMealItemNameRequired: boolean;
  isExpenseDescriptionRequired: boolean;
}

interface Member {
  id: string;
  email?: string;
  displayName?: string;
  role: string;
}

interface ProcessedMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarId: string;
}

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

      batch.set(newGroupRef, {
        groupName,
        invitationCode: generateInviteCode(),
        adminId: currentUser.uid,
        createdAt: serverTimestamp(),
        settings: {
          mealTypes: ["Lunch", "Dinner"],
          isMealItemNameRequired: false,
          isExpenseDescriptionRequired: false,
        }
      });

      const memberRef = doc(firestore, `groups/${newGroupRef.id}/members`, currentUser.uid);
      batch.set(memberRef, {
        email: currentUser.email,
        role: 'admin',
        joinedAt: serverTimestamp(),
        displayName: currentUser.displayName || currentUser.email?.split('@')[0],
        id: currentUser.uid
      });

      const userRef = doc(firestore, "users", currentUser.uid);
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
          <CardTitle className="flex items-center gap-2">
            <PlusCircle /> Create a New Group
          </CardTitle>
          <CardDescription>Start a new group and invite others to join.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">Group Name</Label>
            <Input 
              id="groupName" 
              placeholder="e.g., The Avengers Mess" 
              value={groupName} 
              onChange={(e) => setGroupName(e.target.value)} 
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isCreating && groupName.trim()) {
                  handleCreateGroup();
                }
              }}
              disabled={isCreating}
            />
          </div>
          <Button 
            className="w-full" 
            onClick={handleCreateGroup} 
            disabled={isCreating || !groupName.trim()}
          >
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
  const [newMealType, setNewMealType] = useState("");
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  // All hooks at the top
  const currentUserRef = useMemo(() => 
    currentUser ? doc(firestore, "users", currentUser.uid) : null, 
    [firestore, currentUser]
  );
  const { data: currentUserData, isLoading: isCurrentUserDataLoading } = useDoc(currentUserRef);

  const groupId = currentUserData?.groupId;

  const groupRef = useMemo(() => 
    groupId ? doc(firestore, "groups", groupId) : null, 
    [firestore, groupId]
  );
  const { data: groupData, isLoading: isGroupLoading } = useDoc(groupRef);

  const membersQuery = useMemo(
    () => groupId ? collection(firestore, `groups/${groupId}/members`) : null,
    [firestore, groupId]
  );
  const { data: membersCollection, isLoading: areMembersLoading, error: membersError } = useCollection(membersQuery);

  const members: ProcessedMember[] = useMemo(() => {
    if (!membersCollection) return [];
    
    return membersCollection.map((member: Member) => {
      let name = 'Unknown User';
      if (member.displayName) {
        name = member.displayName;
      } else if (member.email) {
        name = member.email.split('@')[0];
      }
      
      const avatarId = `user-avatar-${member.id.substring(0, 4)}`;

      return {
        id: member.id,
        name,
        email: member.email || 'No email',
        role: member.role === 'admin' ? 'Admin' : 'Member',
        avatarId,
      };
    });
  }, [membersCollection]);

  const handleUpdateSettings = async (newSettings: Partial<GroupSettings>) => {
    if (!groupRef || !groupData) return;
    setIsUpdatingSettings(true);
    try {
      const updatedSettings = { ...groupData.settings, ...newSettings };
      await updateDoc(groupRef, { settings: updatedSettings });
      toast({ title: "Settings Updated", description: "Your group settings have been saved." });
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({ variant: "destructive", title: "Update Failed", description: "Could not save settings." });
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleAddMealType = async () => {
    if (!newMealType.trim() || !groupData?.settings) return;
    
    const currentMealTypes = groupData.settings.mealTypes || [];
    
    if (currentMealTypes.find((m: string) => m.toLowerCase() === newMealType.trim().toLowerCase())) {
      toast({ variant: "destructive", title: "Duplicate", description: "This meal type already exists." });
      return;
    }
    
    const updatedMealTypes = [...currentMealTypes, newMealType.trim()];
    
    setNewMealType("");
    await handleUpdateSettings({ mealTypes: updatedMealTypes });
  };

  const handleRemoveMealType = async (mealToRemove: string) => {
    if (!groupData?.settings) return;
    
    const updatedMealTypes = groupData.settings.mealTypes.filter((m: string) => m !== mealToRemove);
    await handleUpdateSettings({ mealTypes: updatedMealTypes });
  };

  const handleToggleIsMealItemNameRequired = async (checked: boolean) => {
    await handleUpdateSettings({ isMealItemNameRequired: checked });
  };

  const handleToggleIsExpenseDescriptionRequired = async (checked: boolean) => {
    await handleUpdateSettings({ isExpenseDescriptionRequired: checked });
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!groupId) {
        toast({ variant: "destructive", title: "Error", description: "Group not found." });
        return;
    }

    try {
        const batch = writeBatch(firestore);

        // Delete from members subcollection
        const memberRef = doc(firestore, `groups/${groupId}/members`, memberId);
        batch.delete(memberRef);

        // Update user document
        const userRef = doc(firestore, "users", memberId);
        batch.update(userRef, {
            groupId: null,
            isAdmin: false,
        });

        await batch.commit();
        toast({ title: "Member Removed", description: "The member has been removed from the group." });
    } catch (error) {
        console.error("Error removing member:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not remove member. Please try again." });
    }
  };

  const isLoading = isCurrentUserLoading || isCurrentUserDataLoading;

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

  if (!groupId || !currentUser) {
    return <NewUserAdminPanel />;
  }

  const isDataLoading = isGroupLoading || areMembersLoading;

  if (isDataLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage your group members and settings.
          </p>
        </div>
        <Card>
          <CardHeader><Skeleton className="h-24 w-full" /></CardHeader>
          <CardContent><Skeleton className="h-40 w-full" /></CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-24 w-full" /></CardHeader>
          <CardContent><Skeleton className="h-40 w-full" /></CardContent>
        </Card>
      </div>
    );
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
              <p className="text-lg font-mono font-semibold bg-background/50 px-2 py-1 rounded inline-block">
                {groupData?.invitationCode || 'N/A'}
              </p>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={async () => {
                  if (groupData?.invitationCode) {
                    setIsCopying(true);
                    try {
                      await navigator.clipboard.writeText(groupData.invitationCode);
                      toast({ title: "Copied!", description: "Invite code copied to clipboard." });
                    } catch (error) {
                      toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy to clipboard." });
                    } finally {
                      setTimeout(() => setIsCopying(false), 1000);
                    }
                  }
                }}
                disabled={isCopying}
              >
                {isCopying ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
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
                {members.length > 0 ? members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={`https://picsum.photos/seed/${member.id.substring(0,6)}/40/40`} />
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
                         <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button 
                                variant="ghost" 
                                size="icon" 
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Remove member</span>
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure you want to remove {member.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove them from the group. They will have to rejoin using the invite code.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRemoveMember(member.id)} className="bg-destructive hover:bg-destructive/90">
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center h-24">
                      No members found in this group.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal /> Dashboard Customization
          </CardTitle>
          <CardDescription>Tailor the dashboard experience for your group members.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Utensils className="h-4 w-4" /> Manage Meal Types
            </h3>
            <div className="space-y-2">
              {groupData.settings?.mealTypes?.map((meal: string) => (
                <div key={meal} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                  <span>{meal}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7" 
                    onClick={() => handleRemoveMealType(meal)} 
                    disabled={isUpdatingSettings}
                  >
                    <X className="h-4 w-4"/>
                  </Button>
                </div>
              ))}
              {(!groupData.settings?.mealTypes || groupData.settings.mealTypes.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No meal types defined. Add one below.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Input 
                placeholder="Add new meal type..." 
                value={newMealType} 
                onChange={(e) => setNewMealType(e.target.value)} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isUpdatingSettings && newMealType.trim()) {
                    handleAddMealType();
                  }
                }}
                disabled={isUpdatingSettings}
              />
              <Button 
                onClick={handleAddMealType} 
                disabled={isUpdatingSettings || !newMealType.trim()}
              >
                {isUpdatingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <ToggleRight className="h-4 w-4" /> Field Requirements
            </h3>
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <Label htmlFor="require-item-name" className="font-medium">
                  Make Meal Item Name Mandatory
                </Label>
                <p className="text-sm text-muted-foreground">
                  If enabled, members must enter an item name when logging a meal.
                </p>
              </div>
              <Switch
                id="require-item-name"
                checked={groupData.settings?.isMealItemNameRequired ?? false}
                onCheckedChange={handleToggleIsMealItemNameRequired}
                disabled={isUpdatingSettings}
              />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <Label htmlFor="require-expense-desc" className="font-medium">
                  Make Expense Description Mandatory
                </Label>
                <p className="text-sm text-muted-foreground">
                  If enabled, members must enter a description when logging an expense.
                </p>
              </div>
              <Switch
                id="require-expense-desc"
                checked={groupData.settings?.isExpenseDescriptionRequired ?? false}
                onCheckedChange={handleToggleIsExpenseDescriptionRequired}
                disabled={isUpdatingSettings}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
