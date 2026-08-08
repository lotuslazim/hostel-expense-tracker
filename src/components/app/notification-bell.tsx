"use client";

import { useEffect, useMemo, useState } from "react";
import {
    collection,
    doc,
    limit,
    orderBy,
    query,
    type Timestamp,
    writeBatch,
} from "firebase/firestore";
import { Bell, MessageSquare, ShoppingCart } from "lucide-react";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";

import { useCollection, useDoc, useUser } from "@/firebase";
import { firestore } from "@/firebase/config";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type AppNotification = {
    id: string;
    senderName?: string;
    messageText?: string;
    readBy?: string[];
    createdAt?: Timestamp | null;
};

export function NotificationBell() {
    const { user: currentUser } = useUser();
    const [hasUnread, setHasUnread] = useState(false);

    const currentUserRef = useMemo(
        () =>
            currentUser
                ? doc(firestore, "users", currentUser.uid)
                : null,
        [currentUser]
    );

    const { data: currentUserData } = useDoc(currentUserRef);
    const groupId = currentUserData?.groupId;

    const notificationsQuery = useMemo(() => {
        if (!groupId) {
            return null;
        }

        return query(
            collection(
                firestore,
                `groups/${groupId}/notifications`
            ),
            orderBy("createdAt", "desc"),
            limit(10)
        );
    }, [groupId]);

    const {
        data: notifications,
        isLoading,
    } = useCollection<AppNotification>(notificationsQuery);

    useEffect(() => {
        if (!notifications) {
            setHasUnread(false);
            return;
        }

        const unread = notifications.some(
            (notification) =>
                !notification.readBy?.includes(
                    currentUser?.uid ?? ""
                )
        );

        setHasUnread(unread);
    }, [notifications, currentUser]);

    const handleOpen = async (isOpen: boolean) => {
        if (
            !isOpen ||
            !hasUnread ||
            !notifications ||
            !currentUser ||
            !groupId
        ) {
            return;
        }

        const batch = writeBatch(firestore);

        notifications.forEach((notification) => {
            if (
                !notification.readBy?.includes(currentUser.uid)
            ) {
                const notificationRef = doc(
                    firestore,
                    `groups/${groupId}/notifications`,
                    notification.id
                );

                batch.update(notificationRef, {
                    readBy: [
                        ...(notification.readBy || []),
                        currentUser.uid,
                    ],
                });
            }
        });

        await batch.commit();
        setHasUnread(false);
    };

    if (isLoading) {
        return (
            <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
        );
    }

    if (!groupId) {
        return (
            <Button
                variant="ghost"
                size="icon"
                disabled
                className="h-10 w-10 rounded-full text-white/45"
                aria-label="Notifications unavailable"
            >
                <Bell className="h-5 w-5" strokeWidth={1.9} />
            </Button>
        );
    }

    return (
        <DropdownMenu onOpenChange={(open) => void handleOpen(open)}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-10 w-10 rounded-full border-0 bg-transparent text-white/90 shadow-none hover:bg-white/[0.07] hover:text-white"
                    aria-label="Open notifications"
                >
                    <Bell className="h-[20px] w-[20px]" strokeWidth={1.9} />

                    {hasUnread && (
                        <span className="absolute right-[8px] top-[7px] h-2 w-2 rounded-full bg-[#ff6b57] ring-2 ring-[#10241c]" />
                    )}

                    <span className="sr-only">Open notifications</span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                className="w-[min(21rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border-white/10 bg-[#10241c] p-0 text-white shadow-[0_18px_48px_rgba(0,0,0,0.38)]"
                align="end"
                sideOffset={10}
            >
                <DropdownMenuLabel className="px-4 py-3.5 text-[14px] font-semibold tracking-[-0.01em]">
                    Notifications
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="m-0 bg-white/10" />

                {notifications && notifications.length > 0 ? (
                    notifications.map((notification) => {
                        const isUnread =
                            !notification.readBy?.includes(
                                currentUser?.uid ?? ""
                            );

                        return (
                            <DropdownMenuItem
                                key={notification.id}
                                className={cn(
                                    "flex cursor-default flex-col items-start gap-1.5 rounded-none border-b border-white/[0.07] px-4 py-3.5 whitespace-normal focus:bg-white/[0.06]",
                                    isUnread && "bg-[#17352c]"
                                )}
                            >
                                <div className="flex w-full items-center justify-between gap-3">
                                    <p className="flex min-w-0 items-center gap-2 text-[12px] font-semibold text-[#f4f7f5]">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#74d8c8]/12 text-[#74d8c8]">
                                            <ShoppingCart className="h-3.5 w-3.5" />
                                        </span>

                                        <span className="truncate">
                                            {notification.senderName || "BachelorBite"}
                                        </span>
                                    </p>

                                    <p className="shrink-0 text-[10px] text-[#9fb0a8]">
                                        {notification.createdAt
                                            ? formatDistanceToNow(
                                                notification.createdAt.toDate(),
                                                { addSuffix: true }
                                            )
                                            : ""}
                                    </p>
                                </div>

                                <p className="w-full pl-8 text-[12px] leading-5 text-[#bdc9c3]">
                                    {notification.messageText}
                                </p>
                            </DropdownMenuItem>
                        );
                    })
                ) : (
                    <div className="p-6 text-center text-[13px] text-[#9fb0a8]">
                        <MessageSquare className="mx-auto mb-2 h-8 w-8 text-[#74d8c8]/65" />
                        No notifications yet.
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
