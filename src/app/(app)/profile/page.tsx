
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import placeholderImages from "@/lib/placeholder-images.json";
import { User, Home, Utensils, ShoppingCart, Pencil, Camera, FileUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirebase, useUser, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import type { Meal, Expense, Item } from "@/lib/types";

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
  const userName = currentUserData?.email.split('@')[0] || "null";
  const userEmail = currentUserData?.email || "null";

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

  // 4. Get total group expenses for calculating share
  const groupExpensesQuery = useMemoFirebase(() => groupId ? collection(firestore, `groups/${groupId}/expenses`) : null, [firestore, groupId]);
  const { data: groupExpenses, isLoading: areGroupExpensesLoading } = useCollection<Expense>(groupExpensesQuery);


  const isLoading = isCurrentUserLoading || isCurrentUserDataLoading || isGroupDataLoading || areMealsLoading || areExpensesLoading || areItemsLoading || areGroupExpensesLoading;

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  const MOCK_USER = {
    name: userName,
    email: userEmail,
    role: isAdmin ? "Admin" : "Member",
    profilePictureId: "user-avatar"
  };

  const MOCK_GROUP = {
    name: groupData?.groupName || "null",
    invitationCode: groupData?.invitationCode || "null",
    memberCount: groupData?.memberIds?.length || 0,
  };
  
  const totalUserSpend = userExpenses?.reduce((acc, expense) => acc + expense.amount, 0) || 0;
  const totalGroupSpend = groupExpenses?.reduce((acc, expense) => acc + expense.amount, 0) || 0;

  const MOCK_CONTRIBUTIONS = {
    meals: {
      total: userMeals?.length || 0,
      averagePerDay: userMeals ? (userMeals.length / 30) : 0, // Simplified for now
    },
    expenses: {
      total: totalUserSpend,
      share: totalGroupSpend > 0 ? (totalUserSpend / totalGroupSpend) * 100 : 0,
    },
    purchases: userItems?.slice(0, 3).map(item => ({ item: item.name, quantity: `${item.quantity} ${item.unit}` })) || [],
    totalItemsLogged: userItems?.length || 0
  };

  const avatarImage = placeholderImages.placeholderImages.find(p => p.id === MOCK_USER.profilePictureId);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Your Profile</h1>
        <p className="text-muted-foreground">
          View and edit your personal and group information.
        </p>
      </div>

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
                  <AvatarFallback>{MOCK_USER.name.charAt(0)}</AvatarFallback>
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
                   <CardTitle className="text-2xl">{MOCK_USER.name}</CardTitle>
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
                             <Input id="name" defaultValue={MOCK_USER.name} />
                          </div>
                          <Button className="w-full">Save Name</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                </div>
                <CardDescription>{MOCK_USER.email}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <Badge>{MOCK_USER.role}</Badge>
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
                <span className="font-medium">{MOCK_GROUP.name}</span>
              </div>
              {MOCK_USER.role === 'Admin' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invite Code</span>
                  <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{MOCK_GROUP.invitationCode}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Members</span>
                <span className="font-medium">{MOCK_GROUP.memberCount}</span>
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
                <p className="text-3xl font-bold">{MOCK_CONTRIBUTIONS.meals.total}</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Average Meals/Day</p>
                <p className="text-3xl font-bold">{MOCK_CONTRIBUTIONS.meals.averagePerDay.toFixed(1)}</p>
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
                <p className="text-3xl font-bold">৳{MOCK_CONTRIBUTIONS.expenses.total.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Share of Group Total</p>
                <p className="text-3xl font-bold">{MOCK_CONTRIBUTIONS.expenses.share.toFixed(0)}%</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Purchase Contribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Purchase Contribution</CardTitle>
               <CardDescription>Total items logged: {MOCK_CONTRIBUTIONS.totalItemsLogged}</CardDescription>
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
                  {MOCK_CONTRIBUTIONS.purchases.length > 0 ? MOCK_CONTRIBUTIONS.purchases.map((purchase) => (
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
    </div>
  );
}

    