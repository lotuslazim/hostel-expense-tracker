"use client";

import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/lib/types";

interface ChatMessageProps {
    message: ChatMessageType;
    currentUserId: string;
}

export function ChatMessage({
    message,
    currentUserId,
}: ChatMessageProps) {
    const isCurrentUser = message.userId === currentUserId;

    const messageDate =
        message.createdAt instanceof Timestamp
            ? message.createdAt.toDate()
            : new Date();

    const hasOnlyImage = Boolean(
        message.imageUrl && !message.text?.trim()
    );

    const userInitial =
        message.userName?.trim().charAt(0).toUpperCase() || "U";

    return (
        <div
            className={cn(
                "flex items-end gap-2",
                isCurrentUser && "justify-end"
            )}
        >
            {/* অন্য user-এর avatar */}
            {!isCurrentUser && (
                <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage
                        src={message.userPhotoURL || undefined}
                        alt={message.userName || "User"}
                    />
                    <AvatarFallback>{userInitial}</AvatarFallback>
                </Avatar>
            )}

            {/* Message এবং time */}
            <div
                className={cn(
                    "flex max-w-xs flex-col md:max-w-md",
                    isCurrentUser ? "items-end" : "items-start"
                )}
            >
                <div
                    className={cn(
                        "flex max-w-full flex-col",
                        hasOnlyImage
                            ? "overflow-hidden rounded-lg bg-transparent p-0"
                            : isCurrentUser
                                ? "rounded-xl rounded-br-none bg-primary p-3 text-primary-foreground"
                                : "rounded-xl rounded-bl-none bg-muted p-3"
                    )}
                >
                    {!isCurrentUser && !hasOnlyImage && (
                        <p className="mb-1 text-xs font-bold text-primary">
                            {message.userName}
                        </p>
                    )}

                    {message.imageUrl && (
                        <a
                            href={message.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                                "block overflow-hidden rounded-lg bg-transparent",
                                message.text && "mb-2"
                            )}
                        >
                            <img
                                src={message.imageUrl}
                                alt="Chat attachment"
                                className="block h-auto max-w-full cursor-pointer rounded-lg border-0 bg-transparent object-contain outline-none"
                                style={{ maxHeight: "300px" }}
                            />
                        </a>
                    )}

                    {message.text && (
                        <p className="whitespace-pre-wrap break-words leading-relaxed">
                            {message.text}
                        </p>
                    )}
                </div>

                <p className="px-1 pt-1 text-[10px] text-muted-foreground">
                    {format(messageDate, "p")}
                </p>
            </div>

            {/* নিজের avatar */}
            {isCurrentUser && (
                <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage
                        src={message.userPhotoURL || undefined}
                        alt={message.userName || "User"}
                    />
                    <AvatarFallback>{userInitial}</AvatarFallback>
                </Avatar>
            )}
        </div>
    );
}