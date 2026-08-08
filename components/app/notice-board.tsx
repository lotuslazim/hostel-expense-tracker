"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import {
  collection,
  deleteDoc,
  doc,
  limit,
  orderBy,
  query,
  type Timestamp,
} from "firebase/firestore";
import {
  ClipboardList,
  Loader2,
  Pin,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection, useDoc, useUser } from "@/firebase";
import { firestore } from "@/firebase/config";
import { useToast } from "@/hooks/use-toast";

type NoticeRecord = {
  id: string;
  messageText?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt?: Timestamp | null;
};

type UserProfileRecord = {
  groupId?: string | null;
  isAdmin?: boolean;
};

export function NoticeBoard() {
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const [deletingNoticeId, setDeletingNoticeId] =
    useState<string | null>(null);

  const currentUserRef = useMemo(
    () =>
      currentUser
        ? doc(firestore, "users", currentUser.uid)
        : null,
    [currentUser]
  );

  const { data: currentUserData } =
    useDoc<UserProfileRecord>(currentUserRef);

  const groupId = currentUserData?.groupId;
  const isAdmin = currentUserData?.isAdmin ?? false;

  const noticesQuery = useMemo(() => {
    if (!groupId) {
      return null;
    }

    return query(
      collection(firestore, `groups/${groupId}/notices`),
      orderBy("createdAt", "desc"),
      limit(30)
    );
  }, [groupId]);

  const {
    data: notices,
    isLoading,
    error,
  } = useCollection<NoticeRecord>(noticesQuery);

  const handleDelete = async (noticeId: string) => {
    if (!groupId || deletingNoticeId) {
      return;
    }

    setDeletingNoticeId(noticeId);

    try {
      await deleteDoc(
        doc(firestore, `groups/${groupId}/notices`, noticeId)
      );

      toast({
        title: "Pin removed",
        description: "The information was removed from the Notice Board.",
      });
    } catch (deleteError) {
      console.error("Error deleting notice:", deleteError);
      toast({
        variant: "destructive",
        title: "Could not remove pin",
        description: "Please try again.",
      });
    } finally {
      setDeletingNoticeId(null);
    }
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
        aria-label="Notice Board unavailable"
      >
        <ClipboardList className="h-5 w-5" strokeWidth={1.9} />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full border-0 bg-transparent text-[#f6cf58] shadow-none hover:bg-white/[0.07] hover:text-[#ffe584]"
          aria-label="Open Notice Board"
        >
          <ClipboardList
            className="h-[20px] w-[20px]"
            strokeWidth={1.9}
          />
          <span className="sr-only">Open Notice Board</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border-[#f6cf58]/20 bg-[#10241c] p-0 text-white shadow-[0_18px_48px_rgba(0,0,0,0.38)]"
        align="end"
        sideOffset={10}
      >
        <div className="bg-[#f6cf58]/[0.06] px-4 py-3.5">
          <DropdownMenuLabel className="flex items-center gap-2 p-0 text-[14px] font-semibold tracking-[-0.01em]">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f6cf58]/15 text-[#f6cf58]">
              <ClipboardList className="h-4 w-4" />
            </span>
            <span>
              Notice Board
              <span className="mt-0.5 block text-[10px] font-normal text-[#aebdb5]">
                Important information for everyone
              </span>
            </span>
          </DropdownMenuLabel>
        </div>

        <DropdownMenuSeparator className="m-0 bg-white/10" />

        <div className="max-h-[min(28rem,65vh)] overflow-y-auto p-2.5">
          {error ? (
            <div className="rounded-xl border border-[#ef6f51]/20 bg-[#ef6f51]/10 p-4 text-center text-[12px] leading-5 text-[#ffc2b3]">
              The Notice Board could not be loaded.
            </div>
          ) : notices && notices.length > 0 ? (
            <div className="space-y-2">
              {notices.map((notice) => {
                const canManage =
                  isAdmin || notice.createdBy === currentUser?.uid;
                const isDeleting = deletingNoticeId === notice.id;

                return (
                  <div
                    key={notice.id}
                    className="group rounded-xl border border-white/[0.07] bg-[#0b1813]/75 p-3.5"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f6cf58]/12 text-[#f6cf58]">
                        <Pin className="h-3.5 w-3.5" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="whitespace-pre-wrap break-words text-[13px] leading-5 text-[#f1f5f3]">
                          {notice.messageText}
                        </p>

                        <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-[#91a39a]">
                          <span className="truncate">
                            {notice.createdByName || "Group member"}
                          </span>
                          <span className="shrink-0">
                            {notice.createdAt
                              ? formatDistanceToNow(
                                  notice.createdAt.toDate(),
                                  { addSuffix: true }
                                )
                              : "Just now"}
                          </span>
                        </div>
                      </div>

                      {canManage && (
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            void handleDelete(notice.id);
                          }}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#91a39a] transition-colors hover:bg-[#ef6f51]/12 hover:text-[#ff967e] disabled:cursor-wait disabled:opacity-60"
                          aria-label="Remove this pin"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-[13px] text-[#9fb0a8]">
              <ClipboardList className="mx-auto mb-2 h-8 w-8 text-[#f6cf58]/65" />
              <p className="font-medium text-[#dbe4df]">Nothing pinned yet</p>
              <p className="mt-1 text-[11px] leading-5">
                Use the Pin card on the Dashboard to add information.
              </p>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
