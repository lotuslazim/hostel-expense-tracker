
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

        isInitialLoadRef.current = true;
        lastReminderTimestampRef.current = null;

        const remindersQuery = query(
            collection(firestore, `groups/${groupId}/reminders`),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(remindersQuery, (snapshot) => {
            const changes = snapshot.docChanges();

            if (isInitialLoadRef.current) {
                if (snapshot.docs.length > 0) {
                    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
                    lastReminderTimestampRef.current = (lastDoc.data().createdAt as Timestamp).toDate();
                } else {
                    lastReminderTimestampRef.current = new Date();
                }
                isInitialLoadRef.current = false;
                return; 
            }
            
            changes.forEach((change) => {
                if (change.type === 'added') {
                    const reminder = change.doc.data() as Reminder;
                    const reminderDate = (reminder.createdAt as Timestamp).toDate();

                    if (reminder.senderId === currentUser.uid) {
                        return;
                    }

                    if (lastReminderTimestampRef.current && reminderDate > lastReminderTimestampRef.current) {
                        toast({
                            title: `Reminder from ${reminder.senderName}`,
                            description: reminder.messageText,
                            duration: 10000,
                        });
                        lastReminderTimestampRef.current = reminderDate;
                    }
                }
            });

        }, (error) => {
            console.error("Error in ReminderListener snapshot:", error);
        });

        return () => {
            unsubscribe();
            isInitialLoadRef.current = true;
        };
    }, [groupId, currentUser, toast]);

    return null;
}
