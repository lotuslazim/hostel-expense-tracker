import { AdminPanel, NewUserAdminPanel } from "@/components/admin/AdminPanel";
import { useFirebase, useUser, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function AdminPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-80 mt-2" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default function AdminPage() {
  const { firestore } = useFirebase();
  const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();

  const currentUserRef = useMemo(
    () => (currentUser ? doc(firestore, "users", currentUser.uid) : null),
    [firestore, currentUser]
  );
  const { data: currentUserData, isLoading: isCurrentUserDataLoading } =
    useDoc(currentUserRef);

  const isLoading = isCurrentUserLoading || isCurrentUserDataLoading;
  const groupId = currentUserData?.groupId;

  return (
    <>
      {isLoading ? (
        <AdminPageSkeleton />
      ) : !groupId ? (
        <NewUserAdminPanel />
      ) : (
        <AdminPanel />
      )}
    </>
  );
}
