
"use client";

import { useEffect, useMemo, useRef } from 'react';
import { useUser, useDoc } from '@/firebase';
import { firestore } from '@/firebase/config';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Reminder } from '@/lib/types';
import { doc } from 'firebase/firestore';

export function ReminderListener() {
    const { user: currentUser } = useUser();
    const { toast } = useToast();
    // Ref to track the timestamp of the last processed reminder to avoid duplicates
    const lastReminderTimestampRef = useRef<Timestamp | null>(null);
    // Ref to track if this is the first time the snapshot is being processed
    const isInitialLoadRef = useRef(true);

    const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [currentUser]);
    const { data: currentUserData } = useDoc(currentUserRef);

    const groupId = currentUserData?.groupId;

    useEffect(() => {
        if (!groupId || !currentUser) return;

        // Simplified query: Remove the 'where' clause.
        // We will fetch all reminders and filter on the client.
        const remindersQuery = query(
            collection(firestore, `groups/${groupId}/reminders`)
        );

        const unsubscribe = onSnapshot(remindersQuery, (snapshot) => {
            const now = Timestamp.now();
            
            // On the very first load, we set the last seen timestamp to 'now'
            // to avoid showing a toast for every old reminder in the database.
            if (isInitialLoadRef.current) {
                lastReminderTimestampRef.current = now;
                isInitialLoadRef.current = false;
                return; // Don't process on first load
            }
            
            snapshot.docChanges().forEach((change) => {
                // We only care about newly added documents.
                if (change.type === 'added') {
                    const reminder = change.doc.data() as Reminder;
                    const reminderTimestamp = reminder.createdAt;

                    // Don't show toast for the sender's own reminder.
                    if (reminder.senderId === currentUser.uid) {
                        return;
                    }

                    // Only show a toast if the reminder is new since the last one we processed.
                    // This prevents showing old messages or duplicates.
                    if (lastReminderTimestampRef.current && reminderTimestamp.toMillis() > lastReminderTimestampRef.current.toMillis()) {
                        toast({
                            title: `Reminder from ${reminder.senderName}`,
                            description: reminder.messageText,
                            duration: 10000,
                        });
                    }
                }
            });

            // After processing, update the last seen timestamp to the current time.
            // Any new reminder after this point will be processed.
            lastReminderTimestampRef.current = now;
        }, (error) => {
            // This will catch permission errors if they still occur.
            console.error("Error in ReminderListener snapshot:", error);
        });

        // Cleanup: reset initial load flag on component unmount or when dependencies change.
        return () => {
            unsubscribe();
            isInitialLoadRef.current = true;
        };
    }, [groupId, currentUser, toast]);

    return null; // This component does not render anything
}
