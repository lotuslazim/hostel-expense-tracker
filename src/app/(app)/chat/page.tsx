
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFirebase, useUser, useDoc, useCollection } from "@/firebase";
import {
  doc,
  addDoc,
  collection,
  serverTimestamp,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, MessageSquare, Paperclip, X } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import placeholderImages from "@/lib/placeholder-images.json";
import { cn } from "@/lib/utils";
import { WelcomeCard } from "@/components/app/welcome-card";

const chatSchema = z.object({
  message: z.string(),
  image: z.instanceof(File).optional(),
}).refine(data => !!data.message || !!data.image, {
    message: "Message or image is required.",
    path: ["message"],
});


export default function ChatPage() {
  const { firestore, storage } = useFirebase();
  const { user: currentUser, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUserRef = useMemo(
    () => (currentUser ? doc(firestore, "users", currentUser.uid) : null),
    [firestore, currentUser]
  );
  const { data: currentUserData, isLoading: isCurrentUserDataLoading } =
    useDoc(currentUserRef);
  const groupId = currentUserData?.groupId;

  const messagesQuery = useMemo(() => {
    if (!groupId) return null;
    return query(
      collection(firestore, `groups/${groupId}/messages`),
      orderBy("createdAt", "asc"),
      limit(50)
    );
  }, [firestore, groupId]);

  const { data: messages, isLoading: areMessagesLoading } =
    useCollection<ChatMessage>(messagesQuery);

  const form = useForm<z.infer<typeof chatSchema>>({
    resolver: zodResolver(chatSchema),
    defaultValues: {
      message: "",
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("image", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImagePreview = () => {
      setImagePreview(null);
      form.setValue("image", undefined);
      if(fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  }

  async function onSubmit(values: z.infer<typeof chatSchema>) {
    if (!currentUser || !groupId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be in a group to send a message.",
      });
      return;
    }

    setIsSubmitting(true);
    let imageUrl: string | undefined = undefined;

    try {
      if (values.image) {
        const imageRef = ref(storage, `chatImages/${groupId}/${Date.now()}_${values.image.name}`);
        const snapshot = await uploadBytes(imageRef, values.image);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      await addDoc(collection(firestore, `groups/${groupId}/messages`), {
        text: values.message || "",
        imageUrl: imageUrl,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email?.split("@")[0],
        groupId: groupId,
        createdAt: serverTimestamp(),
      });
      form.reset();
      clearImagePreview();
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not send message. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "div[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const isLoading = isUserLoading || isCurrentUserDataLoading;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!groupId) {
    return <WelcomeCard />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare /> Group Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="space-y-4 pr-4">
            {areMessagesLoading && (
              <div className="text-center text-muted-foreground">
                Loading messages...
              </div>
            )}
            {!areMessagesLoading && messages && messages.length === 0 && (
              <div className="text-center text-muted-foreground pt-8">
                No messages yet. Start the conversation!
              </div>
            )}
            {messages?.map((msg) => {
              const isCurrentUser = msg.userId === currentUser?.uid;
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex items-end gap-2",
                    isCurrentUser ? "justify-end" : "justify-start"
                  )}
                >
                  {!isCurrentUser && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={
                          placeholderImages.placeholderImages.find(
                            (p) => p.id === "user-avatar-2"
                          )?.imageUrl
                        }
                      />
                      <AvatarFallback>{msg.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg",
                      isCurrentUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {msg.imageUrl && (
                        <div className="relative w-full aspect-video rounded-md overflow-hidden mb-2">
                            <Image src={msg.imageUrl} alt="Chat image" fill style={{ objectFit: 'cover' }} />
                        </div>
                    )}
                    {msg.text && <p className="text-sm">{msg.text}</p>}
                    <p
                      className={cn(
                        "text-xs mt-1",
                        isCurrentUser
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      )}
                    >
                      {msg.userName} -{" "}
                      {msg.createdAt ? format(msg.createdAt.toDate(), "p") : "sending..."}
                    </p>
                  </div>
                  {isCurrentUser && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={
                          placeholderImages.placeholderImages.find(
                            (p) => p.id === "user-avatar"
                          )?.imageUrl
                        }
                      />
                      <AvatarFallback>{msg.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-4 flex-col items-start gap-2">
        {imagePreview && (
          <div className="relative">
            <Image src={imagePreview} alt="Image preview" width={80} height={80} className="rounded-md object-cover"/>
            <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-6 w-6 bg-black/50 hover:bg-black/75 text-white" onClick={clearImagePreview}>
                <X className="h-4 w-4"/>
            </Button>
          </div>
        )}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex w-full items-center gap-2"
          >
             <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden"/>
                  </FormControl>
                  <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                      <Paperclip className="h-4 w-4"/>
                      <span className="sr-only">Attach image</span>
                  </Button>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormControl>
                    <Input
                      placeholder="Type a message..."
                      {...field}
                      autoComplete="off"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting} size="icon">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </Form>
      </CardFooter>
    </div>
  );
}
