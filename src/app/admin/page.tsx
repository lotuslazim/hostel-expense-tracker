
"use client";

import { useUser, useDoc, useFirebase, useCollection } from "@/firebase";
import { doc, collection, query, addDoc, serverTimestamp, updateDoc, where, getDocs, writeBatch } from "firebase/firestore";
import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, Home, Building, PlusCircle, LogIn, Loader2, Group, Copy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppHeader } from "@/components/app/header";

function AdminPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="mb-8">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton className="h-96 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    </div>
  );
}

function NewUserAdminPanel({ user }: { user: any }) {
  const { firestore } = useFirebase();
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
      // Create invitation code
      const invitationCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Create group document
      const groupRef = await addDoc(collection(firestore, "groups"), {
        groupName: groupName,
        invitationCode: invitationCode,
        adminId: user.uid,
        createdAt: serverTimestamp(),
        settings: { // Default settings
            mealTypes: ["Lunch", "Dinner"],
            isMealItemNameRequired: false,
            isExpenseDescriptionRequired: false,
            isUtilityReceiptRequired: false,
        }
      });
      
      const groupId = groupRef.id;

      // Update user document with groupId and set as admin
      const userRef = doc(firestore, "users", user.uid);
      const memberRef = doc(firestore, `groups/${groupId}/members`, user.uid);

      const batch = writeBatch(firestore);
      batch.update(userRef, { groupId: groupId, isAdmin: true });
      batch.set(memberRef, {
        id: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: "admin",
        joinedAt: serverTimestamp()
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

      const batch = writeBatch(firestore);
      batch.update(userRef, { groupId: groupId, isAdmin: false }); // New members are not admins by default
      batch.set(memberRef, {
        id: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: "member",
        joinedAt: serverTimestamp()
      });

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
        <h1 className="text-3xl font-bold font-headline">Admin Panel</h1>
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

function AdminPanel({isUserAdmin}: {isUserAdmin: boolean}) {
    if (!isUserAdmin) {
        return (
             <div className="text-center py-16">
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">You do not have administrative privileges.</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-headline tracking-tight">Admin Dashboard</h1>
            <p>Admin dashboard content has been removed as requested.</p>
        </div>
    );
}

const AdminPageContent = () => {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();

    const userDocRef = useMemo(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    
    const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

    const isLoading = isUserLoading || isUserDataLoading;
    
    if (isLoading) {
        return <AdminPageSkeleton />;
    }
    
    if (!user) {
        // This case should ideally not happen if routes are protected, but as a fallback:
        return (
             <div className="text-center py-16">
                <h1 className="text-2xl font-bold">Authentication Error</h1>
                <p className="text-muted-foreground">Please log in to access this page.</p>
            </div>
        )
    }
    
    const hasGroup = !!userData?.groupId;
    const isUserAdmin = userData?.isAdmin ?? false;

    if (isUserAdmin) {
        return <AdminPanel isUserAdmin={isUserAdmin} />;
    } else if (!hasGroup) {
        return <NewUserAdminPanel user={user} />;
    } else {
        // A regular member is in a group but not an admin.
        return (
            <div className="text-center py-16">
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">You do not have administrative privileges.</p>
            </div>
        );
    }
}


export default function AdminPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <AppHeader />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AdminPageContent />
            </main>
        </div>
    )
}

    