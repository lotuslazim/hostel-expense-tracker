
"use client";

import { useState, useMemo, useEffect } from "react";
import { useUser, useDoc, useCollection } from "@/firebase";
import { firestore } from "@/firebase/config";
import { doc, collection, query, orderBy, limit, updateDoc, where } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { Skeleton } from "../ui/skeleton";
import type { Reminder } from "@/lib/types";

export function NotificationBell() {
    const { user: currentUser } = useUser();
    const [hasUnread, setHasUnread] = useState(false);

    const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [currentUser]);
    const { data: currentUserData } = useDoc(currentUserRef);
    const groupId = currentUserData?.groupId;

    const remindersQuery = useMemo(() => {
        if (!groupId) return null;
        return query(
            collection(firestore, `groups/${groupId}/reminders`),
            orderBy("createdAt", "desc"),
            limit(10)
        );
    }, [groupId]);

    const { data: reminders, isLoading } = useCollection<Reminder>(remindersQuery);
    
    useEffect(() => {
        if (reminders) {
            const unread = reminders.some(r => !r.read?.includes(currentUser?.uid ?? ''));
            setHasUnread(unread);
        }
    }, [reminders, currentUser]);


    const handleMarkAsRead = async (reminderId: string) => {
        if (!currentUser || !groupId) return;
        
        const reminderRef = doc(firestore, `groups/${groupId}/reminders`, reminderId);
        const reminder = reminders?.find(r => r.id === reminderId);
        
        if (reminder && !reminder.read?.includes(currentUser.uid)) {
            const newReadArray = [...(reminder.read || []), currentUser.uid];
            await updateDoc(reminderRef, { read: newReadArray });
        }
    };
    
    const handleOpen = async (isOpen: boolean) => {
        if(isOpen && hasUnread) {
            reminders?.forEach(async (reminder) => {
                if(!reminder.read?.includes(currentUser?.uid ?? '')) {
                   await handleMarkAsRead(reminder.id);
                }
            });
            setHasUnread(false);
        }
    }

    if (isLoading) {
        return <Skeleton className="h-9 w-9 rounded-full" />;
    }
    
    if (!groupId) {
        return (
            <Button variant="ghost" size="icon" disabled>
                <Bell />
            </Button>
        )
    }

    return (
        <DropdownMenu onOpenChange={handleOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Open notifications">
                    <Bell />
                    {hasUnread && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />}
                    <span className="sr-only">Open notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {reminders && reminders.length > 0 ? (
                    reminders.map(reminder => (
                        <DropdownMenuItem key={reminder.id} className="flex flex-col items-start gap-1 whitespace-normal">
                             <div className="flex w-full justify-between items-center">
                                <p className="text-xs font-bold">{reminder.senderName}</p>
                                <p className="text-xs text-muted-foreground">
                                    {reminder.createdAt ? formatDistanceToNow(reminder.createdAt.toDate(), { addSuffix: true }) : ''}
                                </p>
                             </div>
                             <p className="text-sm text-muted-foreground w-full">{reminder.messageText}</p>
                        </DropdownMenuItem>
                    ))
                ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                        No notifications yet.
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )

}
