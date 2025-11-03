
"use client";

import { Chat } from "@/components/chat/Chat";
import { useUser, useDoc, useFirebase } from "@/firebase";
import { useMemo, useEffect } from "react";
import { doc, writeBatch, arrayUnion } from "firebase/firestore";
import { WelcomeCard } from "@/components/app/welcome-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

function ChatPageSkeleton() {
    return (
        <div className="flex flex-col flex-grow h-screen">
            {/* Message List Skeleton */}
            <div className="flex-grow p-4 space-y-4">
                <div className="flex items-end gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-16 w-3/5 rounded-lg" />
                </div>
                <div className="flex items-end gap-2 justify-end">
                    <Skeleton className="h-24 w-1/2 rounded-lg" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                </div>
                 <div className="flex items-end gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-12 w-2/5 rounded-lg" />
                </div>
            </div>
            {/* Input Skeleton */}
            <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                    <Skeleton className="flex-grow h-10 rounded-lg" />
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <Skeleton className="h-10 w-20 rounded-lg" />
                </div>
            </div>
        </div>
    )
}


export default function ChatPage() {
    const { firestore } = useFirebase();
    const { user: currentUser, isUserLoading } = useUser();

    const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
    const { data: currentUserData, isLoading: isCurrentUserDataLoading } = useDoc(currentUserRef);

    const isLoading = isUserLoading || isCurrentUserDataLoading;
    const groupId = currentUserData?.groupId;
    const userId = currentUser?.uid;

    const { unreadMessages } = useUnreadMessages(groupId, userId);

    useEffect(() => {
        if (unreadMessages.length > 0 && groupId && userId && firestore) {
            const batch = writeBatch(firestore);
            unreadMessages.forEach(msg => {
                if (msg.id) { // Ensure message has an ID
                    const msgRef = doc(firestore, `groups/${groupId}/messages`, msg.id);
                    batch.update(msgRef, { readBy: arrayUnion(userId) });
                }
            });
            batch.commit().catch(console.error);
        }
    }, [unreadMessages, groupId, userId, firestore]);

    return (
    <div className="flex flex-col h-screen">
      <main className="flex flex-col flex-grow bg-background overflow-hidden">
        {isLoading ? <ChatPageSkeleton /> : 
         !groupId ? (
            <div className="container mx-auto py-8">
                <WelcomeCard />
            </div>
         ) :
         <Chat groupId={groupId} currentUser={currentUser} />}
      </main>
    </div>
  );
}
