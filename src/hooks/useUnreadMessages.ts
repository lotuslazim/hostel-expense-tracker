
"use client";

import { useMemo } from "react";
import { useCollection } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { firestore } from "@/firebase/config";
import type { ChatMessage } from "@/lib/types";

export function useUnreadMessages(groupId: string | null | undefined, userId: string | null | undefined) {
    const unreadQuery = useMemo(() => {
        if (!groupId || !userId) return null;
        return query(
            collection(firestore, `groups/${groupId}/messages`),
            where('readBy', 'array-contains', userId)
        );
    }, [groupId, userId]);

    // This query is intentionally inverted to fetch messages NOT read by the user.
    // Firestore does not support a "not-array-contains" query directly.
    // So we fetch all messages and filter locally. This is not ideal for performance
    // on very large chat groups, but is acceptable for this application's scale.
    const allMessagesQuery = useMemo(() => {
        if (!groupId) return null;
        return query(collection(firestore, `groups/${groupId}/messages`));
    }, [groupId]);

    const { data: allMessages, isLoading, error } = useCollection<ChatMessage>(allMessagesQuery);

    const unreadMessages = useMemo(() => {
        if (!allMessages || !userId) return [];
        return allMessages.filter(msg => !msg.readBy?.includes(userId));
    }, [allMessages, userId]);

    return { 
        unreadMessages, 
        unreadCount: unreadMessages.length, 
        isLoading, 
        error 
    };
}
