"use client";

import {
    useMemo,
    useState,
} from "react";
import {
    arrayRemove,
    arrayUnion,
    collection,
    doc,
    getDocs,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";
import {
    endOfMonth,
    format,
    startOfMonth,
} from "date-fns";
import {
    Copy,
    FileDown,
    History,
    Info,
    Loader2,
    Package,
    Plus,
    Settings,
    Shield,
    Trash2,
    UserMinus,
    Users,
} from "lucide-react";

import {
    useCollection,
    useDoc,
    useUser,
} from "@/firebase";
import {
    firestore,
} from "@/firebase/config";
import { AppHeader } from "@/components/app/header";
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type UserProfileRecord = {
    displayName?: string;
    email?: string;
    photoURL?: string;
    groupId?: string | null;
    isAdmin?: boolean;
};

type GroupSettingsRecord = {
    mealTypes?: string[];
    isMealItemNameRequired?: boolean;
};

type GroupRecord = {
    id?: string;
    groupName?: string;
    invitationCode?: string;
    adminId?: string;
    settings?: GroupSettingsRecord;
};

type GroupMemberRecord = {
    id: string;
    role?: string;
    status?: string;

    displayName?: string;
    userName?: string;
    email?: string;
    photoURL?: string;

    exitType?: string;
    removalReason?: string;
    removedBy?: string;
    removedByName?: string;

    removedAt?: Timestamp;
    leftAt?: Timestamp;
};

type MemberProfileSnapshot = {
    displayName?: string;
    email?: string;
    photoURL?: string;
};

type RemoveMemberPayload = {
    member: GroupMemberRecord;
    profile:
    | MemberProfileSnapshot
    | null
    | undefined;
    reason: string;
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

const getInitial = (
    name?: string,
    email?: string
): string => {
    return (
        name?.trim() ||
        email?.trim() ||
        "M"
    )
        .charAt(0)
        .toUpperCase();
};

const escapeCsv = (
    value: unknown
): string => {
    const stringValue =
        value === null ||
            value === undefined
            ? ""
            : String(value);

    return `"${stringValue.replace(
        /"/g,
        '""'
    )}"`;
};

function AdminProfilePageSkeleton() {
    return (
        <div className="space-y-8">
            <div>
                <Skeleton className="h-9 w-48" />
                <Skeleton className="mt-2 h-4 w-72 max-w-full" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Skeleton className="h-32 rounded-lg" />
                <Skeleton className="h-32 rounded-lg" />
                <Skeleton className="h-32 rounded-lg" />
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-2/3" />
                        <Skeleton className="mt-2 h-4 w-1/2" />
                    </CardHeader>

                    <CardContent className="space-y-3">
                        {Array.from({
                            length: 3,
                        }).map((_, index) => (
                            <Skeleton
                                key={index}
                                className="h-14 w-full"
                            />
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-1/3" />
                        <Skeleton className="mt-2 h-4 w-3/4" />
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function AccessDenied() {
    return (
        <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
            <Alert
                variant="destructive"
                className="max-w-lg"
            >
                <Shield className="h-4 w-4" />

                <AlertTitle>
                    Access Denied
                </AlertTitle>

                <AlertDescription>
                    This page is available only to group administrators.
                </AlertDescription>
            </Alert>
        </div>
    );
}

function MemberRow({
    member,
    currentUserId,
    groupOwnerId,
    isRemoving,
    onRemove,
}: {
    member: GroupMemberRecord;
    currentUserId: string;
    groupOwnerId?: string;
    isRemoving: boolean;
    onRemove: (
        payload: RemoveMemberPayload
    ) => Promise<void>;
}) {
    const [reason, setReason] =
        useState("");

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

    if (isLoading) {
        return (
            <TableRow>
                <TableCell>
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <Skeleton className="h-5 w-28" />
                    </div>
                </TableCell>

                <TableCell>
                    <Skeleton className="h-5 w-36" />
                </TableCell>

                <TableCell>
                    <Skeleton className="h-6 w-20" />
                </TableCell>

                <TableCell>
                    <Skeleton className="h-8 w-24" />
                </TableCell>
            </TableRow>
        );
    }

    const displayName =
        userData?.displayName ||
        member.displayName ||
        member.userName ||
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
        member.role ||
        (member.id ===
            groupOwnerId
            ? "admin"
            : "member");

    const isCurrentUser =
        member.id === currentUserId;

    const isGroupOwner =
        member.id === groupOwnerId;

    const cannotRemove =
        isCurrentUser ||
        isGroupOwner ||
        isRemoving;

    return (
        <TableRow>
            <TableCell>
                <div className="flex min-w-[170px] items-center gap-3">
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

                    <div className="min-w-0">
                        <p className="truncate font-medium">
                            {displayName}
                        </p>

                        {isCurrentUser && (
                            <p className="text-xs text-muted-foreground">
                                You
                            </p>
                        )}
                    </div>
                </div>
            </TableCell>

            <TableCell>
                <span className="break-all text-sm">
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

            <TableCell className="text-right">
                {isCurrentUser ? (
                    <Badge variant="outline">
                        Current user
                    </Badge>
                ) : isGroupOwner ? (
                    <Badge variant="outline">
                        Group owner
                    </Badge>
                ) : (
                    <AlertDialog
                        onOpenChange={(
                            open
                        ) => {
                            if (!open) {
                                setReason("");
                            }
                        }}
                    >
                        <AlertDialogTrigger
                            asChild
                        >
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                disabled={
                                    cannotRemove
                                }
                            >
                                {isRemoving ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <UserMinus className="mr-2 h-4 w-4" />
                                )}

                                Remove
                            </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Remove {displayName}?
                                </AlertDialogTitle>

                                <AlertDialogDescription>
                                    The member will lose access to this group, but their previous expenses, meals, purchases and settlement history will remain unchanged.
                                </AlertDialogDescription>
                            </AlertDialogHeader>

                            <div className="space-y-2 py-2">
                                <Label htmlFor={`remove-reason-${member.id}`}>
                                    Removal reason
                                </Label>

                                <Textarea
                                    id={`remove-reason-${member.id}`}
                                    value={reason}
                                    onChange={(
                                        event
                                    ) => {
                                        setReason(
                                            event.target.value
                                        );
                                    }}
                                    placeholder="Example: Left the hostel"
                                    maxLength={250}
                                />

                                <p className="text-right text-xs text-muted-foreground">
                                    {reason.length}/250
                                </p>
                            </div>

                            <AlertDialogFooter>
                                <AlertDialogCancel>
                                    Cancel
                                </AlertDialogCancel>

                                <AlertDialogAction
                                    disabled={
                                        !reason.trim() ||
                                        isRemoving
                                    }
                                    onClick={(
                                        event
                                    ) => {
                                        if (!reason.trim()) {
                                            event.preventDefault();
                                            return;
                                        }

                                        void onRemove({
                                            member,
                                            profile:
                                                userData,
                                            reason:
                                                reason.trim(),
                                        });
                                    }}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    Confirm Removal
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </TableCell>
        </TableRow>
    );
}

function MemberHistoryTable({
    members,
}: {
    members: GroupMemberRecord[];
}) {
    if (members.length === 0) {
        return (
            <div className="py-10 text-center text-sm text-muted-foreground">
                No former members in the history yet.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <Table className="min-w-[700px]">
                <TableHeader>
                    <TableRow>
                        <TableHead>
                            Member
                        </TableHead>

                        <TableHead>
                            Exit Type
                        </TableHead>

                        <TableHead>
                            Date
                        </TableHead>

                        <TableHead>
                            Reason
                        </TableHead>

                        <TableHead>
                            Action By
                        </TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {members.map(
                        (member) => {
                            const exitDate =
                                toDate(
                                    member.removedAt ||
                                    member.leftAt
                                );

                            const displayName =
                                member.displayName ||
                                member.userName ||
                                member.email ||
                                `Member ${member.id.slice(
                                    0,
                                    5
                                )}`;

                            return (
                                <TableRow
                                    key={member.id}
                                >
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

                                            <div>
                                                <p className="font-medium">
                                                    {displayName}
                                                </p>

                                                {member.email && (
                                                    <p className="text-xs text-muted-foreground">
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
                                            className="capitalize"
                                        >
                                            {member.exitType ||
                                                "left"}
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
                                            "No reason recorded"}
                                    </TableCell>

                                    <TableCell>
                                        {member.removedByName ||
                                            "Self"}
                                    </TableCell>
                                </TableRow>
                            );
                        }
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

function AdminActionsCard({
    groupDocRef,
    groupData,
    groupId,
}: {
    groupDocRef:
    | ReturnType<typeof doc>
    | null;
    groupData:
    | GroupRecord
    | null
    | undefined;
    groupId: string;
}) {
    const { toast } = useToast();

    const [
        newMealType,
        setNewMealType,
    ] = useState("");

    const [
        isUpdating,
        setIsUpdating,
    ] = useState(false);

    const [
        isExporting,
        setIsExporting,
    ] = useState(false);

    const [
        isMealItemNameRequired,
        setIsMealItemNameRequired,
    ] = useState(
        groupData?.settings
            ?.isMealItemNameRequired ??
        false
    );

    const handleMealItemNameRequiredToggle =
        async (
            checked: boolean
        ) => {
            if (
                !groupDocRef ||
                isUpdating
            ) {
                return;
            }

            setIsUpdating(true);

            try {
                await updateDoc(
                    groupDocRef,
                    {
                        "settings.isMealItemNameRequired":
                            checked,
                    }
                );

                setIsMealItemNameRequired(
                    checked
                );

                toast({
                    title:
                        "Setting Updated",

                    description: `Meal item name is now ${checked
                            ? "required"
                            : "optional"
                        }.`,
                });
            } catch (error) {
                console.error(
                    "Setting update error:",
                    error
                );

                toast({
                    variant:
                        "destructive",
                    title:
                        "Error updating setting.",
                });
            } finally {
                setIsUpdating(false);
            }
        };

    const handleAddMealType =
        async () => {
            const mealType =
                newMealType.trim();

            if (
                !mealType ||
                !groupDocRef ||
                isUpdating
            ) {
                return;
            }

            setIsUpdating(true);

            try {
                await updateDoc(
                    groupDocRef,
                    {
                        "settings.mealTypes":
                            arrayUnion(
                                mealType
                            ),
                    }
                );

                setNewMealType("");

                toast({
                    title:
                        "Meal Type Added",
                });
            } catch (error) {
                console.error(
                    "Meal type add error:",
                    error
                );

                toast({
                    variant:
                        "destructive",
                    title:
                        "Error adding meal type.",
                });
            } finally {
                setIsUpdating(false);
            }
        };

    const handleRemoveMealType =
        async (
            mealType: string
        ) => {
            if (
                !groupDocRef ||
                isUpdating
            ) {
                return;
            }

            setIsUpdating(true);

            try {
                await updateDoc(
                    groupDocRef,
                    {
                        "settings.mealTypes":
                            arrayRemove(
                                mealType
                            ),
                    }
                );

                toast({
                    title:
                        "Meal Type Removed",
                });
            } catch (error) {
                console.error(
                    "Meal type removal error:",
                    error
                );

                toast({
                    variant:
                        "destructive",
                    title:
                        "Error removing meal type.",
                });
            } finally {
                setIsUpdating(false);
            }
        };

    const handleExportData =
        async () => {
            if (isExporting) {
                return;
            }

            setIsExporting(true);

            try {
                const monthStart =
                    startOfMonth(
                        new Date()
                    );

                const monthEnd =
                    endOfMonth(
                        new Date()
                    );

                const expensesQuery =
                    query(
                        collection(
                            firestore,
                            "groups",
                            groupId,
                            "expenses"
                        ),
                        where(
                            "date",
                            ">=",
                            Timestamp.fromDate(
                                monthStart
                            )
                        ),
                        where(
                            "date",
                            "<=",
                            Timestamp.fromDate(
                                monthEnd
                            )
                        )
                    );

                const mealsQuery =
                    query(
                        collection(
                            firestore,
                            "groups",
                            groupId,
                            "meals"
                        ),
                        where(
                            "date",
                            ">=",
                            Timestamp.fromDate(
                                monthStart
                            )
                        ),
                        where(
                            "date",
                            "<=",
                            Timestamp.fromDate(
                                monthEnd
                            )
                        )
                    );

                const [
                    expensesSnapshot,
                    mealsSnapshot,
                ] = await Promise.all([
                    getDocs(
                        expensesQuery
                    ),
                    getDocs(
                        mealsQuery
                    ),
                ]);

                const rows: string[] = [
                    [
                        "Type",
                        "Date",
                        "Member",
                        "Item",
                        "Category",
                        "Amount / Count",
                    ]
                        .map(escapeCsv)
                        .join(","),
                ];

                expensesSnapshot.docs.forEach(
                    (expenseDocument) => {
                        const data =
                            expenseDocument.data();

                        const date =
                            toDate(data.date);

                        rows.push(
                            [
                                "Expense",
                                date
                                    ? format(
                                        date,
                                        "yyyy-MM-dd"
                                    )
                                    : "",
                                data.userName,
                                data.expenseItem,
                                data.category,
                                data.amount,
                            ]
                                .map(escapeCsv)
                                .join(",")
                        );
                    }
                );

                mealsSnapshot.docs.forEach(
                    (mealDocument) => {
                        const data =
                            mealDocument.data();

                        const date =
                            toDate(data.date);

                        rows.push(
                            [
                                "Meal",
                                date
                                    ? format(
                                        date,
                                        "yyyy-MM-dd"
                                    )
                                    : "",
                                data.userName,
                                data.itemName ||
                                data.mealType,
                                data.mealType,
                                data.mealNumber,
                            ]
                                .map(escapeCsv)
                                .join(",")
                        );
                    }
                );

                const csvBlob =
                    new Blob(
                        [
                            "\uFEFF",
                            rows.join("\n"),
                        ],
                        {
                            type:
                                "text/csv;charset=utf-8",
                        }
                    );

                const downloadUrl =
                    URL.createObjectURL(
                        csvBlob
                    );

                const anchor =
                    document.createElement(
                        "a"
                    );

                anchor.href =
                    downloadUrl;

                anchor.download =
                    `bachelorbite-${format(
                        new Date(),
                        "yyyy-MM"
                    )}.csv`;

                document.body.appendChild(
                    anchor
                );

                anchor.click();
                anchor.remove();

                URL.revokeObjectURL(
                    downloadUrl
                );

                toast({
                    title:
                        "Export Complete",

                    description:
                        "The current month's group data was downloaded.",
                });
            } catch (error) {
                console.error(
                    "Export error:",
                    error
                );

                toast({
                    variant:
                        "destructive",
                    title:
                        "Export Failed",
                });
            } finally {
                setIsExporting(false);
            }
        };

    const mealTypes =
        groupData?.settings
            ?.mealTypes ?? [];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Admin Actions
                </CardTitle>

                <CardDescription>
                    Configure group features and export group data.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                <Dialog>
                    <DialogTrigger
                        asChild
                    >
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-start gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Manage Meal Types
                        </Button>
                    </DialogTrigger>

                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                Manage Meal Types
                            </DialogTitle>

                            <DialogDescription>
                                Add or remove meal categories used by your group.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-5">
                            <div className="flex gap-2">
                                <Input
                                    value={
                                        newMealType
                                    }
                                    onChange={(
                                        event
                                    ) => {
                                        setNewMealType(
                                            event.target.value
                                        );
                                    }}
                                    placeholder="Example: Breakfast"
                                />

                                <Button
                                    type="button"
                                    onClick={() => {
                                        void handleAddMealType();
                                    }}
                                    disabled={
                                        isUpdating ||
                                        !newMealType.trim()
                                    }
                                >
                                    {isUpdating ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Plus className="h-4 w-4" />
                                    )}

                                    <span className="ml-2">
                                        Add
                                    </span>
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {mealTypes.length >
                                    0 ? (
                                    mealTypes.map(
                                        (mealType) => (
                                            <div
                                                key={
                                                    mealType
                                                }
                                                className="flex items-center justify-between rounded-md bg-muted p-2"
                                            >
                                                <p className="font-medium">
                                                    {mealType}
                                                </p>

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        void handleRemoveMealType(
                                                            mealType
                                                        );
                                                    }}
                                                    disabled={
                                                        isUpdating
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        )
                                    )
                                ) : (
                                    <p className="py-3 text-center text-sm text-muted-foreground">
                                        No meal types configured.
                                    </p>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                    <Label
                        htmlFor="meal-item-required"
                        className="flex flex-col gap-1"
                    >
                        <span>
                            Require Meal Item Name
                        </span>

                        <span className="text-xs font-normal text-muted-foreground">
                            Makes the item-name field mandatory when logging a meal.
                        </span>
                    </Label>

                    <Switch
                        id="meal-item-required"
                        checked={
                            isMealItemNameRequired
                        }
                        onCheckedChange={(
                            checked
                        ) => {
                            void handleMealItemNameRequiredToggle(
                                checked
                            );
                        }}
                        disabled={
                            isUpdating
                        }
                    />
                </div>

                <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start gap-2"
                    disabled
                >
                    <Package className="h-4 w-4" />
                    Edit Purchased Items
                </Button>

                <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => {
                        void handleExportData();
                    }}
                    disabled={
                        isExporting
                    }
                >
                    {isExporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <FileDown className="h-4 w-4" />
                    )}

                    Export Group Data
                </Button>
            </CardContent>
        </Card>
    );
}

export default function AdminProfilePage() {
    const {
        user,
        isUserLoading,
    } = useUser();

    const { toast } =
        useToast();

    const [
        removingMemberId,
        setRemovingMemberId,
    ] =
        useState<string | null>(
            null
        );

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

    const groupId =
        userData?.groupId;

    const groupDocRef =
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
    } =
        useDoc<GroupRecord>(
            groupDocRef
        );

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

    const inactiveMembers =
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
                        const firstTime =
                            toDate(
                                firstMember.removedAt ||
                                firstMember.leftAt
                            )?.getTime() ??
                            0;

                        const secondTime =
                            toDate(
                                secondMember.removedAt ||
                                secondMember.leftAt
                            )?.getTime() ??
                            0;

                        return (
                            secondTime -
                            firstTime
                        );
                    }
                );
        }, [members]);

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

    const isAdmin =
        Boolean(
            user &&
            (userData?.isAdmin ||
                groupData?.adminId ===
                user.uid ||
                currentMembership?.role ===
                "admin")
        );

    const currentAdminName =
        userData?.displayName ||
        user?.displayName ||
        user?.email?.split(
            "@"
        )[0] ||
        "Admin";

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
                    "Copy error:",
                    error
                );

                toast({
                    variant:
                        "destructive",
                    title:
                        "Copy Failed",
                });
            }
        };

    const handleRemoveMember =
        async ({
            member,
            profile,
            reason,
        }: RemoveMemberPayload) => {
            if (
                !user ||
                !groupId ||
                !isAdmin ||
                removingMemberId
            ) {
                return;
            }

            if (
                member.id ===
                user.uid
            ) {
                toast({
                    variant:
                        "destructive",
                    title:
                        "Use Leave Group",

                    description:
                        "You cannot remove yourself from the member-management table.",
                });

                return;
            }

            if (
                member.id ===
                groupData?.adminId
            ) {
                toast({
                    variant:
                        "destructive",
                    title:
                        "Group Owner Cannot Be Removed",

                    description:
                        "Transfer group ownership before removing this member.",
                });

                return;
            }

            const targetRole =
                member.role ||
                "member";

            if (
                targetRole ===
                "admin"
            ) {
                const activeAdmins =
                    activeMembers.filter(
                        (
                            activeMember
                        ) =>
                            activeMember.role ===
                            "admin" ||
                            activeMember.id ===
                            groupData?.adminId
                    );

                if (
                    activeAdmins.length <=
                    1
                ) {
                    toast({
                        variant:
                            "destructive",
                        title:
                            "Last Admin Cannot Be Removed",

                        description:
                            "Assign another admin before removing this member.",
                    });

                    return;
                }
            }

            setRemovingMemberId(
                member.id
            );

            try {
                const memberName =
                    profile?.displayName ||
                    member.displayName ||
                    member.userName ||
                    profile?.email ||
                    member.email ||
                    `Member ${member.id.slice(
                        0,
                        5
                    )}`;

                const memberEmail =
                    profile?.email ||
                    member.email ||
                    null;

                const memberPhotoURL =
                    profile?.photoURL ||
                    member.photoURL ||
                    null;

                const batch =
                    writeBatch(
                        firestore
                    );

                const memberRef =
                    doc(
                        firestore,
                        "groups",
                        groupId,
                        "members",
                        member.id
                    );

                const targetUserRef =
                    doc(
                        firestore,
                        "users",
                        member.id
                    );

                const historyRef =
                    doc(
                        collection(
                            firestore,
                            "groups",
                            groupId,
                            "memberHistory"
                        )
                    );

                const notificationRef =
                    doc(
                        collection(
                            firestore,
                            "groups",
                            groupId,
                            "notifications"
                        )
                    );

                /*
                 * Member document delete হচ্ছে না।
                 * এটি history হিসেবে inactive অবস্থায় থাকবে।
                 */
                batch.set(
                    memberRef,
                    {
                        status:
                            "inactive",

                        exitType:
                            "removed",

                        removedAt:
                            serverTimestamp(),

                        removedBy:
                            user.uid,

                        removedByName:
                            currentAdminName,

                        removalReason:
                            reason,

                        displayName:
                            memberName,

                        email:
                            memberEmail,

                        photoURL:
                            memberPhotoURL,
                    },
                    {
                        merge: true,
                    }
                );

                /*
                 * User account delete হচ্ছে না।
                 * শুধু বর্তমান group access সরানো হচ্ছে।
                 */
                batch.update(
                    targetUserRef,
                    {
                        groupId: null,
                        isAdmin: false,
                    }
                );

                /*
                 * আলাদা immutable history event।
                 */
                batch.set(
                    historyRef,
                    {
                        groupId,

                        memberId:
                            member.id,

                        memberName,

                        memberEmail,

                        memberPhotoURL,

                        previousRole:
                            targetRole,

                        action:
                            "removed",

                        performedBy:
                            user.uid,

                        performedByName:
                            currentAdminName,

                        reason,

                        createdAt:
                            serverTimestamp(),
                    }
                );

                /*
                 * Group activity notification।
                 */
                batch.set(
                    notificationRef,
                    {
                        groupId,

                        senderId:
                            user.uid,

                        senderName:
                            currentAdminName,

                        targetUserId:
                            member.id,

                        type:
                            "member_removed",

                        messageText:
                            `${currentAdminName} removed ${memberName} from the group. Reason: ${reason}`,

                        createdAt:
                            serverTimestamp(),

                        readBy: [
                            user.uid,
                        ],
                    }
                );

                await batch.commit();

                toast({
                    title:
                        "Member Removed",

                    description:
                        `${memberName} no longer has access to this group. Previous records were preserved.`,
                });
            } catch (error) {
                console.error(
                    "Member removal error:",
                    error
                );

                toast({
                    variant:
                        "destructive",
                    title:
                        "Member Could Not Be Removed",

                    description:
                        "Check your Firestore permissions and try again.",
                });
            } finally {
                setRemovingMemberId(
                    null
                );
            }
        };

    const isLoading =
        isUserLoading ||
        isUserDataLoading ||
        Boolean(
            groupId &&
            (isGroupDataLoading ||
                areMembersLoading)
        );

    return (
        <div className="flex min-h-screen flex-col">
            <AppHeader />

            <main className="container mx-auto flex-grow px-4 py-8 sm:px-6 lg:px-8">
                {isLoading ? (
                    <AdminProfilePageSkeleton />
                ) : userDataError ? (
                    <Alert variant="destructive">
                        <AlertTitle>
                            User profile could not be loaded
                        </AlertTitle>

                        <AlertDescription>
                            Refresh the page and check Firestore permissions.
                        </AlertDescription>
                    </Alert>
                ) : !isAdmin ? (
                    <AccessDenied />
                ) : !groupId ||
                    !groupData ? (
                    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
                        <Alert className="max-w-lg">
                            <Shield className="h-4 w-4" />

                            <AlertTitle>
                                No Group Found
                            </AlertTitle>

                            <AlertDescription>
                                You are not currently part of a group.
                            </AlertDescription>
                        </Alert>
                    </div>
                ) : groupDataError ||
                    membersError ? (
                    <Alert variant="destructive">
                        <AlertTitle>
                            Admin data could not be loaded
                        </AlertTitle>

                        <AlertDescription>
                            Refresh the page and verify your Firestore rules.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="space-y-8">
                        <div>
                            <h1 className="flex items-center gap-3 font-headline text-2xl font-bold text-header-yellow md:text-3xl">
                                <Shield className="h-8 w-8" />
                                Admin Dashboard
                            </h1>

                            <p className="text-sm text-muted-foreground md:text-base">
                                Manage your group, members and settings.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Users />
                                        Active Members
                                    </CardTitle>
                                </CardHeader>

                                <CardContent>
                                    <p className="text-3xl font-bold">
                                        {activeMembers.length}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        Group Name
                                    </CardTitle>
                                </CardHeader>

                                <CardContent>
                                    <p className="break-words text-3xl font-bold">
                                        {groupData.groupName ||
                                            "Unnamed Group"}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        Invitation Code
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="flex items-center gap-2">
                                    <p className="break-all font-mono text-2xl font-bold tracking-widest">
                                        {groupData.invitationCode ||
                                            "—"}
                                    </p>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            void handleCopyInviteCode();
                                        }}
                                        disabled={
                                            !groupData.invitationCode
                                        }
                                    >
                                        <Copy className="h-5 w-5" />
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        Member Management
                                    </CardTitle>

                                    <CardDescription>
                                        Remove a member without deleting their previous group history.
                                    </CardDescription>
                                </CardHeader>

                                <CardContent>
                                    {activeMembers.length >
                                        0 ? (
                                        <div className="overflow-x-auto">
                                            <Table className="min-w-[720px]">
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>
                                                            Member
                                                        </TableHead>

                                                        <TableHead>
                                                            Email
                                                        </TableHead>

                                                        <TableHead>
                                                            Role
                                                        </TableHead>

                                                        <TableHead className="text-right">
                                                            Action
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>

                                                <TableBody>
                                                    {activeMembers.map(
                                                        (member) => (
                                                            <MemberRow
                                                                key={
                                                                    member.id
                                                                }
                                                                member={
                                                                    member
                                                                }
                                                                currentUserId={
                                                                    user?.uid ||
                                                                    ""
                                                                }
                                                                groupOwnerId={
                                                                    groupData.adminId
                                                                }
                                                                isRemoving={
                                                                    removingMemberId ===
                                                                    member.id
                                                                }
                                                                onRemove={
                                                                    handleRemoveMember
                                                                }
                                                            />
                                                        )
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <p className="py-8 text-center text-sm text-muted-foreground">
                                            No active members found.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            <AdminActionsCard
                                groupDocRef={
                                    groupDocRef
                                }
                                groupData={
                                    groupData
                                }
                                groupId={
                                    groupId
                                }
                            />
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <History className="h-5 w-5" />
                                    Member History
                                </CardTitle>

                                <CardDescription>
                                    Former members remain here, while their previous financial and meal records stay unchanged.
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
                                <MemberHistoryTable
                                    members={
                                        inactiveMembers
                                    }
                                />
                            </CardContent>
                        </Card>

                        <Alert>
                            <Info className="h-4 w-4" />

                            <AlertTitle>
                                Soft removal is enabled
                            </AlertTitle>

                            <AlertDescription>
                                Removing a member only revokes their group access. Their account and all historical records remain available in reports.
                            </AlertDescription>
                        </Alert>
                    </div>
                )}
            </main>
        </div>
    );
}