
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
    const lastReminderTimestampRef = useRef<Timestamp | null>(null);

    const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [currentUser]);
    const { data: currentUserData } = useDoc(currentUserRef);

    const groupId = currentUserData?.groupId;

    useEffect(() => {
        if (!groupId || !currentUser) return;

        // Set initial timestamp to now to avoid showing old reminders on first load
        if (!lastReminderTimestampRef.current) {
            lastReminderTimestampRef.current = Timestamp.now();
        }

        const remindersQuery = query(
            collection(firestore, `groups/${groupId}/reminders`),
            where('createdAt', '>', lastReminderTimestampRef.current)
        );

        const unsubscribe = onSnapshot(remindersQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const reminder = change.doc.data() as Reminder;
                    
                    // Don't show toast for the sender's own reminder
                    if (reminder.senderId === currentUser.uid) {
                        return;
                    }

                    // Update the last seen timestamp
                    const newTimestamp = reminder.createdAt;
                    if (!lastReminderTimestampRef.current || newTimestamp.toMillis() > lastReminderTimestampRef.current.toMillis()) {
                        lastReminderTimestampRef.current = newTimestamp;
                    }
                    
                    toast({
                        title: `Reminder from ${reminder.senderName}`,
                        description: reminder.messageText,
                        duration: 10000, // Keep toast on screen for longer
                    });
                }
            });
        });

        return () => unsubscribe();
    }, [groupId, currentUser, toast]);

    return null; // This component does not render anything
}
