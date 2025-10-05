"use client";

import { useUser, useDoc, useFirebase, useCollection } from "@/firebase";
import { doc, collection, updateDoc } from "firebase/firestore";
import { useMemo, useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, Home, Mail, User as UserIcon, Save, Edit, X } from "lucide-react";
import { AppHeader } from "@/components/app/header";

function AdminProfileSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );
}

function AdminProfilePageContent() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const userDocRef = useMemo(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  const usersQuery = useMemo(() => collection(firestore, 'users'), [firestore]);
  const groupsQuery = useMemo(() => collection(firestore, 'groups'), [firestore]);

  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);
  const { data: groups, isLoading: groupsLoading } = useCollection(groupsQuery);

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (userData) {
      setDisplayName(userData.displayName || "");
    }
  }, [userData]);

  const handleSaveChanges = async () => {
    if (!userDocRef) return;
    setIsSaving(true);
    try {
      await updateDoc(userDocRef, {
        displayName: displayName
      });
      toast({ title: "Profile Updated", description: "Your changes have been saved." });
      setIsEditing(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not save changes." });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancelEdit = () => {
    setDisplayName(userData?.displayName || "");
    setIsEditing(false);
  }

  const isLoading = isUserLoading || isUserDataLoading || usersLoading || groupsLoading;

  if (isLoading) {
    return <AdminProfileSkeleton />;
  }

  const isUserAdmin = userData?.isAdmin ?? false;

  if (!isUserAdmin) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You do not have administrative privileges to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Admin Profile Header */}
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <Avatar className="h-24 w-24 border-4 border-primary">
          <AvatarImage src={userData?.photoURL} alt={userData?.displayName} />
          <AvatarFallback>{userData?.displayName?.charAt(0) ?? 'A'}</AvatarFallback>
        </Avatar>
        <div className="flex-grow text-center sm:text-left">
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <h1 className="text-3xl font-bold font-headline tracking-tight">{userData?.displayName}</h1>
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <p className="text-muted-foreground flex items-center gap-2 justify-center sm:justify-start">
            <Mail className="h-4 w-4" /> {userData?.email}
          </p>
        </div>
        {!isEditing && (
             <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
        )}
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground">Total registered users in the app</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Managed Groups</CardTitle>
            <Home className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groups?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground">Hostels currently under management</p>
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Role</CardTitle>
                <Shield className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">Administrator</div>
                <p className="text-xs text-muted-foreground">Full system privileges</p>
            </CardContent>
        </Card>
      </div>

      {/* Edit Profile Card */}
      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Admin Information</CardTitle>
            <CardDescription>Update your public administrator profile.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
                <label htmlFor="displayName" className="text-sm font-medium">Display Name</label>
                <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pl-10"
                      placeholder="Admin Name"
                    />
                </div>
            </div>
             <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      value={userData?.email || ''}
                      readOnly
                      disabled
                      className="pl-10 bg-muted/50 cursor-not-allowed"
                    />
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" onClick={handleCancelEdit} disabled={isSaving}>
                    <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button onClick={handleSaveChanges} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" /> 
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


export default function AdminProfilePage() {
    return (
        <div className="flex flex-col min-h-screen">
            <AppHeader />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AdminProfilePageContent />
            </main>
        </div>
    )
}