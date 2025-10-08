
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
        <div className={cn("flex items-end gap-2 group", isCurrentUser && "justify-end")}>
            {!isCurrentUser && (
                <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={message.userPhotoURL} />
                    <AvatarFallback>{message.userName?.charAt(0) ?? 'U'}</AvatarFallback>
                </Avatar>
            )}
            <div
                className={cn(
                    "max-w-[70%] p-3 rounded-xl flex flex-col",
                    isCurrentUser
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted rounded-bl-none"
                )}
            >
                {!isCurrentUser && <p className="text-xs font-bold mb-1 text-primary">{message.userName}</p>}
                
                {message.imageUrl && (
                     <a href={message.imageUrl} target="_blank" rel="noopener noreferrer" className="mb-2">
                        <img 
                            src={message.imageUrl} 
                            alt="Chat attachment" 
                            className="rounded-lg max-w-full h-auto cursor-pointer border-2 border-background"
                            style={{ maxHeight: '300px' }}
                        />
                     </a>
                )}
                {message.text && <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>}
            </div>
             <p className={cn(
                "text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity",
                isCurrentUser ? "mr-2" : "ml-2"
            )}>
                {format(messageDate, 'p')}
            </p>
             {isCurrentUser && (
                <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={message.userPhotoURL} />
                    <AvatarFallback>{message.userName?.charAt(0) ?? 'U'}</AvatarFallback>
                </Avatar>
            )}
        </div>
    );
}

