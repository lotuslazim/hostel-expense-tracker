"use client";

import { AdminPanel, NewUserAdminPanel } from "@/components/admin/AdminPanel";
import { useUser, useDoc, useFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function AdminPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>
      <Skeleton className="h-64 max-w-lg" />
    </div>
  );
}


export default function AdminPage() {
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

    const hasGroup = !!userData?.groupId;

    if (!user) {
        return <AdminPageSkeleton />;
    }
    
    if (hasGroup) {
        return <AdminPanel />;
    } else {
        return <NewUserAdminPanel />;
    }
}
