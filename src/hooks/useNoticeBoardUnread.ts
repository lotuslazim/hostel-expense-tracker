"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  type Timestamp,
} from "firebase/firestore";

import { firestore } from "@/firebase/config";

type NoticeRecord = {
  createdAt?: Timestamp | null;
  isPinned?: boolean;
  senderId?: string;
};

const NOTICE_BOARD_READ_EVENT = "bachelorbite:notice-board-read";

function storageKey(groupId: string, userId: string) {
  return `bachelorbite:notice-board:last-seen:${groupId}:${userId}`;
}

function getStoredLastSeen(groupId: string, userId: string) {
  const key = storageKey(groupId, userId);
  const storedValue = window.localStorage.getItem(key);
  const parsedValue = storedValue ? Number(storedValue) : Number.NaN;

  if (Number.isFinite(parsedValue)) {
    return parsedValue;
  }

  const initialValue = Date.now();
  window.localStorage.setItem(key, String(initialValue));
  return initialValue;
}

export function markNoticeBoardRead(groupId: string, userId: string) {
  if (typeof window === "undefined") {
    return;
  }

  const readAt = Date.now();
  const key = storageKey(groupId, userId);

  window.localStorage.setItem(key, String(readAt));
  window.dispatchEvent(
    new CustomEvent(NOTICE_BOARD_READ_EVENT, {
      detail: { key, readAt },
    })
  );
}

export function useNoticeBoardUnread(
  groupId?: string | null,
  userId?: string | null,
  isViewingNoticeBoard = false
) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!groupId || !userId) {
      setUnreadCount(0);
      return;
    }

    const key = storageKey(groupId, userId);
    let lastSeenAt = getStoredLastSeen(groupId, userId);

    const handleReadEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ key: string; readAt: number }>).detail;

      if (detail?.key !== key) {
        return;
      }

      lastSeenAt = detail.readAt;
      setUnreadCount(0);
    };

    window.addEventListener(NOTICE_BOARD_READ_EVENT, handleReadEvent);

    if (isViewingNoticeBoard) {
      markNoticeBoardRead(groupId, userId);
      lastSeenAt = getStoredLastSeen(groupId, userId);
    }

    const noticesRef = collection(
      firestore,
      "groups",
      groupId,
      "reminders"
    );

    const unsubscribe = onSnapshot(
      noticesRef,
      (snapshot) => {
        if (isViewingNoticeBoard) {
          markNoticeBoardRead(groupId, userId);
          lastSeenAt = getStoredLastSeen(groupId, userId);
          setUnreadCount(0);
          return;
        }

        const nextUnreadCount = snapshot.docs.reduce((count, noticeDocument) => {
          const notice = noticeDocument.data() as NoticeRecord;
          const createdAt = notice.createdAt?.toMillis?.() ?? 0;

          if (
            notice.isPinned !== false &&
            notice.senderId !== userId &&
            createdAt > lastSeenAt
          ) {
            return count + 1;
          }

          return count;
        }, 0);

        setUnreadCount(nextUnreadCount);
      },
      (error) => {
        console.error("Failed to load Notice Board alerts:", error);
        setUnreadCount(0);
      }
    );

    return () => {
      unsubscribe();
      window.removeEventListener(NOTICE_BOARD_READ_EVENT, handleReadEvent);
    };
  }, [groupId, isViewingNoticeBoard, userId]);

  return { unreadCount };
}
