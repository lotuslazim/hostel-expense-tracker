

"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Home, Pencil, Camera, LogIn, Loader2, PlusCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirebase, useUser, useDoc } from "@/firebase";
import { doc, collection, query, where, writeBatch, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useState, useMemo, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { updateProfile } from "firebase/auth";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";


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
            displayName: currentUser.displayName || currentUser.email?.split('@')[0],
            photoURL: currentUser.photoURL,
            role: 'member',
            joinedAt: serverTimestamp(),
            id: currentUser.uid
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
    <Card className="max-w-lg mx-auto">
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


export default function ProfilePage() {
  const { firestore, storage, auth } = useFirebase();
  const { user: currentUser, isUserLoading } = useUser();
  const { toast } = useToast();
  
  const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData, isLoading: isCurrentUserDataLoading } = useDoc(currentUserRef);

  const [name, setName] = useState(currentUser?.displayName || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const groupId = currentUserData?.groupId;
  const inGroup = !!groupId;

  const groupRef = useMemo(() => (groupId) ? doc(firestore, "groups", groupId) : null, [firestore, groupId]);
  const { data: groupData, isLoading: isGroupDataLoading } = useDoc(groupRef);

  const handleNameUpdate = async () => {
      if (!currentUser || !name) {
          toast({ variant: "destructive", title: "Name cannot be empty." });
          return;
      }
      setIsEditing(true);
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
          setIsEditing(false);
      }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) return;
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
        const compressedFile = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 800 });

        const storageRef = ref(storage, `profilePictures/${currentUser.uid}/${compressedFile.name}`);
        await uploadBytes(storageRef, compressedFile);
        const photoURL = await getDownloadURL(storageRef);
        
        await updateProfile(currentUser, { photoURL });

        const batch = writeBatch(firestore);
        const userDocRef = doc(firestore, "users", currentUser.uid);
        batch.update(userDocRef, { photoURL });
        if(groupId) {
            const memberDocRef = doc(firestore, `groups/${groupId}/members`, currentUser.uid);
            batch.update(memberDocRef, { photoURL });
        }
        await batch.commit();

        toast({ title: "Success", description: "Profile picture updated!" });
    } catch (error) {
        console.error(error);
        toast({ variant: "destructive", title: "Upload Failed", description: "Could not upload image." });
    } finally {
        setIsUploading(false);
    }
  };


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
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-72 mt-2" />
        <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
        <Card><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
      </div>
    );
  }
  
  if(!currentUser) {
    return (
        <div className="text-center">
            <p>Please log in to view your profile.</p>
            <Button asChild><Link href="/login">Log In</Link></Button>
        </div>
    );
  }

  const userProfile = {
    name: currentUserData?.displayName || currentUser?.displayName || currentUser?.email?.split('@')[0] || "User",
    email: currentUser?.email || "No email",
    photoURL: currentUserData?.photoURL || currentUser?.photoURL,
    role: inGroup ? (currentUserData?.isAdmin ? "Admin" : "Member") : "Not in a group"
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Your Profile</h1>
        <p className="text-muted-foreground">
          View and manage your personal and group information.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={userProfile.photoURL} />
                    <AvatarFallback>{userProfile.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                 <Button 
                    size="icon" 
                    className="absolute bottom-0 right-0 h-6 w-6 rounded-full" 
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isUploading}
                    >
                    {isUploading ? <Loader2 className="h-3 w-3 animate-spin"/> : <Camera className="h-3 w-3" />}
                 </Button>
            </div>
            <div>
              <CardTitle className="text-2xl">{userProfile.name}</CardTitle>
              <CardDescription>{userProfile.email}</CardDescription>
              <Badge className="mt-2">{userProfile.role}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <div className="flex gap-2">
                 <Input id="name" defaultValue={userProfile.name} onChange={(e) => setName(e.target.value)} />
                 <Button onClick={handleNameUpdate} disabled={isEditing}>
                     {isEditing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                     Update
                 </Button>
              </div>
            </div>
        </CardContent>
      </Card>
      
      {inGroup ? (
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Home/> Group Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Group Name</span>
                    <span className="font-medium">{groupData?.groupName}</span>
                </div>
                 {currentUserData?.isAdmin && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invite Code</span>
                    <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{groupData?.invitationCode}</span>
                  </div>
                )}
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
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
            </CardContent>
          </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <JoinGroupCard/>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><PlusCircle/> Create a New Group</CardTitle>
                    <CardDescription>Start a new group and invite others.</CardDescription>
                </CardHeader>
                <CardContent className="text-center py-10">
                    <p className="text-muted-foreground mb-4">Go to the admin panel to create a new group.</p>
                     <Button asChild>
                        <Link href="/admin">Create Group</Link>
                    </Button>
                </CardContent>
             </Card>
        </div>
      )}
    </div>
  );
}
