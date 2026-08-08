"use client";

import {
  type ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  deleteUser,
  sendPasswordResetEmail,
  type User as FirebaseUser,
  updateProfile,
} from "firebase/auth";
import {
  ChevronDown,
  Copy,
  Camera,
  Home,
  Loader2,
  LogOut,
  Mail,
  Receipt,
  Trash2,
  User,
  UserCircle,
  Users,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";
import imageCompression from "browser-image-compression";
import { useRouter } from "next/navigation";

import {
  useCollection,
  useDoc,
  useUser,
} from "@/firebase";
import {
  auth,
  firestore,
} from "@/firebase/config";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useToast } from "@/hooks/use-toast";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

type UserProfileRecord = {
  displayName?: string;
  email?: string;
  photoURL?: string;
  groupId?: string | null;
  isAdmin?: boolean;
};

type GroupRecord = {
  groupName?: string;
  invitationCode?: string;
};

type GroupMemberRecord = {
  id: string;
  status?: string;
  role?: string;

  /*
   * কিছু পুরোনো/নতুন member document-এ
   * display information থাকতে পারে।
   */
  displayName?: string;
  userName?: string;
  photoURL?: string;
  email?: string;
};

type ExpenseRecord = {
  id: string;
  expenseItem?: string;
  description?: string;
  amount?: number;
  date?: Date | Timestamp;
  receiptPhotoUrl?: string;
  userId?: string;
};

type MonthlyExpenseGroup = {
  total: number;
  items: ExpenseRecord[];
};

const toDate = (
  value:
    | Date
    | Timestamp
    | null
    | undefined
): Date | null => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (
    typeof value.toDate ===
    "function"
  ) {
    return value.toDate();
  }

  return null;
};

const formatMoney = (
  value:
    | number
    | null
    | undefined
): string => {
  const amount = Number(
    value ?? 0
  );

  if (!Number.isFinite(amount)) {
    return "0";
  }

  return Math.round(
    amount
  ).toLocaleString();
};

const getProfileInitial = (
  displayName?: string,
  email?: string
): string => {
  const source =
    displayName?.trim() ||
    email?.trim() ||
    "U";

  return source
    .charAt(0)
    .toUpperCase();
};

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-2 h-4 w-72 max-w-full" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-1/3" />
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <Skeleton className="h-24 w-24 rounded-full" />

            <div className="w-full flex-grow space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-1/2" />
          </CardHeader>

          <CardContent className="space-y-3 p-4 pt-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Separator />
            <Skeleton className="h-6 w-1/4" />

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-5 w-28" />
              </div>

              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="mt-2 h-4 w-full" />
          </CardHeader>

          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-1/4" />
        </CardHeader>

        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Separator />
          <Skeleton className="h-10 w-full" />
          <Separator />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

function Roommate({
  member,
}: {
  member: GroupMemberRecord;
}) {
  const userRef =
    useMemo(() => {
      if (!member.id) {
        return null;
      }

      return doc(
        firestore,
        "users",
        member.id
      );
    }, [member.id]);

  const {
    data: roommateUserData,
    isLoading,
  } = useDoc<UserProfileRecord>(
    userRef
  );

  const localDisplayName =
    member.displayName ||
    member.userName ||
    member.email;

  if (
    isLoading &&
    !localDisplayName
  ) {
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-5 w-28" />
      </div>
    );
  }

  const displayName =
    roommateUserData?.displayName ||
    localDisplayName ||
    `Member ${member.id.slice(
      0,
      5
    )}`;

  const photoURL =
    roommateUserData?.photoURL ||
    member.photoURL;

  const email =
    roommateUserData?.email ||
    member.email;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-transparent p-1 transition-colors hover:border-border hover:bg-muted/30">
      <Avatar className="h-9 w-9">
        {photoURL && (
          <AvatarImage
            src={photoURL}
            alt={displayName}
          />
        )}

        <AvatarFallback>
          {getProfileInitial(
            displayName,
            email
          )}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {displayName}
        </p>

        {member.role && (
          <p className="text-xs capitalize text-muted-foreground">
            {member.role}
          </p>
        )}
      </div>
    </div>
  );
}

function AccountSettings({
  user,
  userData,
  groupId,
}: {
  user: FirebaseUser;
  userData:
  | UserProfileRecord
  | null
  | undefined;
  groupId:
  | string
  | null
  | undefined;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [
    isLeavingGroup,
    setIsLeavingGroup,
  ] = useState(false);

  const [
    isDeletingAccount,
    setIsDeletingAccount,
  ] = useState(false);

  const [
    isSendingReset,
    setIsSendingReset,
  ] = useState(false);

  const handleLeaveGroup =
    async () => {
      if (
        !user ||
        !groupId ||
        isLeavingGroup
      ) {
        return;
      }

      setIsLeavingGroup(true);

      try {
        /*
         * status == active query না করে পুরো members collection
         * পড়া হচ্ছে। পুরোনো document-এ status না থাকলেও
         * সেটি active হিসেবে ধরা হবে।
         */
        if (
          userData?.isAdmin
        ) {
          const membersSnapshot =
            await getDocs(
              collection(
                firestore,
                "groups",
                groupId,
                "members"
              )
            );

          const activeAdmins =
            membersSnapshot.docs.filter(
              (
                memberDocument
              ) => {
                const memberData =
                  memberDocument.data();

                const isActive =
                  memberData.status !==
                  "inactive";

                const isAdmin =
                  memberData.role ===
                  "admin";

                return (
                  isActive &&
                  isAdmin
                );
              }
            );

          if (
            activeAdmins.length <=
            1
          ) {
            toast({
              variant:
                "destructive",

              title:
                "Action Not Allowed",

              description:
                "You are the only admin. Assign another admin before leaving the group.",
            });

            return;
          }
        }

        const batch =
          writeBatch(
            firestore
          );

        const userRef =
          doc(
            firestore,
            "users",
            user.uid
          );

        const memberRef =
          doc(
            firestore,
            "groups",
            groupId,
            "members",
            user.uid
          );

        batch.set(
          userRef,
          {
            groupId: null,
            isAdmin: false,
          },
          {
            merge: true,
          }
        );

        batch.set(
          memberRef,
          {
            status:
              "inactive",

            leftAt:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );

        await batch.commit();

        toast({
          title:
            "You have left the group.",
        });

        router.push(
          "/dashboard"
        );

        router.refresh();
      } catch (error) {
        console.error(
          "Error leaving group:",
          error
        );

        toast({
          variant:
            "destructive",

          title:
            "Error",

          description:
            "Could not leave the group.",
        });
      } finally {
        setIsLeavingGroup(
          false
        );
      }
    };

  const handlePasswordReset =
    async () => {
      if (
        !user.email ||
        isSendingReset
      ) {
        return;
      }

      setIsSendingReset(true);

      try {
        await sendPasswordResetEmail(
          auth,
          user.email
        );

        toast({
          title:
            "Password Reset Email Sent",

          description:
            "Check your inbox for instructions.",
        });
      } catch (error) {
        console.error(
          "Password reset error:",
          error
        );

        toast({
          variant:
            "destructive",

          title:
            "Error",

          description:
            "Could not send the reset email.",
        });
      } finally {
        setIsSendingReset(
          false
        );
      }
    };

  const handleDeleteAccount =
    async () => {
      if (
        !user ||
        isDeletingAccount
      ) {
        return;
      }

      setIsDeletingAccount(
        true
      );

      try {
        const userRef =
          doc(
            firestore,
            "users",
            user.uid
          );

        await deleteDoc(
          userRef
        );

        await deleteUser(
          user
        );

        toast({
          title:
            "Account Deleted",

          description:
            "Your account has been permanently deleted.",
        });

        router.push("/");
      } catch (error) {
        console.error(
          "Account deletion error:",
          error
        );

        const description =
          error instanceof Error
            ? error.message
            : "Please sign in again before deleting your account.";

        toast({
          variant:
            "destructive",

          title:
            "Deletion Failed",

          description,
        });
      } finally {
        setIsDeletingAccount(
          false
        );
      }
    };

  return (
    <Card className="overflow-hidden border-[#5eead4]/14 bg-[linear-gradient(155deg,rgba(21,55,46,0.98),rgba(13,39,35,0.98))]">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-[17px] font-semibold text-[#f4f7f5]">
          Account Actions
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <Label>
              Password Reset
            </Label>

            <p className="mt-1 text-xs text-muted-foreground">
              Receive a secure reset link by email.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void handlePasswordReset();
            }}
            disabled={
              isSendingReset
            }
            className="w-full rounded-xl border-[#5eead4]/16 bg-[#0b2520] text-[#eaf4f0] hover:bg-[#12352e] hover:text-white sm:w-auto"
          >
            {isSendingReset && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}

            Send Reset Link
          </Button>
        </div>

        <Separator />

        <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <Label className="font-medium text-[#e9a77e]">
              Leave Group
            </Label>

            <p className="mt-1 text-xs text-muted-foreground">
              You will lose access to the current group data.
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger
              asChild
            >
              <Button
                type="button"
                variant="ghost"
                disabled={
                  !groupId ||
                  isLeavingGroup
                }
                className="w-full rounded-xl border border-[#b85f36]/35 bg-[#743721] text-white hover:bg-[#874126] hover:text-white sm:w-auto"
              >
                {isLeavingGroup ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}

                Leave
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Are you sure you want to leave?
                </AlertDialogTitle>

                <AlertDialogDescription>
                  You will lose access to all group data. An admin will need to invite you again.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>
                  Cancel
                </AlertDialogCancel>

                <AlertDialogAction
                  onClick={() => {
                    void handleLeaveGroup();
                  }}
                  className="bg-[#743721] text-white hover:bg-[#874126]"
                >
                  Confirm Leave
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <Separator />

        <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <Label className="font-medium text-[#e59aa8]">
              Delete Account
            </Label>

            <p className="mt-1 text-xs text-muted-foreground">
              Permanently delete your BachelorBite account.
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger
              asChild
            >
              <Button
                type="button"
                variant="ghost"
                disabled={
                  isDeletingAccount
                }
                className="w-full rounded-xl border border-[#a94355]/40 bg-[#651f2d] text-white hover:bg-[#782638] hover:text-white sm:w-auto"
              >
                {isDeletingAccount ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}

                Delete Account
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Are you absolutely sure?
                </AlertDialogTitle>

                <AlertDialogDescription>
                  This action cannot be undone. Your account will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>
                  Cancel
                </AlertDialogCancel>

                <AlertDialogAction
                  onClick={() => {
                    void handleDeleteAccount();
                  }}
                  className="bg-[#651f2d] text-white hover:bg-[#782638]"
                >
                  Yes, Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

export function Profile() {
  const {
    user,
    isUserLoading,
  } = useUser();

  const { toast } =
    useToast();

  const router =
    useRouter();

  const [
    displayName,
    setDisplayName,
  ] = useState("");

  const [
    isEditing,
    setIsEditing,
  ] = useState(false);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    profileImageFile,
    setProfileImageFile,
  ] =
    useState<File | null>(
      null
    );

  const [
    imagePreview,
    setImagePreview,
  ] =
    useState<string | null>(
      null
    );

  const userRef =
    useMemo(() => {
      if (!user) {
        return null;
      }

      return doc(
        firestore,
        "users",
        user.uid
      );
    }, [user]);

  const {
    data: userData,
    isLoading:
    isUserDataLoading,
    error:
    userDataError,
  } =
    useDoc<UserProfileRecord>(
      userRef
    );

  const groupId =
    userData?.groupId;

  const groupRef =
    useMemo(() => {
      if (!groupId) {
        return null;
      }

      return doc(
        firestore,
        "groups",
        groupId
      );
    }, [groupId]);

  const {
    data: groupData,
    isLoading:
    isGroupDataLoading,
    error:
    groupDataError,
  } = useDoc<GroupRecord>(
    groupRef
  );

  /*
   * গুরুত্বপূর্ণ:
   * status == active query করা হচ্ছে না।
   * পুরোনো member document-এ status field না থাকলেও
   * member যেন হারিয়ে না যায়।
   */
  const membersQuery =
    useMemo(() => {
      if (!groupId) {
        return null;
      }

      return collection(
        firestore,
        "groups",
        groupId,
        "members"
      );
    }, [groupId]);

  const {
    data: members,
    isLoading:
    areMembersLoading,
    error:
    membersError,
  } =
    useCollection<GroupMemberRecord>(
      membersQuery
    );

  const expensesQuery =
    useMemo(() => {
      if (
        !user ||
        !groupId
      ) {
        return null;
      }

      return query(
        collection(
          firestore,
          "groups",
          groupId,
          "expenses"
        ),
        where(
          "userId",
          "==",
          user.uid
        )
      );
    }, [
      user,
      groupId,
    ]);

  const {
    data: expenses,
    isLoading:
    areExpensesLoading,
    error:
    expensesError,
  } =
    useCollection<ExpenseRecord>(
      expensesQuery
    );

  const activeMembers =
    useMemo(() => {
      return (
        members ?? []
      ).filter(
        (member) =>
          member.status !==
          "inactive"
      );
    }, [members]);

  const roommates =
    useMemo(() => {
      return activeMembers.filter(
        (member) =>
          member.id !==
          user?.uid
      );
    }, [
      activeMembers,
      user?.uid,
    ]);

  const currentMembership =
    useMemo(() => {
      return activeMembers.find(
        (member) =>
          member.id ===
          user?.uid
      );
    }, [
      activeMembers,
      user?.uid,
    ]);

  const userRole =
    userData?.isAdmin ||
      currentMembership?.role ===
      "admin"
      ? "Admin"
      : "Member";

  const monthlyExpenses =
    useMemo(() => {
      const sortedExpenses = [
        ...(expenses ?? []),
      ].sort(
        (
          firstExpense,
          secondExpense
        ) => {
          const firstDate =
            toDate(
              firstExpense.date
            );

          const secondDate =
            toDate(
              secondExpense.date
            );

          return (
            (secondDate?.getTime() ??
              0) -
            (firstDate?.getTime() ??
              0)
          );
        }
      );

      return sortedExpenses.reduce<
        Record<
          string,
          MonthlyExpenseGroup
        >
      >(
        (
          groupedExpenses,
          expense
        ) => {
          const expenseDate =
            toDate(
              expense.date
            );

          const month =
            expenseDate
              ? format(
                expenseDate,
                "MMMM yyyy"
              )
              : "Date Unavailable";

          if (
            !groupedExpenses[
            month
            ]
          ) {
            groupedExpenses[
              month
            ] = {
              total: 0,
              items: [],
            };
          }

          const amount =
            Number(
              expense.amount ??
              0
            );

          if (
            Number.isFinite(
              amount
            )
          ) {
            groupedExpenses[
              month
            ].total +=
              amount;
          }

          groupedExpenses[
            month
          ].items.push(
            expense
          );

          return groupedExpenses;
        },
        {}
      );
    }, [expenses]);

  useEffect(() => {
    if (!userData) {
      return;
    }

    setDisplayName(
      userData.displayName ||
      user?.displayName ||
      ""
    );

    setIsEditing(
      false
    );
  }, [
    userData,
    user,
  ]);

  useEffect(() => {
    return () => {
      if (
        imagePreview
      ) {
        URL.revokeObjectURL(
          imagePreview
        );
      }
    };
  }, [imagePreview]);

  const handleImageChange =
    async (
      event:
        ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        event.target
          .files?.[0];

      if (!file) {
        return;
      }

      try {
        const compressedFile =
          await imageCompression(
            file,
            {
              maxSizeMB: 1,
              maxWidthOrHeight:
                1024,
            }
          );

        if (
          imagePreview
        ) {
          URL.revokeObjectURL(
            imagePreview
          );
        }

        setProfileImageFile(
          compressedFile
        );

        setImagePreview(
          URL.createObjectURL(
            compressedFile
          )
        );

        setIsEditing(
          true
        );
      } catch (error) {
        console.error(
          "Image compression error:",
          error
        );

        toast({
          variant:
            "destructive",

          title:
            "Error compressing image.",
        });
      }
    };

  const handleCancelEditing =
    () => {
      if (
        imagePreview
      ) {
        URL.revokeObjectURL(
          imagePreview
        );
      }

      setDisplayName(
        userData?.displayName ||
        user?.displayName ||
        ""
      );

      setProfileImageFile(
        null
      );

      setImagePreview(
        null
      );

      setIsEditing(
        false
      );
    };

  const handleSaveChanges =
    async () => {
      if (
        !userRef ||
        !user ||
        isSaving
      ) {
        return;
      }

      const cleanedDisplayName =
        displayName.trim();

      if (
        !cleanedDisplayName
      ) {
        toast({
          variant:
            "destructive",

          title:
            "Name Required",

          description:
            "Please enter your name.",
        });

        return;
      }

      setIsSaving(
        true
      );

      try {
        let photoURL =
          userData?.photoURL ||
          user.photoURL ||
          null;

        if (
          profileImageFile
        ) {
          photoURL =
            await uploadToCloudinary(
              profileImageFile,

              process.env
                .NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,

              process.env
                .NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
            );
        }

        /*
         * setDoc merge ব্যবহার করা হয়েছে।
         * User document missing হলেও profile save হবে।
         */
        await setDoc(
          userRef,
          {
            displayName:
              cleanedDisplayName,

            photoURL,
          },
          {
            merge: true,
          }
        );

        await updateProfile(
          user,
          {
            displayName:
              cleanedDisplayName,

            photoURL,
          }
        );

        toast({
          title:
            "Profile Updated",

          description:
            "Your changes have been saved.",
        });

        if (
          imagePreview
        ) {
          URL.revokeObjectURL(
            imagePreview
          );
        }

        setProfileImageFile(
          null
        );

        setImagePreview(
          null
        );

        setIsEditing(
          false
        );

        router.refresh();
      } catch (error) {
        console.error(
          "Error updating profile:",
          error
        );

        toast({
          variant:
            "destructive",

          title:
            "Error",

          description:
            "Could not save your profile changes.",
        });
      } finally {
        setIsSaving(
          false
        );
      }
    };

  const handleCopyInviteCode =
    async () => {
      const invitationCode =
        groupData?.invitationCode;

      if (
        !invitationCode
      ) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          invitationCode
        );

        toast({
          title:
            "Copied!",

          description:
            "Invite code copied to clipboard.",
        });
      } catch (error) {
        console.error(
          "Clipboard error:",
          error
        );

        toast({
          variant:
            "destructive",

          title:
            "Copy Failed",

          description:
            "Could not copy the invite code.",
        });
      }
    };

  const isLoading =
    isUserLoading ||
    isUserDataLoading ||
    Boolean(
      groupId &&
      (isGroupDataLoading ||
        areMembersLoading ||
        areExpensesLoading)
    );

  if (isLoading) {
    return (
      <ProfileSkeleton />
    );
  }

  if (!user) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent className="py-12 text-center">
          <UserCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />

          <h2 className="text-lg font-semibold">
            Login Required
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Please log in to view your profile.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (userDataError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>
          Profile could not be loaded
        </AlertTitle>

        <AlertDescription>
          Please refresh the page and check your Firestore permissions.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="flex items-center gap-3 font-headline text-2xl font-bold tracking-tight text-header-yellow md:text-3xl">
          <UserCircle className="h-8 w-8" />
          My Profile
        </h1>

        <p className="text-sm text-muted-foreground md:text-base">
          View and edit your personal and group information.
        </p>
      </div>

      <Card className="overflow-hidden border-[#d9bd68]/16 bg-[linear-gradient(145deg,rgba(18,52,43,0.98),rgba(12,38,36,0.98))]">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-4">
            <div className="group relative shrink-0">
              <Avatar className="h-20 w-20 border-2 border-[#f4d35e] bg-[#10291f] sm:h-24 sm:w-24">
                {(imagePreview ||
                  userData?.photoURL ||
                  user.photoURL) && (
                    <AvatarImage
                      src={
                        imagePreview ||
                        userData?.photoURL ||
                        user.photoURL ||
                        undefined
                      }
                      alt={displayName || "Profile"}
                    />
                  )}

                <AvatarFallback className="bg-[#173a30] text-xl font-semibold text-[#f5efe0]">
                  {getProfileInitial(
                    displayName,
                    user.email || undefined
                  )}
                </AvatarFallback>
              </Avatar>

              <label
                htmlFor="profile-photo-upload"
                className="absolute inset-0 cursor-pointer rounded-full"
              >
                <span className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-[#10291f] bg-[#f4d35e] p-1.5 text-[#102019]">
                  <Camera className="h-3.5 w-3.5" />
                </span>

                <span className="sr-only">Change profile photo</span>

                <input
                  id="profile-photo-upload"
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  onChange={(event) => {
                    void handleImageChange(event);
                  }}
                  disabled={isSaving}
                />
              </label>
            </div>

            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-[19px] font-semibold tracking-[-0.025em] text-[#f5efe0]">
                    {displayName || "BachelorBite member"}
                  </h2>

                  <p className="mt-1 truncate text-[12px] text-[#c6bca4]">
                    {user.email || "Email unavailable"}
                  </p>
                </div>

                <Badge className="border border-[#f4d35e]/24 bg-[#f4d35e]/10 text-[10px] font-medium text-[#f3d77c] hover:bg-[#f4d35e]/10">
                  {userRole}
                </Badge>
              </div>

              <p className="mt-3 max-w-md text-[12px] leading-5 text-[#aeb8b0]">
                Manage your identity, group details, and account preferences.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 rounded-2xl border border-white/[0.07] bg-[#091d18]/72 p-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="displayName"
                className="flex items-center gap-2 text-[11px] font-medium text-[#e4c979]"
              >
                <User className="h-3.5 w-3.5 text-[#74d8c8]" />
                Display name
              </label>

              <Input
                id="displayName"
                value={displayName}
                onChange={(event) => {
                  setDisplayName(event.target.value);
                  setIsEditing(true);
                }}
                className="border-white/[0.08] bg-[#0c2821] text-[#f4efe4]"
                placeholder="Your Name"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="flex items-center gap-2 text-[11px] font-medium text-[#c6bca4]"
              >
                <Mail className="h-3.5 w-3.5 text-[#74d8c8]" />
                Email address
              </label>

              <Input
                id="email"
                value={user.email || ""}
                readOnly
                className="cursor-not-allowed border-white/[0.06] bg-[#0a211b]/72 text-[#cfc7b5]"
                placeholder="your@email.com"
              />
            </div>
          </div>

          {isEditing && (
            <div className="mt-4 flex flex-col justify-end gap-2 border-t border-white/[0.07] pt-4 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEditing}
                disabled={isSaving}
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={() => {
                  void handleSaveChanges();
                }}
                disabled={isSaving}
              >
                {isSaving && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border-[#74d8c8]/14 bg-[linear-gradient(145deg,rgba(18,50,42,0.96),rgba(12,36,34,0.96))]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-[#f3eee2] md:text-lg">
              <Home className="text-[#74d8c8]" />
              Group Details
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 text-sm">
            {groupData ? (
              <>
                <div>
                  <p className="font-medium text-[#c7bca4]">
                    Hostel Name
                  </p>

                  <p className="text-lg font-semibold text-[#f1d57d]">
                    {groupData.groupName ||
                      "Unnamed Group"}
                  </p>
                </div>

                {groupData.invitationCode && (
                  <div>
                    <p className="font-medium text-[#c7bca4]">
                      Invite Code
                    </p>

                    <div className="mt-1 flex items-center gap-2">
                      <code className="rounded-md bg-muted px-3 py-2 font-mono text-sm">
                        {groupData.invitationCode}
                      </code>

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          void handleCopyInviteCode();
                        }}
                      >
                        <Copy className="h-4 w-4" />

                        <span className="sr-only">
                          Copy invite code
                        </span>
                      </Button>
                    </div>
                  </div>
                )}

                <Separator />

                <div>
                  <p className="mb-2 flex items-center gap-2 font-medium text-[#c7bca4]">
                    <Users />
                    Roommates
                  </p>

                  <div className="space-y-3">
                    {membersError ? (
                      <Alert variant="destructive">
                        <AlertTitle>
                          Roommates could not be loaded
                        </AlertTitle>

                        <AlertDescription>
                          Please refresh the page and check your group permissions.
                        </AlertDescription>
                      </Alert>
                    ) : roommates.length >
                      0 ? (
                      roommates.map(
                        (member) => (
                          <Roommate
                            key={
                              member.id
                            }
                            member={
                              member
                            }
                          />
                        )
                      )
                    ) : (
                      <p className="text-[#b6b1a3]">
                        You have no roommates in this group yet.
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : groupDataError ? (
              <Alert variant="destructive">
                <AlertTitle>
                  Group details could not be loaded
                </AlertTitle>

                <AlertDescription>
                  Please refresh the page.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="py-6 text-center">
                <p className="text-[#b6b1a3]">
                  You are not part of any group.
                </p>

                <Button
                  type="button"
                  variant="link"
                  className="mt-2"
                  onClick={() => {
                    router.push(
                      "/admin"
                    );
                  }}
                >
                  Create or Join a Group
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#d9bd68]/14 bg-[linear-gradient(145deg,rgba(18,50,42,0.96),rgba(12,36,34,0.96))]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-[#f3eee2] md:text-lg">
              <Wallet className="text-[#e4c979]" />
              Expense History
            </CardTitle>

            <CardDescription>
              Your personal expense contributions.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {expensesError ? (
              <Alert variant="destructive">
                <AlertTitle>
                  Expense history could not be loaded
                </AlertTitle>

                <AlertDescription>
                  Please refresh the page and try again.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {Object.keys(
                  monthlyExpenses
                ).length > 0 ? (
                  Object.entries(
                    monthlyExpenses
                  ).map(
                    ([
                      month,
                      data,
                    ]) => (
                      <Collapsible
                        key={
                          month
                        }
                      >
                        <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50">
                          <span className="font-semibold text-[#f1ece0]">
                            {month}
                          </span>

                          <div className="flex items-center gap-2">
                            <span className="text-[#b6b1a3]">
                              ৳
                              {formatMoney(
                                data.total
                              )}
                            </span>

                            <ChevronDown className="h-5 w-5 transition-transform group-data-[state=open]:rotate-180" />
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent className="px-3 pb-3">
                          <div className="mt-2 space-y-2 border-t pt-2">
                            {data.items.map(
                              (
                                item
                              ) => {
                                const itemDate =
                                  toDate(
                                    item.date
                                  );

                                return (
                                  <div
                                    key={
                                      item.id
                                    }
                                    className="flex items-center justify-between gap-3 text-sm"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate">
                                        {item.expenseItem ||
                                          item.description ||
                                          "Expense"}
                                      </p>

                                      <p className="text-xs text-muted-foreground">
                                        {itemDate
                                          ? format(
                                            itemDate,
                                            "do MMM, yyyy"
                                          )
                                          : "Date unavailable"}
                                      </p>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-2">
                                      {item.receiptPhotoUrl && (
                                        <Dialog>
                                          <DialogTrigger
                                            asChild
                                          >
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7"
                                            >
                                              <Receipt className="h-4 w-4" />

                                              <span className="sr-only">
                                                View receipt
                                              </span>
                                            </Button>
                                          </DialogTrigger>

                                          <DialogContent className="max-h-[85vh] overflow-y-auto">
                                            <DialogHeader>
                                              <DialogTitle>
                                                Receipt for{" "}
                                                {item.expenseItem ||
                                                  item.description ||
                                                  "Expense"}
                                              </DialogTitle>
                                            </DialogHeader>

                                            <div className="py-4">
                                              {/* eslint-disable-next-line @next/next/no-img-element */}
                                              <img
                                                src={
                                                  item.receiptPhotoUrl
                                                }
                                                alt="Receipt"
                                                className="h-auto w-full rounded-md"
                                              />
                                            </div>
                                          </DialogContent>
                                        </Dialog>
                                      )}

                                      <p className="w-20 text-right font-semibold text-[#f2d16f]">
                                        ৳
                                        {formatMoney(
                                          item.amount
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )
                  )
                ) : (
                  <p className="py-6 text-center text-muted-foreground">
                    No expenses logged yet.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AccountSettings
        user={user}
        userData={
          userData
        }
        groupId={
          groupId
        }
      />
    </div>
  );
}