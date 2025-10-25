
"use client";

import { useEffect, useMemo, useRef } from 'react';
import { useUser, useDoc } from '@/firebase';
import { firestore } from '@/firebase/config';
import { collection, query, onSnapshot, Timestamp, orderBy, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Reminder } from '@/lib/types';
import { doc } from 'firebase/firestore';

export function ReminderListener() {
    const { user: currentUser } = useUser();
    const { toast } = useToast();
    const lastReminderTimestampRef = useRef<Date | null>(null);

    const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [currentUser]);
    const { data: currentUserData } = useDoc(currentUserRef);

    const groupId = currentUserData?.groupId;

    useEffect(() => {
        if (!groupId || !currentUser) return;

        // Fetch reminders created after the component mounts to avoid showing old toasts.
        const remindersQuery = query(
            collection(firestore, `groups/${groupId}/reminders`),
            where('createdAt', '>', Timestamp.now()),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(remindersQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const reminder = change.doc.data() as Reminder;
                    
                    if (reminder.senderId === currentUser.uid) {
                        return; // Don't toast for your own reminders
                    }

                    toast({
                        title: `Reminder from ${reminder.senderName}`,
                        description: reminder.messageText,
                        duration: 10000,
                    });
                }
            });

        }, (error) => {
            console.error("Error in ReminderListener snapshot:", error);
        });

        return () => unsubscribe();
    }, [groupId, currentUser, toast]);

    return null;
}
