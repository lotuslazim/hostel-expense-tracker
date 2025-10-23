
"use client";

import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from 'date-fns/format';
import { Timestamp } from "firebase/firestore";

interface ChatMessageProps {
    message: ChatMessageType;
    currentUserId: string;
}

export function ChatMessage({ message, currentUserId }: ChatMessageProps) {
    const isCurrentUser = message.userId === currentUserId;

    const messageDate = message.createdAt instanceof Timestamp 
        ? message.createdAt.toDate() 
        : new Date(); // Fallback for optimistic updates

    const hasOnlyImage = message.imageUrl && !message.text;
    
    return (
        <div className={cn("flex items-end gap-2 group", isCurrentUser && "justify-end")}>
            {!isCurrentUser && (
                <Avatar className="h-8 w-8 shrink-0 self-end">
                    <AvatarImage src={message.userPhotoURL} />
                    <AvatarFallback>{message.userName?.charAt(0) ?? 'U'}</AvatarFallback>
                </Avatar>
            )}

            <div className={cn("flex flex-col gap-1", isCurrentUser ? "items-end" : "items-start")}>
                <div
                    className={cn(
                        "max-w-xs md:max-w-md rounded-xl flex flex-col",
                         hasOnlyImage ? "p-0 bg-transparent" : "p-3",
                        isCurrentUser
                            ? "bg-primary text-primary-foreground rounded-br-none"
                            : "bg-muted rounded-bl-none"
                    )}
                >
                    {!isCurrentUser && !hasOnlyImage && <p className="text-xs font-bold mb-1 text-primary">{message.userName}</p>}
                    
                    {message.imageUrl && (
                         <a href={message.imageUrl} target="_blank" rel="noopener noreferrer" className={cn(message.text && "mb-2")}>
                            <img 
                                src={message.imageUrl} 
                                alt="Chat attachment" 
                                className="rounded-lg max-w-full h-auto cursor-pointer"
                                style={{ maxHeight: '300px' }}
                            />
                         </a>
                    )}
                    {message.text && <p className="whitespace-pre-wrap leading-relaxed break-words">{message.text}</p>}
                </div>
                <p className="text-[10px] text-muted-foreground px-1">
                    {format(messageDate, 'p')}
                </p>
            </div>

             {isCurrentUser && (
                <Avatar className="h-8 w-8 shrink-0 self-end">
                    <AvatarImage src={message.userPhotoURL} />
                    <AvatarFallback>{message.userName?.charAt(0) ?? 'U'}</AvatarFallback>
                </Avatar>
            )}
        </div>
    );
}
