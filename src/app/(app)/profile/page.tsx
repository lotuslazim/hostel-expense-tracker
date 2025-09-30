
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Home, Utensils, ShoppingCart, Pencil, Camera, LogIn, Loader2, PlusCircle, LogOut, Upload, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirebase, useUser, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where, writeBatch, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useState, useMemo, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { updateProfile } from "firebase/auth";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { startOfMonth, endOfMonth } from "date-fns";
import type { MealLog, Expense } from "@/lib/types";


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
    <>
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
    </>
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
  const { firestore, storage, auth } = useFirebase();
  const { user: currentUser, isUserLoading } = useUser();
  const { toast } = useToast();
  
  const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData, isLoading: isCurrentUserDataLoading } = useDoc(currentUserRef);

  const [name, setName] = useState(currentUser?.displayName || "");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const groupId = currentUserData?.groupId;
  const inGroup = !!groupId;
  const isAdmin = currentUserData?.isAdmin ?? false;

  const groupRef = useMemo(() => (groupId) ? doc(firestore, "groups", groupId) : null, [firestore, groupId]);
  const { data: groupData, isLoading: isGroupDataLoading } = useDoc(groupRef);

  const dateRange = useMemo(() => ({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  }), []);

  const mealsQuery = useMemo(() => {
    if (!groupId || !currentUser) return null;
    return query(
      collection(firestore, `groups/${groupId}/meals`),
      where("userId", "==", currentUser.uid),
      where("date", ">=", dateRange.start),
      where("date", "<=", dateRange.end)
    );
  }, [firestore, groupId, currentUser, dateRange]);

  const expensesQuery = useMemo(() => {
    if (!groupId || !currentUser) return null;
    return query(
      collection(firestore, `groups/${groupId}/expenses`),
      where("userId", "==", currentUser.uid),
      where("date", ">=", dateRange.start),
      where("date", "<=", dateRange.end)
    );
  }, [firestore, groupId, currentUser, dateRange]);

  const { data: userMeals, isLoading: areMealsLoading } = useCollection<MealLog>(mealsQuery);
  const { data: userExpenses, isLoading: areExpensesLoading } = useCollection<Expense>(expensesQuery);

  const contributionStats = useMemo(() => {
    const totalMeals = userMeals?.reduce((sum, meal) => sum + (meal.mealNumber || 1), 0) ?? 0;
    const totalExpenses = userExpenses?.reduce((sum, expense) => sum + expense.amount, 0) ?? 0;
    return { totalMeals, totalExpenses };
  }, [userMeals, userExpenses]);


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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handlePictureUpdate = async () => {
    if (!currentUser || !imageFile) {
      toast({ variant: "destructive", title: "No image selected" });
      return;
    }
    setIsUploading(true);
    
    try {
      const compressedFile = await imageCompression(imageFile, {
        maxSizeMB: 0.5, // Compress to 500KB
        maxWidthOrHeight: 800,
      });

      const storageRef = ref(storage, `profilePictures/${currentUser.uid}`);
      const snapshot = await uploadBytes(storageRef, compressedFile);
      const photoURL = await getDownloadURL(snapshot.ref);

      await updateProfile(currentUser, { photoURL });
      
      const userDocRef = doc(firestore, "users", currentUser.uid);
      await updateDoc(userDocRef, { photoURL });
      
      if(groupId) {
          const memberDocRef = doc(firestore, `groups/${groupId}/members`, currentUser.uid);
          await updateDoc(memberDocRef, { photoURL });
      }

      toast({ title: "Success", description: "Profile picture updated." });
      setUploadDialogOpen(false);
      setImageFile(null);
      setImagePreview(null);
    } catch(error) {
      console.error("Error updating profile picture: ", error);
      toast({ variant: "destructive", title: "Error", description: "Could not update profile picture." });
    } finally {
      setIsUploading(false);
    }
  };


  const isLoading = isUserLoading || isCurrentUserDataLoading || (inGroup && (isGroupDataLoading || areMealsLoading || areExpensesLoading));
  
  if (isLoading) {
    return <ProfileSkeleton />;
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
    name: currentUser?.displayName || currentUser?.email?.split('@')[0] || "User",
    email: currentUser?.email || "No email",
    role: inGroup ? (isAdmin ? "Admin" : "Member") : "Not in a group",
    photoURL: currentUserData?.photoURL || currentUser?.photoURL
  };


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
                  <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                    <DialogTrigger asChild>
                      <div className="relative w-24 h-24 mx-auto group cursor-pointer">
                        <Avatar className="h-24 w-24">
                          <AvatarImage src={userProfile.photoURL} alt="User avatar" />
                          <AvatarFallback>{userProfile.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                         <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="text-white h-8 w-8" />
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update Profile Picture</DialogTitle>
                        <DialogDescription>Select a new image to use as your avatar.</DialogDescription>
                      </DialogHeader>
                      <div className="py-4 space-y-4">
                        {imagePreview ? (
                          <div className="w-32 h-32 mx-auto rounded-full overflow-hidden">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-32 h-32 mx-auto rounded-full bg-muted flex items-center justify-center">
                            <User className="h-16 w-16 text-muted-foreground"/>
                          </div>
                        )}
                        <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                          <Upload className="mr-2 h-4 w-4" />
                          Choose Image
                        </Button>
                        <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileChange} />
                         <Button className="w-full" onClick={handlePictureUpdate} disabled={isUploading || !imageFile}>
                          {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                          Save Picture
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
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
                )}
            </div>

            <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><User className="h-5 w-5"/> Account Details</CardTitle>
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
                </Card>

                {inGroup && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg"><Utensils className="h-5 w-5" /> Your Contributions</CardTitle>
                      <CardDescription>Your activity for the current month.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                       <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                        <span className="text-muted-foreground">Total Meals Logged</span>
                        <span className="font-bold text-lg">{contributionStats.totalMeals}</span>
                      </div>
                       <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                        <span className="text-muted-foreground">Total Expenses Paid</span>
                        <span className="font-bold text-lg">৳{contributionStats.totalExpenses.toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                   {inGroup ? (
                        <>
                         <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg"><Home className="h-5 w-5"/> Group Information</CardTitle>
                             <CardDescription>Details about your current group.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Group Name</span>
                              <span className="font-medium">{groupData?.groupName}</span>
                            </div>
                             {isAdmin && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Invite Code</span>
                                <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{groupData?.invitationCode}</span>
                              </div>
                            )}
                          </CardContent>
                        </>
                    ) : (
                        <>
                          <CardHeader>
                             <CardTitle className="flex items-center gap-2 text-lg"><Users className="h-5 w-5"/> Join a Group</CardTitle>
                             <CardDescription>You are not currently in a group. Join one or create a new one.</CardDescription>
                          </CardHeader>
                          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 border rounded-lg">
                              <h3 className="font-semibold mb-2">Join an Existing Group</h3>
                              <p className="text-sm text-muted-foreground mb-4">Enter an invitation code to join your flatmates.</p>
                               <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="w-full">
                                        <LogIn className="mr-2 h-4 w-4" /> Join Group
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <JoinGroupCard />
                                </DialogContent>
                            </Dialog>
                            </div>
                            <div className="p-4 border rounded-lg">
                               <h3 className="font-semibold mb-2">Create a New Group</h3>
                               <p className="text-sm text-muted-foreground mb-4">Start a new group and invite others to join you.</p>
                               <Button variant="outline" className="w-full" asChild>
                                  <Link href="/admin">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Create Group
                                  </Link>
                               </Button>
                            </div>
                          </CardContent>
                        </>
                    )}
                </Card>
            </div>
        </div>
    </div>
  );
}
