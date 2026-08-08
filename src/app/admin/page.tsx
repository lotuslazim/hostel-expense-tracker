"use client";

import {
    memo,
    useMemo,
    useState,
} from "react";
import { useRouter } from "next/navigation";
import type { User as FirebaseUser } from "firebase/auth";
import {
    collection,
    doc,
    getDoc,
    serverTimestamp,
    Timestamp,
    writeBatch,
} from "firebase/firestore";
import {
    Copy,
    Group,
    History,
    Loader2,
    LogIn,
    PlusCircle,
    Shield,
    Users,
} from "lucide-react";
import { format } from "date-fns";

import {
    useCollection,
    useDoc,
    useUser,
} from "@/firebase";
import { firestore } from "@/firebase/config";
import { AppHeader } from "@/components/app/header";
import { useToast } from "@/hooks/use-toast";

import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

type UserProfileRecord = {
    id?: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
    groupId?: string | null;
    isAdmin?: boolean;
};

type GroupRecord = {
    id?: string;
    groupId?: string;
    groupName?: string;
    invitationCode?: string;
    adminId?: string;
};

type GroupMemberData = {
    role?: "admin" | "member" | string;

    /*
     * পুরোনো member document-এ status field নাও থাকতে পারে।
     * Missing status-কে active হিসেবে ধরা হবে।
     */
    status?: "active" | "inactive" | string;

    joinedAt?: Timestamp;
    leftAt?: Timestamp | null;

    exitType?: "left" | "removed" | string | null;
    removedAt?: Timestamp | null;
    removedBy?: string | null;
    removedByName?: string | null;
    removalReason?: string | null;

    displayName?: string;
    userName?: string;
    email?: string;
    photoURL?: string;
};

type GroupMemberRecord =
    GroupMemberData & {
        id: string;
    };

const INVITE_CODE_LENGTH = 6;

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

const getInitial = (
    displayName?: string,
    email?: string
): string => {
    const source =
        displayName?.trim() ||
        email?.trim() ||
        "M";

    return source
        .charAt(0)
        .toUpperCase();
};

const getErrorMessage = (
    error: unknown
): string => {
    if (
        error instanceof Error &&
        error.message
    ) {
        return error.message;
    }

    return "Something went wrong. Please refresh the page and try again.";
};

const normalizeInviteCode = (
    value: string
): string => {
    return value
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");
};

const generateInviteCode =
    (): string => {
        return Math.random()
            .toString(36)
            .slice(
                2,
                2 + INVITE_CODE_LENGTH
            )
            .toUpperCase()
            .padEnd(
                INVITE_CODE_LENGTH,
                "X"
            );
    };

const createUniqueInviteCode =
    async (): Promise<string> => {
        for (
            let attempt = 0;
            attempt < 8;
            attempt += 1
        ) {
            const invitationCode =
                generateInviteCode();

            const inviteSnapshot =
                await getDoc(
                    doc(
                        firestore,
                        "groupInvites",
                        invitationCode
                    )
                );

            if (!inviteSnapshot.exists()) {
                return invitationCode;
            }
        }

        throw new Error(
            "Could not generate a unique invitation code."
        );
    };

function AdminPageSkeleton() {
    return (
        <div className="space-y-8">
            <div>
                <Skeleton className="h-9 w-48" />
                <Skeleton className="mt-2 h-4 w-72 max-w-full" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Skeleton className="h-36 rounded-lg" />
                <Skeleton className="h-36 rounded-lg" />
                <Skeleton className="h-36 rounded-lg" />
            </div>

            <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-1/3" />
                </CardHeader>

                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>
                                    <Skeleton className="h-5 w-24" />
                                </TableHead>

                                <TableHead>
                                    <Skeleton className="h-5 w-32" />
                                </TableHead>

                                <TableHead>
                                    <Skeleton className="h-5 w-16" />
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {Array.from({
                                length: 3,
                            }).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-8 w-8 rounded-full" />
                                            <Skeleton className="h-5 w-28" />
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <Skeleton className="h-5 w-40" />
                                    </TableCell>

                                    <TableCell>
                                        <Skeleton className="h-6 w-20" />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function NewUserAdminPanel({
    user,
}: {
    user: FirebaseUser;
}) {
    const router = useRouter();
    const { toast } = useToast();

    const [
        isCreating,
        setIsCreating,
    ] = useState(false);

    const [
        isJoining,
        setIsJoining,
    ] = useState(false);

    const [
        groupName,
        setGroupName,
    ] = useState("");

    const [
        inviteCode,
        setInviteCode,
    ] = useState("");

    const handleCreateGroup =
        async () => {
            const cleanedGroupName =
                groupName.trim();

            if (!cleanedGroupName) {
                toast({
                    variant: "destructive",
                    title:
                        "Group name is required.",
                });

                return;
            }

            if (isCreating) {
                return;
            }

            setIsCreating(true);

            try {
                const invitationCode =
                    await createUniqueInviteCode();

                /*
                 * addDoc ব্যবহার না করে আগে group document ID তৈরি করছি।
                 * Group, user ও member—তিনটি write একই batch-এ হবে।
                 */
                const groupRef =
                    doc(
                        collection(
                            firestore,
                            "groups"
                        )
                    );

                const groupId =
                    groupRef.id;

                const userRef =
                    doc(
                        firestore,
                        "users",
                        user.uid
                    );

                const inviteRef =
                    doc(
                        firestore,
                        "groupInvites",
                        invitationCode
                    );

                const memberRef =
                    doc(
                        firestore,
                        "groups",
                        groupId,
                        "members",
                        user.uid
                    );

                const displayName =
                    user.displayName ||
                    user.email?.split(
                        "@"
                    )[0] ||
                    "Admin";

                const batch =
                    writeBatch(
                        firestore
                    );

                batch.set(
                    groupRef,
                    {
                        id: groupId,

                        groupName:
                            cleanedGroupName,

                        invitationCode,

                        adminId:
                            user.uid,

                        createdAt:
                            serverTimestamp(),

                        settings: {
                            mealTypes: [
                                "Lunch",
                                "Dinner",
                            ],

                            isMealItemNameRequired:
                                false,

                            isExpenseDescriptionRequired:
                                false,

                            isUtilityReceiptRequired:
                                false,
                        },
                    }
                );

                batch.set(
                    inviteRef,
                    {
                        groupId,

                        groupName:
                            cleanedGroupName,

                        createdBy:
                            user.uid,

                        createdAt:
                            serverTimestamp(),
                    }
                );

                batch.set(
                    userRef,
                    {
                        id: user.uid,

                        email:
                            user.email ||
                            "",

                        displayName,

                        photoURL:
                            user.photoURL ||
                            null,

                        groupId,

                        isAdmin: true,
                    },
                    {
                        merge: true,
                    }
                );

                batch.set(
                    memberRef,
                    {
                        role:
                            "admin",

                        status:
                            "active",

                        joinedAt:
                            serverTimestamp(),

                        leftAt: null,

                        exitType: null,

                        displayName,

                        email:
                            user.email ||
                            null,

                        photoURL:
                            user.photoURL ||
                            null,
                    },
                    {
                        merge: true,
                    }
                );

                await batch.commit();

                setGroupName("");

                toast({
                    title:
                        "Group Created!",

                    description: `The group "${cleanedGroupName}" was created successfully.`,
                });

                router.refresh();
            } catch (error) {
                console.error(
                    "Error creating group:",
                    error
                );

                toast({
                    variant:
                        "destructive",

                    title:
                        "Group Could Not Be Created",

                    description:
                        getErrorMessage(
                            error
                        ),
                });
            } finally {
                setIsCreating(
                    false
                );
            }
        };

    const handleJoinGroup =
        async () => {
            const normalizedCode =
                normalizeInviteCode(
                    inviteCode
                );

            if (!normalizedCode) {
                toast({
                    variant:
                        "destructive",

                    title:
                        "Invite code is required.",
                });

                return;
            }

            if (isJoining) {
                return;
            }

            setIsJoining(true);

            try {
                const inviteSnapshot =
                    await getDoc(
                        doc(
                            firestore,
                            "groupInvites",
                            normalizedCode
                        )
                    );

                if (
                    !inviteSnapshot.exists()
                ) {
                    toast({
                        variant:
                            "destructive",

                        title:
                            "Invalid Invite Code",

                        description:
                            "No group was found with that invite code.",
                    });

                    return;
                }

                const groupData =
                    inviteSnapshot.data() as GroupRecord;

                const groupId =
                    groupData.groupId;

                if (!groupId) {
                    throw new Error(
                        "The invite code is not linked to a valid group."
                    );
                }

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

                const displayName =
                    user.displayName ||
                    user.email?.split(
                        "@"
                    )[0] ||
                    "Member";

                const batch =
                    writeBatch(
                        firestore
                    );

                batch.set(
                    userRef,
                    {
                        id: user.uid,

                        email:
                            user.email ||
                            "",

                        displayName,

                        photoURL:
                            user.photoURL ||
                            null,

                        groupId,

                        isAdmin: false,
                    },
                    {
                        merge: true,
                    }
                );

                /*
                 * getDoc দিয়ে আগের member document পড়া হচ্ছে না।
                 * set + merge নতুন ও পুরোনো—দুই ধরনের member-এর জন্য কাজ করবে।
                 */
                batch.set(
                    memberRef,
                    {
                        role:
                            "member",

                        status:
                            "active",

                        joinedAt:
                            serverTimestamp(),

                        leftAt: null,

                        exitType: null,

                        removedAt: null,

                        removedBy: null,

                        removedByName:
                            null,

                        removalReason:
                            null,

                        inviteCode:
                            normalizedCode,

                        displayName,

                        email:
                            user.email ||
                            null,

                        photoURL:
                            user.photoURL ||
                            null,
                    },
                    {
                        merge: true,
                    }
                );

                await batch.commit();

                setInviteCode("");

                toast({
                    title:
                        "Welcome to the Group!",

                    description: `You joined "${groupData.groupName ||
                        "the group"
                        }" successfully.`,
                });

                router.refresh();
            } catch (error) {
                console.error(
                    "Error joining group:",
                    error
                );

                toast({
                    variant:
                        "destructive",

                    title:
                        "Group Could Not Be Joined",

                    description:
                        getErrorMessage(
                            error
                        ),
                });
            } finally {
                setIsJoining(
                    false
                );
            }
        };

    return (
        <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center">
            <div className="mb-8 text-center">
                <Group className="mx-auto mb-4 h-12 w-12 text-primary" />

                <h1 className="font-headline text-2xl font-bold md:text-3xl">
                    Get Started with Your Group
                </h1>

                <p className="mt-2 max-w-md text-sm text-muted-foreground md:text-base">
                    Create a group or join your roommates to manage meals and shared expenses together.
                </p>
            </div>

            <Tabs
                defaultValue="create"
                className="w-full max-w-md"
            >
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="create">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Group
                    </TabsTrigger>

                    <TabsTrigger value="join">
                        <LogIn className="mr-2 h-4 w-4" />
                        Join Group
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="create">
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Create a New Group
                            </CardTitle>

                            <CardDescription>
                                Start a new hostel group and invite your roommates.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <Input
                                placeholder="Enter Hostel or Group Name"
                                value={
                                    groupName
                                }
                                onChange={(
                                    event
                                ) => {
                                    setGroupName(
                                        event.target.value
                                    );
                                }}
                                disabled={
                                    isCreating
                                }
                                maxLength={80}
                            />

                            <Button
                                type="button"
                                onClick={() => {
                                    void handleCreateGroup();
                                }}
                                className="w-full"
                                disabled={
                                    isCreating ||
                                    !groupName.trim()
                                }
                            >
                                {isCreating && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}

                                Create & Become Admin
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="join">
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Join an Existing Group
                            </CardTitle>

                            <CardDescription>
                                Enter an invitation code shared by a group administrator.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <Input
                                placeholder="Enter Invite Code"
                                value={
                                    inviteCode
                                }
                                onChange={(
                                    event
                                ) => {
                                    setInviteCode(
                                        normalizeInviteCode(
                                            event.target.value
                                        )
                                    );
                                }}
                                className="text-center font-mono uppercase tracking-widest"
                                disabled={
                                    isJoining
                                }
                                maxLength={
                                    INVITE_CODE_LENGTH
                                }
                            />

                            <Button
                                type="button"
                                onClick={() => {
                                    void handleJoinGroup();
                                }}
                                variant="secondary"
                                className="w-full"
                                disabled={
                                    isJoining ||
                                    !inviteCode.trim()
                                }
                            >
                                {isJoining && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}

                                Join Group
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

const ActiveMemberRow = memo(
    function ActiveMemberRow({
        member,
        groupOwnerId,
    }: {
        member: GroupMemberRecord;
        groupOwnerId?: string;
    }) {
        /*
         * Active member হলে users document থেকে latest profile নেওয়া হবে।
         * Permission fail করলেও member document-এর snapshot দিয়ে row থাকবে।
         */
        const userRef =
            useMemo(() => {
                return doc(
                    firestore,
                    "users",
                    member.id
                );
            }, [member.id]);

        const {
            data: userData,
            isLoading,
        } =
            useDoc<UserProfileRecord>(
                userRef
            );

        const fallbackName =
            member.displayName ||
            member.userName ||
            member.email;

        if (
            isLoading &&
            !fallbackName
        ) {
            return (
                <TableRow>
                    <TableCell>
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-9 w-9 rounded-full" />
                            <Skeleton className="h-5 w-28" />
                        </div>
                    </TableCell>

                    <TableCell>
                        <Skeleton className="h-5 w-40" />
                    </TableCell>

                    <TableCell>
                        <Skeleton className="h-6 w-20" />
                    </TableCell>
                </TableRow>
            );
        }

        const displayName =
            userData?.displayName ||
            fallbackName ||
            `Member ${member.id.slice(
                0,
                5
            )}`;

        const email =
            userData?.email ||
            member.email ||
            "Email unavailable";

        const photoURL =
            userData?.photoURL ||
            member.photoURL;

        const role =
            member.id ===
                groupOwnerId
                ? "admin"
                : member.role ||
                "member";

        return (
            <TableRow>
                <TableCell>
                    <div className="flex min-w-[160px] items-center gap-3">
                        <Avatar className="h-9 w-9">
                            {photoURL && (
                                <AvatarImage
                                    src={photoURL}
                                    alt={displayName}
                                />
                            )}

                            <AvatarFallback>
                                {getInitial(
                                    displayName,
                                    email
                                )}
                            </AvatarFallback>
                        </Avatar>

                        <span className="truncate font-medium">
                            {displayName}
                        </span>
                    </div>
                </TableCell>

                <TableCell>
                    <span className="break-all">
                        {email}
                    </span>
                </TableCell>

                <TableCell>
                    <Badge
                        variant={
                            role === "admin"
                                ? "default"
                                : "secondary"
                        }
                        className="capitalize"
                    >
                        {role}
                    </Badge>
                </TableCell>
            </TableRow>
        );
    }
);

function PastMemberRow({
    member,
}: {
    member: GroupMemberRecord;
}) {
    /*
     * Removed member-এর users document groupId=null হয়ে যাবে।
     * তাই history-তে member document-এর saved snapshot ব্যবহার করা হচ্ছে।
     */
    const displayName =
        member.displayName ||
        member.userName ||
        member.email ||
        `Member ${member.id.slice(
            0,
            5
        )}`;

    const exitDate =
        toDate(
            member.removedAt ||
            member.leftAt
        );

    const exitLabel =
        member.exitType ===
            "removed"
            ? "Removed"
            : "Left";

    return (
        <TableRow>
            <TableCell>
                <div className="flex min-w-[160px] items-center gap-3">
                    <Avatar className="h-9 w-9">
                        {member.photoURL && (
                            <AvatarImage
                                src={
                                    member.photoURL
                                }
                                alt={
                                    displayName
                                }
                            />
                        )}

                        <AvatarFallback>
                            {getInitial(
                                displayName,
                                member.email
                            )}
                        </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                        <p className="truncate font-medium">
                            {displayName}
                        </p>

                        {member.email && (
                            <p className="truncate text-xs text-muted-foreground">
                                {member.email}
                            </p>
                        )}
                    </div>
                </div>
            </TableCell>

            <TableCell>
                <Badge
                    variant={
                        member.exitType ===
                            "removed"
                            ? "destructive"
                            : "secondary"
                    }
                >
                    {exitLabel}
                </Badge>
            </TableCell>

            <TableCell className="whitespace-nowrap">
                {exitDate
                    ? format(
                        exitDate,
                        "MMM dd, yyyy"
                    )
                    : "—"}
            </TableCell>

            <TableCell>
                {member.removalReason ||
                    (exitLabel === "Left"
                        ? "Left the group"
                        : "No reason recorded")}
            </TableCell>
        </TableRow>
    );
}

function GroupDetailsPanel({
    groupId,
    currentUserId,
    userIsAdmin,
}: {
    groupId: string;
    currentUserId: string;
    userIsAdmin: boolean;
}) {
    const router = useRouter();
    const { toast } = useToast();

    const groupRef =
        useMemo(() => {
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
    } =
        useDoc<GroupRecord>(
            groupRef
        );

    const membersQuery =
        useMemo(() => {
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
        useCollection<GroupMemberData>(
            membersQuery
        );

    /*
     * গুরুত্বপূর্ণ fix:
     * শুধুমাত্র explicit inactive member বাদ যাবে।
     * status field না থাকা পুরোনো member active হিসেবে থাকবে।
     */
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

    const pastMembers =
        useMemo(() => {
            return (
                members ?? []
            )
                .filter(
                    (member) =>
                        member.status ===
                        "inactive"
                )
                .sort(
                    (
                        firstMember,
                        secondMember
                    ) => {
                        const firstExitTime =
                            toDate(
                                firstMember.removedAt ||
                                firstMember.leftAt
                            )?.getTime() ??
                            0;

                        const secondExitTime =
                            toDate(
                                secondMember.removedAt ||
                                secondMember.leftAt
                            )?.getTime() ??
                            0;

                        return (
                            secondExitTime -
                            firstExitTime
                        );
                    }
                );
        }, [members]);

    const currentMembership =
        useMemo(() => {
            return activeMembers.find(
                (member) =>
                    member.id ===
                    currentUserId
            );
        }, [
            activeMembers,
            currentUserId,
        ]);

    const isAdmin =
        userIsAdmin ||
        groupData?.adminId ===
        currentUserId ||
        currentMembership?.role ===
        "admin";

    const handleCopyInviteCode =
        async () => {
            const invitationCode =
                groupData?.invitationCode;

            if (!invitationCode) {
                return;
            }

            try {
                await navigator.clipboard.writeText(
                    invitationCode
                );

                toast({
                    title: "Copied!",
                    description:
                        "Invite code copied to clipboard.",
                });
            } catch (error) {
                console.error(
                    "Copy invite code error:",
                    error
                );

                toast({
                    variant:
                        "destructive",
                    title:
                        "Copy Failed",
                    description:
                        "Could not copy the invitation code.",
                });
            }
        };

    if (
        isGroupDataLoading ||
        areMembersLoading
    ) {
        return (
            <AdminPageSkeleton />
        );
    }

    if (
        groupDataError ||
        membersError
    ) {
        return (
            <Alert variant="destructive">
                <AlertTitle>
                    Group details could not be loaded
                </AlertTitle>

                <AlertDescription>
                    {getErrorMessage(
                        groupDataError ||
                        membersError
                    )}
                </AlertDescription>
            </Alert>
        );
    }

    if (!groupData) {
        return (
            <div className="py-16 text-center">
                <h1 className="text-2xl font-bold">
                    Group Not Found
                </h1>

                <p className="mt-2 text-muted-foreground">
                    The group details could not be loaded.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                    <h1 className="flex items-center gap-3 font-headline text-2xl font-bold text-header-yellow md:text-3xl">
                        <Users className="h-8 w-8" />
                        Group Details
                    </h1>

                    <p className="text-sm text-muted-foreground md:text-base">
                        Information about your current group.
                    </p>
                </div>

                {isAdmin && (
                    <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        onClick={() => {
                            router.push(
                                "/admin-profile"
                            );
                        }}
                    >
                        <Shield className="h-4 w-4" />
                        Manage Members
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            Group Name
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        <p className="break-words text-2xl font-semibold">
                            {groupData.groupName ||
                                "Unnamed Group"}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            Active Members
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        <p className="text-2xl font-semibold">
                            {activeMembers.length}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            Invite Code
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="flex items-center gap-2">
                        <Input
                            value={
                                groupData.invitationCode ||
                                ""
                            }
                            readOnly
                            className="font-mono uppercase tracking-widest"
                        />

                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                                void handleCopyInviteCode();
                            }}
                            disabled={
                                !groupData.invitationCode
                            }
                        >
                            <Copy className="h-4 w-4" />

                            <span className="sr-only">
                                Copy invitation code
                            </span>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>
                        Active Members
                    </CardTitle>

                    <CardDescription>
                        Members who currently have access to this group.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {activeMembers.length >
                        0 ? (
                        <div className="overflow-x-auto">
                            <Table className="min-w-[620px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>
                                            Name
                                        </TableHead>

                                        <TableHead>
                                            Email
                                        </TableHead>

                                        <TableHead>
                                            Role
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {activeMembers.map(
                                        (member) => (
                                            <ActiveMemberRow
                                                key={
                                                    member.id
                                                }
                                                member={
                                                    member
                                                }
                                                groupOwnerId={
                                                    groupData.adminId
                                                }
                                            />
                                        )
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <p className="py-10 text-center text-sm text-muted-foreground">
                            No active members were found.
                        </p>
                    )}
                </CardContent>
            </Card>

            {pastMembers.length >
                0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Past Members
                            </CardTitle>

                            <CardDescription>
                                Members who left or were removed. Their previous records remain preserved.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table className="min-w-[720px]">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>
                                                Member
                                            </TableHead>

                                            <TableHead>
                                                Exit Type
                                            </TableHead>

                                            <TableHead>
                                                Exit Date
                                            </TableHead>

                                            <TableHead>
                                                Reason
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {pastMembers.map(
                                            (member) => (
                                                <PastMemberRow
                                                    key={
                                                        member.id
                                                    }
                                                    member={
                                                        member
                                                    }
                                                />
                                            )
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}
        </div>
    );
}

export default function AdminPage() {
    const {
        user,
        isUserLoading,
    } = useUser();

    const userDocRef =
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
            userDocRef
        );

    const isLoading =
        isUserLoading ||
        isUserDataLoading;

    return (
        <div className="flex min-h-screen flex-col">
            <AppHeader />

            <main className="container mx-auto flex-grow px-4 py-8 sm:px-6 lg:px-8">
                {isLoading ? (
                    <AdminPageSkeleton />
                ) : userDataError ? (
                    <Alert variant="destructive">
                        <AlertTitle>
                            User profile could not be loaded
                        </AlertTitle>

                        <AlertDescription>
                            {getErrorMessage(
                                userDataError
                            )}
                        </AlertDescription>
                    </Alert>
                ) : !user ? (
                    <div className="py-16 text-center">
                        <h1 className="text-2xl font-bold">
                            Authentication Error
                        </h1>

                        <p className="mt-2 text-muted-foreground">
                            Please log in to access this page.
                        </p>
                    </div>
                ) : userData?.groupId ? (
                    <GroupDetailsPanel
                        groupId={
                            userData.groupId
                        }
                        currentUserId={
                            user.uid
                        }
                        userIsAdmin={
                            Boolean(
                                userData.isAdmin
                            )
                        }
                    />
                ) : (
                    <NewUserAdminPanel
                        user={user}
                    />
                )}
            </main>
        </div>
    );
}
