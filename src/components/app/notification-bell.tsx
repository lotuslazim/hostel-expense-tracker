
"use client";

import { useState, useMemo, useEffect } from "react";
import { useUser, useDoc, useCollection } from "@/firebase";
import { firestore } from "@/firebase/config";
import { doc, collection, query, orderBy, limit, updateDoc, where, writeBatch } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, MessageSquare, ShoppingCart } from "lucide-react";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { Skeleton } from "../ui/skeleton";
import type { Notification } from '@/lib/types';
import { cn } from "@/lib/utils";

export function NotificationBell() {
    const { user: currentUser } = useUser();
    const [hasUnread, setHasUnread] = useState(false);

    const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [currentUser]);
    const { data: currentUserData } = useDoc(currentUserRef);
    const groupId = currentUserData?.groupId;

    const notificationsQuery = useMemo(() => {
        if (!groupId) return null;
        return query(
            collection(firestore, `groups/${groupId}/notifications`),
            orderBy("createdAt", "desc"),
            limit(10)
        );
    }, [groupId]);

    const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);
    
    useEffect(() => {
        if (notifications) {
            const unread = notifications.some(n => !n.readBy?.includes(currentUser?.uid ?? ''));
            setHasUnread(unread);
        }
    }, [notifications, currentUser]);

    const handleMarkAsRead = async (notificationId: string) => {
        if (!currentUser || !groupId) return;
        
        const notificationRef = doc(firestore, `groups/${groupId}/notifications`, notificationId);
        const notification = notifications?.find(n => n.id === notificationId);
        
        if (notification && !notification.readBy?.includes(currentUser.uid)) {
            const newReadArray = [...(notification.readBy || []), currentUser.uid];
            await updateDoc(notificationRef, { readBy: newReadArray });
        }
    };
    
    const handleOpen = async (isOpen: boolean) => {
        if(isOpen && hasUnread && notifications) {
            const batch = writeBatch(firestore);
            notifications.forEach(notification => {
                if (!notification.readBy?.includes(currentUser?.uid ?? '')) {
                    const notificationRef = doc(firestore, `groups/${groupId}/notifications`, notification.id);
                    batch.update(notificationRef, { readBy: [...(notification.readBy || []), currentUser!.uid] });
                }
            });
            await batch.commit();
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
                {notifications && notifications.length > 0 ? (
                    notifications.map(notification => {
                        const isUnread = !notification.readBy?.includes(currentUser?.uid ?? '');
                        return (
                            <DropdownMenuItem 
                                key={notification.id} 
                                className={cn(
                                    "flex flex-col items-start gap-1 whitespace-normal",
                                    isUnread && "bg-accent"
                                )}
                            >
                                <div className="flex w-full justify-between items-center">
                                    <p className="text-xs font-bold flex items-center gap-2">
                                        <ShoppingCart className="h-3 w-3 text-muted-foreground"/>
                                        {notification.senderName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {notification.createdAt ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true }) : ''}
                                    </p>
                                </div>
                                <p className="text-sm text-muted-foreground w-full pl-6">{notification.messageText}</p>
                            </DropdownMenuItem>
                        )
                    })
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

