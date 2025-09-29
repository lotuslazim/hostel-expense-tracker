
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import placeholderImages from "@/lib/placeholder-images.json";
import { User, Home, Utensils, ShoppingCart, Pencil, Camera, LogIn, Loader2, PlusCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirebase, useUser, useDoc } from "@/firebase";
import { doc, collection, query, where, writeBatch, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { updateProfile } from "firebase/auth";
import { useRouter } from "next/navigation";

function JoinGroupCard() {
  const { firestore } = useFirebase();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  
   const handleJoinGroup = async () => {
    if (!currentUser || !inviteCode) {
        toast({ variant: "destructive", title: "Error", description: "Invitation code is required." });
        return;
    }
    setIsJoining(true);

    try {
        const groupsQuery = query(collection(firestore, "groups"), where("invitationCode", "==", inviteCode.trim().toUpperCase()));
        const querySnapshot = await getDocs(groupsQuery);
        
        if (querySnapshot.empty) {
            toast({ variant: "destructive", title: "Not Found", description: "No group found with that invitation code." });
            setIsJoining(false);
            return;
        }

        const groupDoc = querySnapshot.docs[0];
        const batch = writeBatch(firestore);
        
        const userRef = doc(firestore, "users", currentUser.uid);
        batch.update(userRef, {
            groupId: groupDoc.id,
            isAdmin: false,
        });

        const memberRef = doc(firestore, `groups/${groupDoc.id}/members`, currentUser.uid);
        batch.set(memberRef, {
            email: currentUser.email,
            displayName: currentUser.displayName,
            role: 'member',
            joinedAt: serverTimestamp(),
            id: currentUser.uid,
        });
        
        await batch.commit();
        toast({ title: "Success", description: `You have joined the group "${groupDoc.data().groupName}"!` });
        router.push('/dashboard');

    } catch (error) {
        console.error("Error joining group:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not join group. Please try again." });
    } finally {
        setIsJoining(false);
    }
  };

  return (
    <Card className="max-w-lg">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><LogIn/> Join an Existing Group</CardTitle>
            <CardDescription>Enter an invitation code to join a group.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteCode">Invitation Code</Label>
                <Input id="inviteCode" placeholder="e.g., ABC123" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} disabled={isJoining}/>
            </div>
            <Button className="w-full" onClick={handleJoinGroup} disabled={isJoining || !inviteCode}>
                {isJoining && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Join Group
            </Button>
        </CardContent>
    </Card>
  );
}


function ProfileSkeleton() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="items-center">
              <Skeleton className="h-20 w-20 rounded-full" />
            </CardHeader>
            <CardContent className="text-center">
               <Skeleton className="h-5 w-24 mx-auto" />
               <Skeleton className="h-4 w-32 mx-auto mt-2" />
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2 space-y-6">
           <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
        </div>
      </div>
    </div>
  );
}


export default function ProfilePage() {
  const { firestore, auth } = useFirebase();
  const { user: currentUser, isUserLoading } = useUser();
  const { toast } = useToast();
  
  const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData, isLoading: isCurrentUserDataLoading } = useDoc(currentUserRef);

  const [name, setName] = useState(currentUser?.displayName || "");
  const [isEditingName, setIsEditingName] = useState(false);

  const groupId = currentUserData?.groupId;
  const inGroup = !!groupId;
  const isAdmin = currentUserData?.isAdmin ?? false;

  const groupRef = useMemo(() => (groupId) ? doc(firestore, "groups", groupId) : null, [firestore, groupId]);
  const { data: groupData, isLoading: isGroupDataLoading } = useDoc(groupRef);


  const handleNameUpdate = async () => {
      if (!currentUser || !name) {
          toast({ variant: "destructive", title: "Name cannot be empty." });
          return;
      }
      setIsEditingName(true);
      try {
          await updateProfile(currentUser, { displayName: name });
          const userDocRef = doc(firestore, "users", currentUser.uid);
          await updateDoc(userDocRef, { displayName: name });
          if(groupId) {
              const memberDocRef = doc(firestore, `groups/${groupId}/members`, currentUser.uid);
              await updateDoc(memberDocRef, { displayName: name });
          }
          toast({ title: "Success", description: "Your name has been updated." });
      } catch (error) {
          toast({ variant: "destructive", title: "Error", description: "Could not update your name." });
          console.error(error);
      } finally {
          setIsEditingName(false);
      }
  }

  const handleLeaveGroup = async () => {
    if (!currentUser || !groupId) return;

    try {
        const batch = writeBatch(firestore);
        const memberRef = doc(firestore, `groups/${groupId}/members`, currentUser.uid);
        batch.delete(memberRef);

        const userRef = doc(firestore, "users", currentUser.uid);
        batch.update(userRef, {
            groupId: null,
            isAdmin: false,
        });

        await batch.commit();
        toast({ title: "Success", description: "You have left the group." });
    } catch(error) {
        console.error("Error leaving group:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not leave group. Please try again." });
    }
  };

  const isLoading = isUserLoading || isCurrentUserDataLoading || (inGroup && isGroupDataLoading);
  
  if (isLoading) {
    return <ProfileSkeleton />;
  }
  
  if(!currentUser) {
    // This case should ideally be handled by a higher-level auth guard
    // but as a fallback, we can show a login prompt.
    return (
        <div className="text-center">
            <p>Please log in to view your profile.</p>
            <Button asChild><Link href="/login">Log In</Link></Button>
        </div>
    );
  }

  const userProfile = {
    name: currentUser?.displayName || currentUser?.email?.split('@')[0] || "User",
    email: currentUser?.email || "No email",
    role: inGroup ? (isAdmin ? "Admin" : "Member") : "Not in a group",
    profilePictureId: "user-avatar"
  };

  const avatarImage = placeholderImages.placeholderImages.find(p => p.id === userProfile.profilePictureId);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Your Profile</h1>
        <p className="text-muted-foreground">
          View and manage your personal and group information.
        </p>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-6">
              <Card>
                <CardHeader className="items-center">
                  <div className="relative w-24 h-24 mx-auto">
                    <Avatar className="h-24 w-24">
                      {avatarImage && <AvatarImage src={avatarImage.imageUrl} alt="User avatar" data-ai-hint={avatarImage.imageHint} />}
                      <AvatarFallback>{userProfile.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="text-center mt-4">
                    <CardTitle className="text-2xl break-all">{userProfile.name}</CardTitle>
                    <CardDescription className="break-all">{userProfile.email}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="text-center">
                  <Badge>{userProfile.role}</Badge>
                </CardContent>
              </Card>

              {inGroup && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base"><Home className="h-4 w-4" /> Group Info</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">Group</span>
                          <span className="font-medium text-sm">{groupData?.groupName}</span>
                        </div>
                        {isAdmin && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground text-sm">Code</span>
                            <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{groupData?.invitationCode}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                )}
            </div>

            <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Details</CardTitle>
                    <CardDescription>Manage your personal settings.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Display Name</Label>
                        <div className="flex gap-2">
                           <Input id="name" defaultValue={userProfile.name} onChange={(e) => setName(e.target.value)} />
                           <Button onClick={handleNameUpdate} disabled={isEditingName}>
                               {isEditingName && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                               Update
                           </Button>
                        </div>
                      </div>
                  </CardContent>
                  <CardHeader>
                    <CardTitle>Group Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {inGroup ? (
                         <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full justify-start">
                              <LogOut className="mr-2 h-4 w-4" /> Leave Group
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure you want to leave?</AlertDialogTitle>
                              <AlertDialogDescription>
                                You will lose access to all group data. This action can only be undone by being re-invited.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleLeaveGroup} className="bg-destructive hover:bg-destructive/90">Leave Group</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    ) : (
                        <JoinGroupCard />
                    )}
                  </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}

    
