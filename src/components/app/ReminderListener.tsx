
"use client";

import { useEffect, useMemo, useRef } from 'react';
import { useUser, useDoc } from '@/firebase';
import { firestore } from '@/firebase/config';
import { collection, query, onSnapshot, Timestamp, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Reminder } from '@/lib/types';
import { doc } from 'firebase/firestore';

export function ReminderListener() {
    const { user: currentUser } = useUser();
    const { toast } = useToast();
    const lastReminderTimestampRef = useRef<Date | null>(null);
    const isInitialLoadRef = useRef(true);

    const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [currentUser]);
    const { data: currentUserData } = useDoc(currentUserRef);

    const groupId = currentUserData?.groupId;

    useEffect(() => {
        if (!groupId || !currentUser) return;

        // Simplified query: Remove the 'where' clause that was causing permission issues.
        // We now fetch all reminders for the group and filter them on the client.
        const remindersQuery = query(
            collection(firestore, `groups/${groupId}/reminders`),
            orderBy('createdAt', 'asc') // Order by timestamp to process chronologically
        );

        const unsubscribe = onSnapshot(remindersQuery, (snapshot) => {
            // After the first snapshot is received, we are no longer in the "initial load" phase.
            // Any changes from this point on are live updates.
            if (isInitialLoadRef.current) {
                // Set the timestamp of the last document from the initial load.
                // This ensures we don't show toasts for old messages, only for new ones that arrive after this.
                if (snapshot.docs.length > 0) {
                   const lastDoc = snapshot.docs[snapshot.docs.length - 1];
                   lastReminderTimestampRef.current = (lastDoc.data().createdAt as Timestamp).toDate();
                } else {
                   lastReminderTimestampRef.current = new Date(); // No reminders yet, start from now.
                }
                isInitialLoadRef.current = false;
                return; // Skip processing for the initial batch of documents.
            }
            
            snapshot.docChanges().forEach((change) => {
                // We only care about newly added documents after the initial load.
                if (change.type === 'added') {
                    const reminder = change.doc.data() as Reminder;
                    const reminderDate = (reminder.createdAt as Timestamp).toDate();

                    // Don't show toast for the sender's own reminder.
                    if (reminder.senderId === currentUser.uid) {
                        return;
                    }

                    // Client-side filtering: Only show a toast if the reminder is new since the last one we processed.
                    if (lastReminderTimestampRef.current && reminderDate > lastReminderTimestampRef.current) {
                        toast({
                            title: `Reminder from ${reminder.senderName}`,
                            description: reminder.messageText,
                            duration: 10000,
                        });
                         // Update the ref to the timestamp of the newest reminder we just processed.
                        lastReminderTimestampRef.current = reminderDate;
                    }
                }
            });

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
