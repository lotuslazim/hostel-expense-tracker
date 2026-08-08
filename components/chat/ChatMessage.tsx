"use client";

import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type ChatMessageRecord = {
    id: string;
    text?: string | null;
    imageUrl?: string | null;
    createdAt?: Timestamp | Date | null;
    userId: string;
    userName?: string | null;
    userPhotoURL?: string | null;
    groupId?: string;
    readBy?: string[];
};

interface ChatMessageProps {
    message: ChatMessageRecord;
    currentUserId: string;
    showAvatar?: boolean;
    showName?: boolean;
}

export function ChatMessage({
    message,
    currentUserId,
    showAvatar = true,
    showName = true,
}: ChatMessageProps) {
    const isCurrentUser = message.userId === currentUserId;

    const messageDate =
        message.createdAt instanceof Timestamp
            ? message.createdAt.toDate()
            : message.createdAt instanceof Date
                ? message.createdAt
                : new Date();

    const hasOnlyImage = Boolean(
        message.imageUrl && !message.text?.trim()
    );

    const userInitial =
        message.userName?.trim().charAt(0).toUpperCase() || "U";

    const avatar = (
        <Avatar
            className={cn(
                "h-8 w-8 shrink-0",
                isCurrentUser
                    ? "ring-1 ring-[#f6cf58]/70 ring-offset-1 ring-offset-[#09130f]"
                    : "ring-1 ring-[#74d8c8]/30 ring-offset-1 ring-offset-[#09130f]"
            )}
        >
            <AvatarImage
                src={message.userPhotoURL || undefined}
                alt={message.userName || "User"}
            />
            <AvatarFallback className="bg-[#1e463b] text-[11px] font-semibold text-white">
                {userInitial}
            </AvatarFallback>
        </Avatar>
    );

    return (
        <div
            className={cn(
                "flex items-end gap-2",
                isCurrentUser && "justify-end"
            )}
        >
            {!isCurrentUser &&
                (showAvatar ? (
                    avatar
                ) : (
                    <span className="h-8 w-8 shrink-0" aria-hidden="true" />
                ))}

            <div
                className={cn(
                    "flex max-w-[78%] flex-col sm:max-w-[70%] md:max-w-md",
                    isCurrentUser ? "items-end" : "items-start"
                )}
            >
                <div
                    className={cn(
                        "flex max-w-full flex-col text-[13px] leading-relaxed shadow-[0_8px_22px_rgba(0,0,0,0.12)]",
                        hasOnlyImage
                            ? "overflow-hidden rounded-2xl border border-white/[0.08] bg-transparent p-0"
                            : isCurrentUser
                                ? "rounded-[18px] rounded-br-[5px] border border-[#f6cf58]/20 bg-gradient-to-br from-[#f8d85c] to-[#efa947] px-3.5 py-2.5 text-[#172018]"
                                : "rounded-[18px] rounded-bl-[5px] border border-[#74d8c8]/12 bg-gradient-to-br from-[#1b3b34] to-[#153139] px-3.5 py-2.5 text-[#edf5f1]"
                    )}
                >
                    {!isCurrentUser && !hasOnlyImage && showName && (
                        <p className="mb-1 text-[11px] font-semibold tracking-[-0.01em] text-[#8be0d2]">
                            {message.userName || "Member"}
                        </p>
                    )}

                    {message.imageUrl && (
                        <a
                            href={message.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                                "block overflow-hidden rounded-[14px] bg-transparent",
                                message.text && "mb-2"
                            )}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={message.imageUrl}
                                alt="Chat attachment"
                                className="block h-auto max-w-full cursor-pointer rounded-[14px] border border-white/[0.08] bg-transparent object-contain outline-none transition-transform duration-200 hover:scale-[1.01]"
                                style={{ maxHeight: "320px" }}
                            />
                        </a>
                    )}

                    {message.text && (
                        <p className="whitespace-pre-wrap break-words">
                            {message.text}
                        </p>
                    )}
                </div>

                <p className="px-1 pt-1 text-[9.5px] font-normal text-[#84968d]">
                    {format(messageDate, "p")}
                </p>
            </div>

            {isCurrentUser &&
                (showAvatar ? (
                    avatar
                ) : (
                    <span className="h-8 w-8 shrink-0" aria-hidden="true" />
                ))}
        </div>
    );
}
