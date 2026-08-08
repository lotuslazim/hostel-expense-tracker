"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  collection,
  deleteDoc,
  doc,
  orderBy,
  query,
  serverTimestamp,
  type Timestamp,
  updateDoc,
} from "firebase/firestore";
import {
  ClipboardList,
  Copy,
  Loader2,
  Pencil,
  Pin,
  PinOff,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { AppHeader } from "@/components/app/header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useCollection,
  useDoc,
  useUser,
} from "@/firebase";
import { firestore } from "@/firebase/config";
import { markNoticeBoardRead } from "@/hooks/useNoticeBoardUnread";
import { useToast } from "@/hooks/use-toast";

type UserProfileRecord = {
  groupId?: string | null;
};

type GroupRecord = {
  adminId?: string;
  noticeBoardMemberAccess?: boolean;
};

type PinnedMessage = {
  id: string;
  messageText: string;
  senderId: string;
  senderName?: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  isPinned?: boolean;
};

type PendingAction = "edit" | "unpin" | "delete";

function formatPinnedDate(value?: Timestamp | null) {
  if (!value) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value.toDate());
}

function NoticeBoardSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-56 rounded-2xl" />
      ))}
    </div>
  );
}

export default function NoticeBoardPage() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [pendingAction, setPendingAction] = useState<{
    messageId: string;
    action: PendingAction;
  } | null>(null);

  const currentUserRef = useMemo(
    () => (user ? doc(firestore, "users", user.uid) : null),
    [user]
  );

  const {
    data: currentUserData,
    isLoading: isUserDataLoading,
  } = useDoc<UserProfileRecord>(currentUserRef);

  const groupId = currentUserData?.groupId;
  const groupRef = useMemo(
    () => (groupId ? doc(firestore, "groups", groupId) : null),
    [groupId]
  );
  const {
    data: groupData,
    isLoading: isGroupDataLoading,
  } = useDoc<GroupRecord>(groupRef);

  // Firestore authorizes Notice Board admins from groups/{groupId}.adminId.
  // Keep the UI on that same source of truth so it never offers an action
  // that the security rules will reject.
  const isAdmin = Boolean(user && groupData?.adminId === user.uid);
  const memberAccessEnabled =
    groupData?.noticeBoardMemberAccess === true;

  const pinnedMessagesQuery = useMemo(() => {
    if (!groupId) {
      return null;
    }

    return query(
      collection(firestore, "groups", groupId, "reminders"),
      orderBy("createdAt", "desc")
    );
  }, [groupId]);

  const {
    data: pinnedMessages,
    isLoading: areMessagesLoading,
    error: messagesError,
  } = useCollection<PinnedMessage>(pinnedMessagesQuery);

  const visibleMessages = useMemo(
    () => (pinnedMessages ?? []).filter((message) => message.isPinned !== false),
    [pinnedMessages]
  );

  useEffect(() => {
    if (groupId && user) {
      markNoticeBoardRead(groupId, user.uid);
    }
  }, [groupId, user]);

  const isPending = (messageId: string, action: PendingAction) =>
    pendingAction?.messageId === messageId && pendingAction.action === action;

  const canManageMessage = (message: PinnedMessage) =>
    isAdmin ||
    (memberAccessEnabled && Boolean(user) && message.senderId === user?.uid);

  const handleCopy = async (messageText: string) => {
    try {
      await navigator.clipboard.writeText(messageText);
      toast({ title: "Notice copied" });
    } catch {
      toast({
        variant: "destructive",
        title: "Could not copy",
        description: "Please select and copy the notice manually.",
      });
    }
  };

  const startEditing = (message: PinnedMessage) => {
    setEditingMessageId(message.id);
    setDraftMessage(message.messageText);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setDraftMessage("");
  };

  const handleSaveEdit = async (message: PinnedMessage) => {
    const nextMessage = draftMessage.trim();

    if (!groupId || !user || !isAdmin || !nextMessage) {
      return;
    }

    setPendingAction({ messageId: message.id, action: "edit" });

    try {
      await updateDoc(
        doc(firestore, "groups", groupId, "reminders", message.id),
        {
          messageText: nextMessage,
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
        }
      );
      cancelEditing();
      toast({ title: "Notice updated" });
    } catch (error) {
      console.error("Could not edit notice:", error);
      toast({
        variant: "destructive",
        title: "Edit failed",
        description: "Only a group admin can edit this notice.",
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleUnpin = async (message: PinnedMessage) => {
    if (!groupId || !user || !canManageMessage(message)) {
      return;
    }

    setPendingAction({ messageId: message.id, action: "unpin" });

    try {
      await updateDoc(
        doc(firestore, "groups", groupId, "reminders", message.id),
        {
          isPinned: false,
          unpinnedAt: serverTimestamp(),
          unpinnedBy: user.uid,
        }
      );
      toast({ title: "Notice unpinned" });
    } catch (error) {
      console.error("Could not unpin notice:", error);
      toast({
        variant: "destructive",
        title: "Unpin failed",
        description: "You can manage only notices allowed by the admin setting.",
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleDelete = async (message: PinnedMessage) => {
    if (!groupId || !canManageMessage(message)) {
      return;
    }

    setPendingAction({ messageId: message.id, action: "delete" });

    try {
      await deleteDoc(
        doc(firestore, "groups", groupId, "reminders", message.id)
      );
      toast({ title: "Notice deleted" });
    } catch (error) {
      console.error("Could not delete notice:", error);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: "You can delete only notices allowed by the admin setting.",
      });
    } finally {
      setPendingAction(null);
    }
  };

  const isAccountLoading =
    isUserLoading || isUserDataLoading || isGroupDataLoading;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />

      <main className="container mx-auto flex-grow px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="flex items-center gap-3 font-headline text-2xl font-bold text-header-yellow md:text-3xl">
                <ClipboardList className="h-8 w-8 text-[#f6cf58]" />
                Notice Board
              </h1>
              <p className="mt-1 text-sm text-muted-foreground md:text-base">
                Important updates from your group, in one clear place.
              </p>
            </div>

            {user && groupId && !isAccountLoading && (
              <Badge
                variant="outline"
                className="w-fit gap-2 border-[#f6cf58]/25 px-3 py-1.5 text-[#f6cf58]"
              >
                <ShieldCheck className="h-4 w-4" />
                {memberAccessEnabled ? "Member posting on" : "Admin only"}
              </Badge>
            )}
          </div>

          {isAccountLoading ? (
            <NoticeBoardSkeleton />
          ) : !user ? (
            <Card>
              <CardHeader>
                <CardTitle>Sign in required</CardTitle>
                <CardDescription>
                  Sign in to open your group&apos;s Notice Board.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : !groupId ? (
            <Card>
              <CardHeader>
                <CardTitle>No group connected</CardTitle>
                <CardDescription>
                  Join or create a group before opening the Notice Board.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : messagesError ? (
            <Card className="border-destructive/40">
              <CardContent className="pt-6 text-sm text-destructive">
                Notice Board messages could not be loaded. Check your Firestore access rules and try again.
              </CardContent>
            </Card>
          ) : areMessagesLoading ? (
            <NoticeBoardSkeleton />
          ) : visibleMessages.length > 0 ? (
            <section
              className="grid items-start gap-5 sm:grid-cols-2 xl:grid-cols-3"
              aria-label="Group notices"
            >
              {visibleMessages.map((message) => {
                const canManage = canManageMessage(message);
                const isEditing = editingMessageId === message.id;

                return (
                  <Card
                    key={message.id}
                    className="group relative self-start overflow-hidden rounded-3xl border-[#f6cf58]/20 bg-gradient-to-br from-card via-card to-[#f6cf58]/[0.04] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#f6cf58]/40 hover:shadow-lg"
                  >
                    <span
                      className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full border border-[#f6cf58]/20 bg-[#f6cf58]/10 text-[#f6cf58]"
                      aria-hidden="true"
                    >
                      <Pin className="h-4 w-4 fill-current" />
                    </span>

                    <CardContent className="bb-notice-card-content flex flex-col">
                      {isEditing ? (
                        <div className="space-y-3 pr-12">
                          <Textarea
                            value={draftMessage}
                            onChange={(event) => setDraftMessage(event.target.value)}
                            maxLength={150}
                            className="min-h-24 resize-none"
                            aria-label="Edit notice"
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => void handleSaveEdit(message)}
                              disabled={
                                isPending(message.id, "edit") ||
                                draftMessage.trim().length === 0
                              }
                            >
                              {isPending(message.id, "edit") && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Save
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={cancelEditing}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap break-words pr-12 text-lg font-semibold leading-8 tracking-[-0.01em] text-foreground sm:text-xl">
                          {message.messageText}
                        </p>
                      )}

                      {!isEditing && (
                        <div className="mt-4 flex items-end justify-between gap-4 border-t border-border/60 pt-3">
                          <p
                            className="min-w-0 text-xs leading-5 text-muted-foreground"
                            title={formatPinnedDate(message.createdAt)}
                          >
                            Posted by{" "}
                            <span className="font-semibold text-foreground/80">
                              {message.senderName || "Group member"}
                            </span>
                          </p>

                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-muted-foreground"
                              onClick={() => void handleCopy(message.messageText)}
                              aria-label="Copy notice"
                              title="Copy notice"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>

                            {isAdmin && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-muted-foreground"
                                onClick={() => startEditing(message)}
                                aria-label="Edit notice"
                                title="Edit notice"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}

                            {canManage && (
                              <>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 text-muted-foreground"
                                      aria-label="Unpin notice"
                                      title="Unpin notice"
                                    >
                                      <PinOff className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Unpin this notice?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        It will disappear from the Notice Board but remain in Firestore.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => void handleUnpin(message)}
                                      >
                                        {isPending(message.id, "unpin") && (
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Unpin
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                      aria-label="Delete notice"
                                      title="Delete notice"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete this notice?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This permanently removes the notice and cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => void handleDelete(message)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        {isPending(message.id, "delete") && (
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </section>
          ) : (
            <Card className="border-dashed border-[#f6cf58]/25">
              <CardContent className="flex flex-col items-center py-12 text-center">
                <ClipboardList className="h-11 w-11 text-[#f6cf58]/70" />
                <h2 className="mt-4 text-lg font-semibold">No notices yet</h2>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  {memberAccessEnabled || isAdmin
                    ? "Post a notice from the dashboard and it will appear here automatically."
                    : "Your group admin has not posted a notice yet."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
