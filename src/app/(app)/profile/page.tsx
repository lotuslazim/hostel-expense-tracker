

"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import placeholderImages from "@/lib/placeholder-images.json";
import { User, Home, Utensils, ShoppingCart, Pencil, Camera, FileUp, LogIn, Loader2, PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirebase, useUser, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where, writeBatch, getDocs, serverTimestamp, arrayUnion } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import type { Meal, Expense, Item } from "@/lib/types";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";


function NoGroupProfile() {
  const { firestore } = useFirebase();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const [inviteCode, setInviteCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const userProfile = {
    name: currentUser?.displayName || currentUser?.email?.split('@')[0] || "User",
    email: currentUser?.email || "No email",
    profilePictureId: "user-avatar"
  };
  const avatarImage = placeholderImages.placeholderImages.find(p => p.id === userProfile.profilePictureId);
  
   const handleJoinGroup = async () => {
    if (!currentUser || !inviteCode) {
        toast({ variant: "destructive", title: "Error", description: "Invitation code is required." });
        return;
    }
    setIsJoining(true);

    try {
        const groupsQuery = query(collection(firestore, "groups"), where("invitationCode", "==", inviteCode));
        const querySnapshot = await getDocs(groupsQuery);
        
        if (querySnapshot.empty) {
            toast({ variant: "destructive", title: "Not Found", description: "No group found with that invitation code." });
            setIsJoining(false);
            return;
        }

        const groupDoc = querySnapshot.docs[0];
        const groupRef = doc(firestore, "groups", groupDoc.id);
        const batch = writeBatch(firestore);
        const userRef = doc(firestore, "users", currentUser.uid);

        const memberRef = doc(firestore, `groups/${groupDoc.id}/members`, currentUser.uid);
        batch.set(memberRef, {
            email: currentUser.email,
            role: 'member',
            joinedAt: serverTimestamp(),
        });
        
        batch.update(userRef, {
            groupId: groupDoc.id,
            isAdmin: false,
        });

        await batch.commit();
        toast({ title: "Success", description: `You have joined the group "${groupDoc.data().groupName}"!` });

    } catch (error) {
        console.error("Error joining group:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not join group. Please try again." });
    } finally {
        setIsJoining(false);
    }
  };


  return (
     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                  <div className="relative w-20 h-20 mx-auto">
                    <Avatar className="h-20 w-20">
                      {avatarImage && (
                        <AvatarImage 
                          src={avatarImage.imageUrl}
                          alt="User avatar" 
                          data-ai-hint={avatarImage.imageHint}
                        />
                      )}
                      <AvatarFallback>{userProfile.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                     <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-background">
                          <Camera className="h-4 w-4" />
                          <span className="sr-only">Change profile picture</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Change Profile Picture</DialogTitle>
                          <DialogDescription>
                            Upload a new photo for your profile.
                          </DialogDescription>
                        </DialogHeader>
                         <div className="space-y-4 py-4">
                           <div className="space-y-2">
                             <Label htmlFor="picture">New Picture</Label>
                             <Button asChild variant="outline" className="w-full justify-start font-normal text-muted-foreground"><label htmlFor="picture" className="flex items-center cursor-pointer w-full"><FileUp className="mr-2 h-4 w-4"/> Click to upload</label></Button>
                             <Input id="picture" type="file" className="hidden"/>
                          </div>
                          <Button className="w-full">Save Picture</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="text-center mt-4">
                    <div className="flex justify-center items-center gap-2">
                       <CardTitle className="text-2xl">{userProfile.name}</CardTitle>
                       <Dialog>
                          <DialogTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-7 w-7">
                               <Pencil className="h-4 w-4" />
                               <span className="sr-only">Edit name</span>
                             </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Change Your Name</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                 <Label htmlFor="name">New Name</Label>
                                 <Input id="name" defaultValue={userProfile.name} />
                              </div>
                              <Button className="w-full">Save Name</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                    </div>
                    <CardDescription>{userProfile.email}</CardDescription>
                  </div>
                </CardHeader>
            </Card>
        </div>
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><LogIn/> Join an Existing Group</CardTitle>
                    <CardDescription>Enter an invitation code to join a group.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="inviteCode">Invitation Code</Label>
                        <Input id="inviteCode" placeholder="e.g., AVNG-4321" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} disabled={isJoining}/>
                    </div>
                    <Button className="w-full" onClick={handleJoinGroup} disabled={isJoining || !inviteCode}>
                        {isJoining && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Join Group
                    </Button>
                </CardContent>
            </Card>
             <Card className="flex flex-col items-center justify-center text-center p-8 bg-muted/50 border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><PlusCircle className="h-6 w-6"/> Want to Create a Group?</CardTitle>
                <CardDescription>To create and manage your own group, head over to the Admin Panel.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                    <Link href="/admin">Go to Admin Panel</Link>
                </Button>
              </CardContent>
            </Card>
        </div>
    </div>
  )
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
              <div className="text-center mt-4">
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-4 w-32 mt-2" />
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <Skeleton className="h-6 w-16 mx-auto" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Home className="h-5 w-5" /> Group Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Utensils className="h-5 w-5" /> Meal Contribution</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><span className="font-bold text-lg">৳</span> Expense Contribution</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Purchase Contribution</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


export default function ProfilePage() {
  const { firestore } = useFirebase();
  const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();

  // 1. Get current user's profile
  const currentUserRef = useMemoFirebase(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData, isLoading: isCurrentUserDataLoading } = useDoc(currentUserRef);

  const groupId = currentUserData?.groupId;
  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || "User";
  const userEmail = currentUser?.email || "No email";

  // 2. Get group data
  const groupRef = useMemoFirebase(() => groupId ? doc(firestore, "groups", groupId) : null, [firestore, groupId]);
  const { data: groupData, isLoading: isGroupDataLoading } = useDoc(groupRef);
  const isAdmin = groupData?.adminId === currentUser?.uid;

  // 3. Get user's contributions
  const userMealsQuery = useMemoFirebase(() => (groupId && currentUser) ? query(collection(firestore, `groups/${groupId}/meals`), where("userId", "==", currentUser.uid)) : null, [firestore, groupId, currentUser]);
  const userExpensesQuery = useMemoFirebase(() => (groupId && currentUser) ? query(collection(firestore, `groups/${groupId}/expenses`), where("userId", "==", currentUser.uid)) : null, [firestore, groupId, currentUser]);
  const userItemsQuery = useMemoFirebase(() => (groupId && currentUser) ? query(collection(firestore, `groups/${groupId}/purchasedItems`), where("userId", "==", currentUser.uid)) : null, [firestore, groupId, currentUser]);
  
  const { data: userMeals, isLoading: areMealsLoading } = useCollection<Meal>(userMealsQuery);
  const { data: userExpenses, isLoading: areExpensesLoading } = useCollection<Expense>(userExpensesQuery);
  const { data: userItems, isLoading: areItemsLoading } = useCollection<Item>(userItemsQuery);

  // 4. Get total group expenses and members for calculating share
  const groupExpensesQuery = useMemoFirebase(() => groupId ? collection(firestore, `groups/${groupId}/expenses`) : null, [firestore, groupId]);
  const { data: groupExpenses, isLoading: areGroupExpensesLoading } = useCollection<Expense>(groupExpensesQuery);
  const groupMembersQuery = useMemoFirebase(() => groupId ? collection(firestore, `groups/${groupId}/members`) : null, [firestore, groupId]);
  const { data: groupMembers, isLoading: areGroupMembersLoading } = useCollection(groupMembersQuery);


  const isLoading = isCurrentUserLoading || isCurrentUserDataLoading || isGroupDataLoading || areMealsLoading || areExpensesLoading || areItemsLoading || areGroupExpensesLoading || areGroupMembersLoading;

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  const userProfile = {
    name: userName,
    email: userEmail,
    role: isAdmin ? "Admin" : "Member",
    profilePictureId: "user-avatar"
  };

  const groupInfo = {
    name: groupData?.groupName || "N/A",
    invitationCode: groupData?.invitationCode || "N/A",
    memberCount: groupMembers?.length || 0,
  };
  
  const totalUserSpend = userExpenses?.reduce((acc, expense) => acc + expense.amount, 0) || 0;
  const totalGroupSpend = groupExpenses?.reduce((acc, expense) => acc + expense.amount, 0) || 0;
  const totalMealsLogged = userMeals?.length || 0;
  
  const averageMealsPerDay = totalMealsLogged > 0 ? (totalMealsLogged / 30).toFixed(1) : "0.0"; // Simplified for now

  const expenseShare = totalGroupSpend > 0 ? ((totalUserSpend / totalGroupSpend) * 100).toFixed(0) : "0";

  const recentPurchases = userItems?.slice(0, 3).map(item => ({ item: item.name, quantity: `${item.quantity} ${item.unit}` })) || [];

  const avatarImage = placeholderImages.placeholderImages.find(p => p.id === userProfile.profilePictureId);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Your Profile</h1>
        <p className="text-muted-foreground">
          View and edit your personal and group information.
        </p>
      </div>

       {!currentUserData?.groupId ? (
            <NoGroupProfile />
       ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="md:col-span-1 space-y-6">
              {/* User Info */}
              <Card>
                <CardHeader>
                  <div className="relative w-20 h-20 mx-auto">
                    <Avatar className="h-20 w-20">
                      {avatarImage && (
                        <AvatarImage 
                          src={avatarImage.imageUrl}
                          alt="User avatar" 
                          data-ai-hint={avatarImage.imageHint}
                        />
                      )}
                      <AvatarFallback>{userProfile.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-background">
                          <Camera className="h-4 w-4" />
                          <span className="sr-only">Change profile picture</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Change Profile Picture</DialogTitle>
                          <DialogDescription>
                            Upload a new photo for your profile.
                          </DialogDescription>
                        </DialogHeader>
                         <div className="space-y-4 py-4">
                           <div className="space-y-2">
                             <Label htmlFor="picture">New Picture</Label>
                             <Button asChild variant="outline" className="w-full justify-start font-normal text-muted-foreground"><label htmlFor="picture" className="flex items-center cursor-pointer w-full"><FileUp className="mr-2 h-4 w-4"/> Click to upload</label></Button>
                             <Input id="picture" type="file" className="hidden"/>
                          </div>
                          <Button className="w-full">Save Picture</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="text-center mt-4">
                    <div className="flex justify-center items-center gap-2">
                       <CardTitle className="text-2xl">{userProfile.name}</CardTitle>
                       <Dialog>
                          <DialogTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-7 w-7">
                               <Pencil className="h-4 w-4" />
                               <span className="sr-only">Edit name</span>
                             </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Change Your Name</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                 <Label htmlFor="name">New Name</Label>
                                 <Input id="name" defaultValue={userProfile.name} />
                              </div>
                              <Button className="w-full">Save Name</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                    </div>
                    <CardDescription>{userProfile.email}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="text-center">
                  <Badge>{userProfile.role}</Badge>
                </CardContent>
              </Card>

              {/* Group Info */}
              <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Home className="h-5 w-5" /> Group Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Group Name</span>
                      <span className="font-medium">{groupInfo.name}</span>
                    </div>
                    {isAdmin && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Invite Code</span>
                        <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{groupInfo.invitationCode}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Members</span>
                      <span className="font-medium">{groupInfo.memberCount}</span>
                    </div>
                  </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="md:col-span-2 space-y-6">
                {/* Meal Contribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Utensils className="h-5 w-5" /> Meal Contribution</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Meals Logged</p>
                      <p className="text-3xl font-bold">{totalMealsLogged}</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Average Meals/Day</p>
                      <p className="text-3xl font-bold">{averageMealsPerDay}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Expense Contribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><span className="font-bold text-lg">৳</span> Expense Contribution</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Spend</p>
                      <p className="text-3xl font-bold">৳{totalUserSpend.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Share of Group Total</p>
                      <p className="text-3xl font-bold">{expenseShare}%</p>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Purchase Contribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Purchase Contribution</CardTitle>
                    <CardDescription>Total items logged: {userItems?.length || 0}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Quantity Purchased</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentPurchases.length > 0 ? recentPurchases.map((purchase) => (
                          <TableRow key={purchase.item}>
                            <TableCell className="font-medium">{purchase.item}</TableCell>
                            <TableCell className="text-right">{purchase.quantity}</TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                              <TableCell colSpan={2} className="text-center h-24">No items purchased yet.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
            </div>
        </div>
      )}
    </div>
  );
}
