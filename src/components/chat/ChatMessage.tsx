
"use client";

import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
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
    
    return (
        <div className={cn("flex items-end gap-2", isCurrentUser && "justify-end")}>
            {!isCurrentUser && (
                <Avatar className="h-8 w-8">
                    <AvatarImage src={message.userPhotoURL} />
                    <AvatarFallback>{message.userName?.charAt(0) ?? 'U'}</AvatarFallback>
                </Avatar>
            )}
            <div
                className={cn(
                    "max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg flex flex-col",
                    isCurrentUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                )}
            >
                {!isCurrentUser && <p className="text-xs font-bold mb-1">{message.userName}</p>}
                
                {message.imageUrl && (
                     <a href={message.imageUrl} target="_blank" rel="noopener noreferrer">
                        <img 
                            src={message.imageUrl} 
                            alt="Chat image" 
                            className="rounded-md max-w-full h-auto cursor-pointer"
                            style={{ maxHeight: '300px' }}
                        />
                     </a>
                )}
                {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}
                
                <p className={cn(
                    "text-xs mt-2 opacity-70",
                    isCurrentUser ? "text-right" : "text-left"
                )}>
                    {format(messageDate, 'p')}
                </p>
            </div>
             {isCurrentUser && (
                <Avatar className="h-8 w-8">
                    <AvatarImage src={message.userPhotoURL} />
                    <AvatarFallback>{message.userName?.charAt(0) ?? 'U'}</AvatarFallback>
                </Avatar>
            )}
        </div>
    );
}
