
"use client";

import { useUser, useDoc, useFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
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

  const userDocRef = useMemo(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  const isLoading = isUserLoading || isUserDataLoading;

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
        <h1 className="text-3xl font-bold font-headline tracking-tight">Admin Profile</h1>
        <p>Admin profile content has been removed as requested.</p>
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
