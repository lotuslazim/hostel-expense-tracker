"use client";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    addDoc,
    collection,
    doc,
    orderBy,
    query,
    serverTimestamp,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import {
    ArrowLeft,
    Brush,
    Grid,
    Image as ImageIcon,
    Images,
    Loader2,
    MessageSquare,
    MoreVertical,
    Send,
    Users,
    X,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { useCollection, useDoc } from "@/firebase";
import { firestore } from "@/firebase/config";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import {
    ChatMessage,
    type ChatMessageRecord,
} from "./ChatMessage";

interface ChatProps {
    groupId: string;
    currentUser: User | null;
}

type GroupRecord = {
    groupName?: string;
};

type GroupMemberRecord = {
    id: string;
    status?: string;
    displayName?: string;
    userName?: string;
    email?: string;
    photoURL?: string;
};

type UserProfileRecord = {
    displayName?: string;
    email?: string;
    photoURL?: string;
};

type DetailsView = "members" | "media";

function getInitials(value: string) {
    return value
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "M";
}

function MemberListItem({
    member,
}: {
    member: GroupMemberRecord;
}) {
    const userRef = useMemo(
        () => doc(firestore, "users", member.id),
        [member.id]
    );

    const {
        data: userData,
        isLoading,
    } = useDoc<UserProfileRecord>(userRef);

    const displayName =
        userData?.displayName ||
        member.displayName ||
        member.userName ||
        userData?.email ||
        member.email ||
        "Group member";

    const email = userData?.email || member.email;
    const photoURL = userData?.photoURL || member.photoURL;

    return (
        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-[#0b1813]/70 p-3">
            <Avatar className="h-10 w-10 border border-[#f4d35e]/45">
                <AvatarImage src={photoURL || undefined} alt={displayName} />
                <AvatarFallback className="bg-[#193b31] text-xs font-semibold text-[#e9f5ef]">
                    {isLoading ? "…" : getInitials(displayName)}
                </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-[#f2f7f4]">
                    {displayName}
                </p>
                {email && (
                    <p className="truncate text-[11px] text-[#c2b8a0]">
                        {email}
                    </p>
                )}
            </div>
        </div>
    );
}

function ChatSkeleton() {
    return (
        <div className="flex h-full flex-col">
            <div className="flex-grow space-y-4 p-4">
                <div className="flex items-end gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-16 w-3/5 rounded-[18px]" />
                </div>

                <div className="flex items-end justify-end gap-2">
                    <Skeleton className="h-24 w-1/2 rounded-[18px]" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                </div>

                <div className="flex items-end gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-12 w-2/5 rounded-[18px]" />
                </div>
            </div>
        </div>
    );
}

const backgroundOptions = [
    { name: "Default", class: "bb-chat-stage" },
    { name: "Subtle Grid", class: "bg-grid-pattern" },
    { name: "Colorful", class: "bg-wallpaper-1" },
    { name: "Landscape", class: "bg-wallpaper-2" },
    { name: "Abstract", class: "bg-wallpaper-3" },
];

export function Chat({
    groupId,
    currentUser,
}: ChatProps) {
    const { toast } = useToast();
    const router = useRouter();

    const [newMessage, setNewMessage] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
    const [detailsView, setDetailsView] = useState<DetailsView>("members");
    const [chatBg, setChatBg] = useState("bb-chat-stage");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollAreaViewportRef = useRef<HTMLDivElement>(null);

    const groupRef = useMemo(
        () => doc(firestore, "groups", groupId),
        [groupId]
    );

    const {
        data: groupData,
        isLoading: isGroupDataLoading,
    } = useDoc<GroupRecord>(groupRef);

    const membersQuery = useMemo(
        () => collection(firestore, "groups", groupId, "members"),
        [groupId]
    );

    const {
        data: members,
        isLoading: areMembersLoading,
    } = useCollection<GroupMemberRecord>(membersQuery);

    const activeMembers = useMemo(
        () =>
            (members ?? []).filter(
                (member) => member.status !== "inactive"
            ),
        [members]
    );

    const messagesQuery = useMemo(
        () =>
            query(
                collection(
                    firestore,
                    `groups/${groupId}/messages`
                ),
                orderBy("createdAt", "asc")
            ),
        [groupId]
    );

    const {
        data: messages,
        isLoading: areMessagesLoading,
    } = useCollection<ChatMessageRecord>(messagesQuery);

    const mediaMessages = useMemo(
        () => messages?.filter((message) => message.imageUrl) ?? [],
        [messages]
    );

    useEffect(() => {
        const savedBg = localStorage.getItem(`chatBg_${groupId}`);

        if (savedBg) {
            setChatBg(savedBg);
        }
    }, [groupId]);

    useEffect(() => {
        if (!scrollAreaViewportRef.current) {
            return;
        }

        scrollAreaViewportRef.current.scrollTo({
            top: scrollAreaViewportRef.current.scrollHeight,
            behavior: "smooth",
        });
    }, [messages]);

    const handleSetChatBg = (bgClass: string) => {
        setChatBg(bgClass);
        localStorage.setItem(`chatBg_${groupId}`, bgClass);
    };

    const openDetails = (view: DetailsView) => {
        setDetailsView(view);
        setIsDetailsDialogOpen(true);
    };

    const handleFileChange = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        try {
            const imageCompression = (
                await import("browser-image-compression")
            ).default;

            const compressedFile = await imageCompression(file, {
                maxSizeMB: 1,
                maxWidthOrHeight: 1024,
            });

            setImageFile(compressedFile as File);
            setImagePreview(URL.createObjectURL(compressedFile));
        } catch (error) {
            console.error("Error compressing image:", error);
            toast({
                variant: "destructive",
                title: "Error compressing image.",
            });
        }
    };

    const clearImageSelection = () => {
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }

        setImageFile(null);
        setImagePreview(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSendMessage = async () => {
        if (!currentUser) {
            return;
        }

        if (!newMessage.trim() && !imageFile) {
            return;
        }

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
                        description:
                            "Please configure Cloudinary in your project settings.",
                    });
                }
            }

            await addDoc(
                collection(
                    firestore,
                    `groups/${groupId}/messages`
                ),
                {
                    text: newMessage.trim(),
                    imageUrl,
                    createdAt: serverTimestamp(),
                    userId: currentUser.uid,
                    userName:
                        currentUser.displayName ||
                        currentUser.email?.split("@")[0],
                    userPhotoURL: currentUser.photoURL,
                    groupId,
                }
            );

            setNewMessage("");
            clearImageSelection();
        } catch (error) {
            console.error("Error sending message:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description:
                    "Failed to send message. Please try again.",
            });
        } finally {
            setIsSending(false);
        }
    };

    const isLoading =
        areMessagesLoading || isGroupDataLoading;

    const groupName =
        groupData?.groupName || "Group Chat";

    return (
        <Card className="bb-chat-shell flex h-full w-full flex-col rounded-none border-0 bg-transparent shadow-none">
            <Dialog
                open={isDetailsDialogOpen}
                onOpenChange={setIsDetailsDialogOpen}
            >
                <CardHeader className="bb-chat-header z-10 grid min-h-[96px] grid-cols-[44px_1fr_44px] items-center gap-2 border-0 px-3 pb-4 pt-4">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="h-10 w-10 rounded-full text-white/90 hover:bg-white/[0.08] hover:text-white"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="h-5 w-5" strokeWidth={1.9} />
                    </Button>

                    <button
                        type="button"
                        onClick={() => openDetails("members")}
                        className="min-w-0 rounded-xl px-2 py-1.5 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#74d8c8]/70"
                        aria-label={`Open group details for ${groupName}`}
                    >
                        {isGroupDataLoading ? (
                            <Skeleton className="mx-auto h-5 w-32 bg-white/10" />
                        ) : (
                            <>
                                <span className="block truncate text-[16px] font-semibold tracking-[-0.025em] text-[#f6f8f7]">
                                    {groupName}
                                </span>

                                <span className="mt-0.5 flex items-center justify-center gap-1.5 text-[10px] font-medium text-[#e2c777]">
                                    <Users className="h-3 w-3" />
                                    {areMembersLoading
                                        ? "Loading members…"
                                        : `${activeMembers.length} ${
                                              activeMembers.length === 1
                                                  ? "member"
                                                  : "members"
                                          }`}
                                </span>
                            </>
                        )}
                    </button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-full text-white/90 hover:bg-white/[0.08] hover:text-white"
                            >
                                <MoreVertical className="h-5 w-5" />
                                <span className="sr-only">Chat options</span>
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            align="end"
                            className="rounded-xl border-white/10 bg-[#10241c] text-white"
                        >
                            <DropdownMenuItem
                                onSelect={() => openDetails("members")}
                                className="focus:bg-white/[0.07]"
                            >
                                <Users className="mr-2 h-4 w-4 text-[#74d8c8]" />
                                <span>View Members</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onSelect={() => openDetails("media")}
                                className="focus:bg-white/[0.07]"
                            >
                                <Grid className="mr-2 h-4 w-4 text-[#74d8c8]" />
                                <span>View Media</span>
                            </DropdownMenuItem>

                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="focus:bg-white/[0.07]">
                                    <Brush className="mr-2 h-4 w-4 text-[#74d8c8]" />
                                    <span>Change Background</span>
                                </DropdownMenuSubTrigger>

                                <DropdownMenuPortal>
                                    <DropdownMenuSubContent className="rounded-xl border-white/10 bg-[#10241c] text-white">
                                        {backgroundOptions.map((background) => (
                                            <DropdownMenuItem
                                                key={background.name}
                                                onClick={() =>
                                                    handleSetChatBg(background.class)
                                                }
                                                className="focus:bg-white/[0.07]"
                                            >
                                                {background.name}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>

                <DialogContent className="flex h-[88dvh] max-w-4xl flex-col overflow-hidden border-white/10 bg-[#10241c] text-white">
                    <DialogHeader>
                        <DialogTitle className="font-semibold">
                            {groupName}
                        </DialogTitle>
                        <DialogDescription className="text-[#9fb0a8]">
                            View group members and shared media.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/[0.07] bg-[#0b1813]/70 p-1.5">
                        <button
                            type="button"
                            onClick={() => setDetailsView("members")}
                            className={cn(
                                "min-h-10 rounded-xl px-3 text-xs font-semibold transition-colors",
                                detailsView === "members"
                                    ? "bg-[#1d473b] text-white"
                                    : "text-[#9fb0a8] hover:bg-white/[0.05]"
                            )}
                        >
                            Members ({activeMembers.length})
                        </button>

                        <button
                            type="button"
                            onClick={() => setDetailsView("media")}
                            className={cn(
                                "min-h-10 rounded-xl px-3 text-xs font-semibold transition-colors",
                                detailsView === "media"
                                    ? "bg-[#1d473b] text-white"
                                    : "text-[#9fb0a8] hover:bg-white/[0.05]"
                            )}
                        >
                            Media ({mediaMessages.length})
                        </button>
                    </div>

                    <ScrollArea className="min-h-0 flex-1">
                        {detailsView === "members" ? (
                            <div className="space-y-2 p-1">
                                {areMembersLoading ? (
                                    Array.from({ length: 4 }).map((_, index) => (
                                        <Skeleton
                                            key={index}
                                            className="h-[66px] rounded-2xl bg-white/[0.06]"
                                        />
                                    ))
                                ) : activeMembers.length > 0 ? (
                                    activeMembers.map((member) => (
                                        <MemberListItem
                                            key={member.id}
                                            member={member}
                                        />
                                    ))
                                ) : (
                                    <div className="py-16 text-center text-[#9fb0a8]">
                                        <Users className="mx-auto mb-3 h-9 w-9 text-[#74d8c8]/55" />
                                        No active members found.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 p-1 sm:grid-cols-3 md:grid-cols-4">
                                {mediaMessages.map((message) => (
                                    <a
                                        key={message.id}
                                        href={message.imageUrl || undefined}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b1511]"
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={message.imageUrl || ""}
                                            alt="Chat media"
                                            className="aspect-square w-full object-cover transition-transform duration-200 hover:scale-[1.03]"
                                        />
                                    </a>
                                ))}

                                {mediaMessages.length === 0 && (
                                    <div className="col-span-full py-16 text-center text-[#9fb0a8]">
                                        <Images className="mx-auto mb-3 h-9 w-9 text-[#74d8c8]/55" />
                                        No media has been shared yet.
                                    </div>
                                )}
                            </div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            <ScrollArea
                className={cn("min-h-0 flex-grow", chatBg)}
                viewportRef={scrollAreaViewportRef}
            >
                <div className="space-y-2.5 px-3 py-5 sm:px-5">
                    {isLoading ? (
                        <ChatSkeleton />
                    ) : messages && messages.length > 0 ? (
                        messages.map((message, index) => {
                            const previousMessage =
                                index > 0 ? messages[index - 1] : null;
                            const nextMessage =
                                index < messages.length - 1
                                    ? messages[index + 1]
                                    : null;

                            return (
                                <ChatMessage
                                    key={message.id}
                                    message={message}
                                    currentUserId={currentUser?.uid ?? ""}
                                    showName={
                                        previousMessage?.userId !== message.userId
                                    }
                                    showAvatar={
                                        nextMessage?.userId !== message.userId
                                    }
                                />
                            );
                        })
                    ) : (
                        <div className="flex min-h-[55vh] items-center justify-center text-[#8fa198]">
                            <div className="text-center">
                                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#74d8c8]/12 bg-[#74d8c8]/[0.06]">
                                    <MessageSquare className="h-6 w-6 text-[#74d8c8]/70" />
                                </span>
                                <p className="mt-4 text-[14px] font-medium text-[#dce7e1]">
                                    No messages yet
                                </p>
                                <p className="mt-1 text-[12px]">
                                    Start the conversation.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <CardFooter className="border-0 bg-[#09130f] p-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-3">
                <div className="flex w-full flex-col gap-2">
                    {imagePreview && (
                        <div className="relative ml-1 h-24 w-24 overflow-visible">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="h-full w-full rounded-2xl border border-[#74d8c8]/18 object-cover shadow-lg"
                            />

                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -right-2 -top-2 h-7 w-7 rounded-full shadow-md"
                                onClick={clearImageSelection}
                                aria-label="Remove selected image"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    <div className="bb-chat-composer flex items-center gap-1.5 rounded-[22px] p-1.5">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(event) => void handleFileChange(event)}
                        />

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 shrink-0 rounded-full text-[#9fded3] hover:bg-white/[0.06] hover:text-[#b9f0e7]"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isSending}
                            aria-label="Attach image"
                        >
                            <ImageIcon className="h-5 w-5" strokeWidth={1.8} />
                        </Button>

                        <Input
                            type="text"
                            placeholder="Type a message…"
                            className="h-10 min-h-10 flex-1 border-0 bg-transparent px-1 text-[13px] text-[#edf5f1] shadow-none placeholder:text-[#82958c] focus-visible:ring-0"
                            value={newMessage}
                            onChange={(event) => setNewMessage(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" && !isSending) {
                                    void handleSendMessage();
                                }
                            }}
                            disabled={isSending}
                        />

                        <Button
                            type="button"
                            onClick={() => void handleSendMessage()}
                            disabled={
                                isSending ||
                                (!newMessage.trim() && !imageFile)
                            }
                            size="icon"
                            className="h-10 w-10 shrink-0 rounded-full border-0 bg-gradient-to-br from-[#2dd4bf] to-[#60a5fa] text-[#07130f] shadow-[0_7px_18px_rgba(45,212,191,0.2)] hover:opacity-95 disabled:opacity-40"
                            aria-label="Send message"
                        >
                            {isSending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}
