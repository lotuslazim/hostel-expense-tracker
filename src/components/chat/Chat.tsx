
"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useCollection, useDoc } from "@/firebase";
import { collection, query, orderBy, addDoc, serverTimestamp, doc } from "firebase/firestore";
import { firestore } from "@/firebase/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { User } from 'firebase/auth';
import type { ChatMessage as ChatMessageType } from "@/lib/types";
import { Loader2, Send, Image as ImageIcon, X, MessageSquare } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { uploadToCloudinary } from "@/lib/cloudinary";

interface ChatProps {
    groupId: string;
    currentUser: User | null;
}

function ChatSkeleton() {
    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow p-4 space-y-6">
                <div className="flex items-end gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-16 w-3/5 rounded-xl" />
                </div>
                <div className="flex items-end gap-2 justify-end">
                    <Skeleton className="h-24 w-1/2 rounded-xl" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                </div>
                 <div className="flex items-end gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-12 w-2/s rounded-xl" />
                </div>
                 <div className="flex items-end gap-2 justify-end">
                    <Skeleton className="h-16 w-3/4 rounded-xl" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                </div>
            </div>
            <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                    <Skeleton className="flex-grow h-10 rounded-lg" />
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <Skeleton className="h-10 w-20 rounded-lg" />
                </div>
            </div>
        </div>
    )
}

export function Chat({ groupId, currentUser }: ChatProps) {
    const { toast } = useToast();
    const [newMessage, setNewMessage] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollAreaViewportRef = useRef<HTMLDivElement>(null);

    const groupRef = useMemo(() => doc(firestore, "groups", groupId), [groupId]);
    const { data: groupData, isLoading: isGroupDataLoading } = useDoc(groupRef);

    const messagesQuery = useMemo(() => {
        return query(
            collection(firestore, `groups/${groupId}/messages`),
            orderBy("createdAt", "asc")
        );
    }, [groupId]);

    const { data: messages, isLoading: areMessagesLoading } = useCollection<ChatMessageType>(messagesQuery);
    
    useEffect(() => {
      if (scrollAreaViewportRef.current) {
        scrollAreaViewportRef.current.scrollTo({
            top: scrollAreaViewportRef.current.scrollHeight,
            behavior: 'smooth'
        });
      }
    }, [messages]);


    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                const imageCompression = (await import('browser-image-compression')).default;
                const compressedFile = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1024 });
                setImageFile(compressedFile as File);
                setImagePreview(URL.createObjectURL(compressedFile));
            } catch (error) {
                toast({ variant: "destructive", title: "Error compressing image." });
            }
        }
    };
    
    const clearImageSelection = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };


    const handleSendMessage = async () => {
        if (!currentUser) return;
        if (!newMessage.trim() && !imageFile) return;

        setIsSending(true);

        try {
            let imageUrl: string | null = null;

            if (imageFile) {
                imageUrl = await uploadToCloudinary(
                    imageFile,
                    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
                    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
                );
                if (!imageUrl) {
                    toast({
                        variant: "destructive",
                        title: "Image Upload Failed",
                        description: "Please configure Cloudinary in your project settings."
                    });
                }
            }

            await addDoc(collection(firestore, `groups/${groupId}/messages`), {
                text: newMessage.trim(),
                imageUrl: imageUrl,
                createdAt: serverTimestamp(),
                userId: currentUser.uid,
                userName: currentUser.displayName || currentUser.email?.split('@')[0],
                userPhotoURL: currentUser.photoURL,
                groupId,
            });
            
            setNewMessage("");
            clearImageSelection();

        } catch (error) {
            console.error("Error sending message:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to send message. Please try again."
            });
        } finally {
            setIsSending(false);
        }
    };

    const isLoading = areMessagesLoading || isGroupDataLoading;

    return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto bg-card">
            <CardHeader className="border-b bg-background z-10">
                <CardTitle>
                    {isGroupDataLoading ? <Skeleton className="h-7 w-48" /> : groupData?.groupName || "Group Chat"}
                </CardTitle>
            </CardHeader>
            <div className="flex-grow overflow-hidden">
                <ScrollArea className="h-full" viewportRef={scrollAreaViewportRef}>
                     <div className="p-4 sm:p-6 space-y-6">
                        {isLoading ? (
                           <ChatSkeleton />
                        ) : messages && messages.length > 0 ? (
                            messages.map(msg => (
                                <ChatMessage key={msg.id} message={msg} currentUserId={currentUser?.uid ?? ''} />
                            ))
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                <div className="text-center">
                                    <MessageSquare className="h-12 w-12 mx-auto text-muted" />
                                    <p className="mt-4">No messages yet.</p>
                                    <p className="text-sm">Start the conversation!</p>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
            <CardFooter className="p-2 sm:p-4 border-t bg-muted/50">
                <div className="flex flex-col w-full gap-2">
                    {imagePreview && (
                        <div className="relative w-24 h-24 ml-2">
                            <img src={imagePreview} alt="Preview" className="rounded-md object-cover w-full h-full border" />
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-md"
                                onClick={clearImageSelection}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                         <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isSending}
                        >
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </Button>
                        <Input
                            type="text"
                            placeholder="Type a message..."
                            className="h-10 bg-background"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !isSending && handleSendMessage()}
                            disabled={isSending}
                        />
                        <Button onClick={handleSendMessage} disabled={isSending || (!newMessage.trim() && !imageFile)} size="icon" className="shrink-0">
                            {isSending ? <Loader2 className="animate-spin" /> : <Send />}
                        </Button>
                    </div>
                </div>
            </CardFooter>
        </div>
    );
}
