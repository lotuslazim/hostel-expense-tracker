"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";
import {
    AlertCircle,
    CheckCircle2,
    Hand,
    Plus,
    ShoppingCart,
    Trash2,
    UserCheck,
    X,
} from "lucide-react";

import { AppHeader } from "@/components/app/header";
import { WelcomeCard } from "@/components/app/welcome-card";
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import {
    useDoc,
    useFirebase,
    useUser,
} from "@/firebase";
import type {
    ShoppingItem,
    ShoppingItemPriority,
} from "@/lib/types";

function ShoppingListSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-56" />
                    <Skeleton className="h-4 w-80 max-w-full" />
                </div>

                <Skeleton className="h-10 w-32 rounded-lg" />
            </div>

            <div className="space-y-3">
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
            </div>
        </div>
    );
}

function formatItemDate(item: ShoppingItem) {
    if (!item.createdAt) {
        return "Just now";
    }

    try {
        return item.createdAt.toDate().toLocaleString();
    } catch {
        return "Just now";
    }
}

export default function ShoppingListPage() {
    const { firestore } = useFirebase();
    const { user, isUserLoading } = useUser();

    const [isAddDialogOpen, setIsAddDialogOpen] =
        useState(false);

    const [itemName, setItemName] = useState("");
    const [quantity, setQuantity] = useState("");
    const [unit, setUnit] = useState("");
    const [priority, setPriority] =
        useState<ShoppingItemPriority>("normal");
    const [note, setNote] = useState("");

    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    const [shoppingItems, setShoppingItems] =
        useState<ShoppingItem[]>([]);
    const [isItemsLoading, setIsItemsLoading] =
        useState(true);
    const [listError, setListError] = useState("");

    const [successMessage, setSuccessMessage] =
        useState("");
    const [actionError, setActionError] =
        useState("");

    const [updatingItemId, setUpdatingItemId] =
        useState<string | null>(null);

    const [itemToDelete, setItemToDelete] =
        useState<ShoppingItem | null>(null);
    const [isDeleting, setIsDeleting] =
        useState(false);

    const userDocRef = useMemo(() => {
        if (!user) {
            return null;
        }

        return doc(firestore, "users", user.uid);
    }, [firestore, user]);

    const {
        data: userData,
        isLoading: isUserDataLoading,
    } = useDoc(userDocRef);

    const groupId = userData?.groupId;

    const currentUserName =
        userData?.displayName ||
        user?.displayName ||
        user?.email?.split("@")[0] ||
        "User";

    useEffect(() => {
        if (!groupId) {
            setShoppingItems([]);
            setIsItemsLoading(false);
            return;
        }

        setIsItemsLoading(true);
        setListError("");

        const shoppingItemsRef = collection(
            firestore,
            "groups",
            groupId,
            "shoppingItems"
        );

        const unsubscribe = onSnapshot(
            shoppingItemsRef,
            (snapshot) => {
                const items = snapshot.docs.map(
                    (itemDocument) =>
                        ({
                            id: itemDocument.id,
                            ...itemDocument.data(),
                        }) as ShoppingItem
                );

                const activeItems = items
                    .filter(
                        (item) => item.status !== "completed"
                    )
                    .sort((firstItem, secondItem) => {
                        if (
                            firstItem.priority === "urgent" &&
                            secondItem.priority !== "urgent"
                        ) {
                            return -1;
                        }

                        if (
                            firstItem.priority !== "urgent" &&
                            secondItem.priority === "urgent"
                        ) {
                            return 1;
                        }

                        const firstTime =
                            firstItem.createdAt?.toMillis?.() ?? 0;

                        const secondTime =
                            secondItem.createdAt?.toMillis?.() ?? 0;

                        return secondTime - firstTime;
                    });

                setShoppingItems(activeItems);
                setIsItemsLoading(false);
            },
            (error) => {
                console.error(
                    "Failed to load shopping items:",
                    error
                );

                setListError(
                    "Shopping items could not be loaded."
                );
                setIsItemsLoading(false);
            }
        );

        return unsubscribe;
    }, [firestore, groupId]);

    const isLoading =
        isUserLoading || isUserDataLoading;

    const resetMessages = () => {
        setSuccessMessage("");
        setActionError("");
    };

    const resetForm = () => {
        setItemName("");
        setQuantity("");
        setUnit("");
        setPriority("normal");
        setNote("");
        setSaveError("");
    };

    const handleDialogChange = (open: boolean) => {
        if (isSaving) {
            return;
        }

        setIsAddDialogOpen(open);

        if (!open) {
            resetForm();
        }
    };

    const handleAddItem = async () => {
        const trimmedName = itemName.trim();
        const trimmedNote = note.trim();

        setSaveError("");
        resetMessages();

        if (!trimmedName) {
            setSaveError("Please enter an item name.");
            return;
        }

        if (!user || !groupId) {
            setSaveError(
                "Your user or group information is unavailable."
            );
            return;
        }

        let parsedQuantity: number | null = null;

        if (quantity.trim()) {
            parsedQuantity = Number(quantity);

            if (
                !Number.isFinite(parsedQuantity) ||
                parsedQuantity <= 0
            ) {
                setSaveError(
                    "Quantity must be greater than zero."
                );
                return;
            }

            if (!unit) {
                setSaveError(
                    "Please select a unit for the quantity."
                );
                return;
            }
        }

        setIsSaving(true);

        try {
            const shoppingItemsRef = collection(
                firestore,
                "groups",
                groupId,
                "shoppingItems"
            );

            await addDoc(shoppingItemsRef, {
                name: trimmedName,
                quantity: parsedQuantity,
                unit: parsedQuantity ? unit : null,
                note: trimmedNote || null,
                priority,
                status: "needed",

                groupId,

                addedBy: user.uid,
                addedByName: currentUserName,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),

                claimedBy: null,
                claimedByName: null,
                claimedAt: null,

                completedBy: null,
                completedByName: null,
                completedAt: null,

                linkedExpenseId: null,
            });

            resetForm();
            setIsAddDialogOpen(false);

            setSuccessMessage(
                `${trimmedName} was added to the shopping list.`
            );
        } catch (error) {
            console.error(
                "Failed to add shopping item:",
                error
            );

            setSaveError(
                "The item could not be saved. Please try again."
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleClaimItem = async (
        item: ShoppingItem
    ) => {
        if (!user || !groupId) {
            setActionError(
                "Your user or group information is unavailable."
            );
            return;
        }

        setUpdatingItemId(item.id);
        resetMessages();

        try {
            const itemRef = doc(
                firestore,
                "groups",
                groupId,
                "shoppingItems",
                item.id
            );

            await updateDoc(itemRef, {
                status: "claimed",
                claimedBy: user.uid,
                claimedByName: currentUserName,
                claimedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            setSuccessMessage(
                `You claimed ${item.name}.`
            );
        } catch (error) {
            console.error(
                "Failed to claim shopping item:",
                error
            );

            setActionError(
                "The item could not be claimed. Please try again."
            );
        } finally {
            setUpdatingItemId(null);
        }
    };

    const handleCancelClaim = async (
        item: ShoppingItem
    ) => {
        if (!user || !groupId) {
            setActionError(
                "Your user or group information is unavailable."
            );
            return;
        }

        if (item.claimedBy !== user.uid) {
            setActionError(
                "Only the member who claimed this item can cancel the claim."
            );
            return;
        }

        setUpdatingItemId(item.id);
        resetMessages();

        try {
            const itemRef = doc(
                firestore,
                "groups",
                groupId,
                "shoppingItems",
                item.id
            );

            await updateDoc(itemRef, {
                status: "needed",
                claimedBy: null,
                claimedByName: null,
                claimedAt: null,
                updatedAt: serverTimestamp(),
            });

            setSuccessMessage(
                `Your claim for ${item.name} was cancelled.`
            );
        } catch (error) {
            console.error(
                "Failed to cancel shopping item claim:",
                error
            );

            setActionError(
                "The claim could not be cancelled. Please try again."
            );
        } finally {
            setUpdatingItemId(null);
        }
    };

    const openDeleteDialog = (
        item: ShoppingItem
    ) => {
        resetMessages();
        setItemToDelete(item);
    };

    const handleDeleteDialogChange = (
        open: boolean
    ) => {
        if (!open && !isDeleting) {
            setItemToDelete(null);
        }
    };

    const handleDeleteItem = async () => {
        if (!user || !groupId || !itemToDelete) {
            setActionError(
                "The item could not be deleted."
            );
            return;
        }

        if (itemToDelete.addedBy !== user.uid) {
            setItemToDelete(null);
            setActionError(
                "Only the member who added this item can delete it."
            );
            return;
        }

        const deletedItemName = itemToDelete.name;

        setIsDeleting(true);
        resetMessages();

        try {
            const itemRef = doc(
                firestore,
                "groups",
                groupId,
                "shoppingItems",
                itemToDelete.id
            );

            await deleteDoc(itemRef);

            setItemToDelete(null);

            setSuccessMessage(
                `${deletedItemName} was removed from the shopping list.`
            );
        } catch (error) {
            console.error(
                "Failed to delete shopping item:",
                error
            );

            setActionError(
                "The item could not be deleted. Please try again."
            );
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen flex-col">
                <AppHeader />

                <main className="container mx-auto flex-grow px-4 py-8 sm:px-6 lg:px-8">
                    <ShoppingListSkeleton />
                </main>
            </div>
        );
    }

    if (!groupId) {
        return (
            <div className="flex min-h-screen flex-col">
                <AppHeader />

                <main className="container mx-auto flex-grow px-4 py-8 sm:px-6 lg:px-8">
                    <WelcomeCard />
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col">
            <AppHeader />

            <main className="container mx-auto flex-grow px-4 py-8 sm:px-6 lg:px-8">
                <div className="space-y-6">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <h1 className="flex items-center gap-3 font-headline text-2xl font-bold text-header-yellow md:text-3xl">
                                <ShoppingCart className="h-8 w-8" />
                                Shopping List
                            </h1>

                            <p className="mt-1 text-sm text-muted-foreground md:text-base">
                                Add and manage the grocery items your
                                group needs.
                            </p>
                        </div>

                        <Button
                            type="button"
                            onClick={() => {
                                resetMessages();
                                setIsAddDialogOpen(true);
                            }}
                            className="gap-2"
                        >
                            <Plus className="h-5 w-5" />
                            Add Item
                        </Button>
                    </div>

                    {successMessage && (
                        <div
                            role="status"
                            className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-300"
                        >
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            {successMessage}
                        </div>
                    )}

                    {actionError && (
                        <div
                            role="alert"
                            className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                        >
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {actionError}
                        </div>
                    )}

                    {listError && (
                        <div
                            role="alert"
                            className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                        >
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {listError}
                        </div>
                    )}

                    {isItemsLoading && (
                        <div className="space-y-3">
                            <Skeleton className="h-36 w-full rounded-xl" />
                            <Skeleton className="h-36 w-full rounded-xl" />
                        </div>
                    )}

                    {!isItemsLoading &&
                        !listError &&
                        shoppingItems.length === 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        No shopping items yet
                                    </CardTitle>

                                    <CardDescription>
                                        Use the Add Item button to add the
                                        first shopping item.
                                    </CardDescription>
                                </CardHeader>

                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Items will be visible to every
                                        member of your group.
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                    {!isItemsLoading &&
                        shoppingItems.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <h2 className="text-lg font-semibold">
                                        Needed items
                                    </h2>

                                    <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                                        {shoppingItems.length}{" "}
                                        {shoppingItems.length === 1
                                            ? "item"
                                            : "items"}
                                    </span>
                                </div>

                                {shoppingItems.map((item) => {
                                    const isClaimed =
                                        item.status === "claimed";

                                    const isClaimedByCurrentUser =
                                        isClaimed &&
                                        item.claimedBy === user?.uid;

                                    const isUpdating =
                                        updatingItemId === item.id;

                                    const canDelete =
                                        item.addedBy === user?.uid;

                                    return (
                                        <Card
                                            key={item.id}
                                            className={
                                                item.priority === "urgent"
                                                    ? "border-orange-500/50"
                                                    : undefined
                                            }
                                        >
                                            <CardContent className="p-4 sm:p-5">
                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="break-words text-base font-semibold sm:text-lg">
                                                                {item.name}
                                                            </h3>

                                                            {item.priority ===
                                                                "urgent" && (
                                                                    <span className="rounded-full bg-orange-500/15 px-2.5 py-1 text-xs font-semibold text-orange-600 dark:text-orange-300">
                                                                        Urgent
                                                                    </span>
                                                                )}

                                                            {isClaimed && (
                                                                <span className="flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-300">
                                                                    <UserCheck className="h-3 w-3" />
                                                                    Claimed
                                                                </span>
                                                            )}
                                                        </div>

                                                        {item.quantity !== null &&
                                                            item.quantity !==
                                                            undefined && (
                                                                <p className="mt-2 text-sm font-medium">
                                                                    Quantity:{" "}
                                                                    {item.quantity}
                                                                    {item.unit
                                                                        ? ` ${item.unit}`
                                                                        : ""}
                                                                </p>
                                                            )}

                                                        {item.note && (
                                                            <p className="mt-2 break-words text-sm text-muted-foreground">
                                                                {item.note}
                                                            </p>
                                                        )}

                                                        {isClaimed && (
                                                            <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-2 text-sm text-blue-700 dark:text-blue-300">
                                                                <UserCheck className="h-4 w-4 shrink-0" />

                                                                <span>
                                                                    {isClaimedByCurrentUser
                                                                        ? "You will bring this item"
                                                                        : `${item.claimedByName ||
                                                                        "A group member"
                                                                        } will bring this item`}
                                                                </span>
                                                            </div>
                                                        )}

                                                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                            <span>
                                                                Added by{" "}
                                                                {item.addedByName ||
                                                                    "Group member"}
                                                            </span>

                                                            <span>
                                                                {formatItemDate(item)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex shrink-0 flex-col gap-2">
                                                        {!isClaimed && (
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                disabled={isUpdating}
                                                                onClick={() =>
                                                                    void handleClaimItem(
                                                                        item
                                                                    )
                                                                }
                                                                className="w-full gap-2 sm:w-auto"
                                                            >
                                                                <Hand className="h-4 w-4" />

                                                                {isUpdating
                                                                    ? "Claiming..."
                                                                    : "I’ll bring it"}
                                                            </Button>
                                                        )}

                                                        {isClaimedByCurrentUser && (
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                disabled={isUpdating}
                                                                onClick={() =>
                                                                    void handleCancelClaim(
                                                                        item
                                                                    )
                                                                }
                                                                className="w-full gap-2 sm:w-auto"
                                                            >
                                                                <X className="h-4 w-4" />

                                                                {isUpdating
                                                                    ? "Cancelling..."
                                                                    : "Cancel claim"}
                                                            </Button>
                                                        )}

                                                        {isClaimed &&
                                                            !isClaimedByCurrentUser && (
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="secondary"
                                                                    disabled
                                                                    className="w-full gap-2 sm:w-auto"
                                                                >
                                                                    <UserCheck className="h-4 w-4" />
                                                                    Already claimed
                                                                </Button>
                                                            )}

                                                        {canDelete && (
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="destructive"
                                                                disabled={isUpdating}
                                                                onClick={() =>
                                                                    openDeleteDialog(item)
                                                                }
                                                                className="w-full gap-2 sm:w-auto"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                                Delete
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                </div>
            </main>

            {/* Add item dialog */}
            <Dialog
                open={isAddDialogOpen}
                onOpenChange={handleDialogChange}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Add shopping item
                        </DialogTitle>

                        <DialogDescription>
                            Add an item that your group needs to
                            purchase.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="shopping-item-name">
                                Item name
                            </Label>

                            <Input
                                id="shopping-item-name"
                                placeholder="Example: Rice"
                                value={itemName}
                                disabled={isSaving}
                                autoComplete="off"
                                onChange={(event) => {
                                    setItemName(event.target.value);

                                    if (saveError) {
                                        setSaveError("");
                                    }
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="shopping-item-quantity">
                                    Quantity
                                </Label>

                                <Input
                                    id="shopping-item-quantity"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    placeholder="5"
                                    value={quantity}
                                    disabled={isSaving}
                                    onChange={(event) => {
                                        setQuantity(event.target.value);

                                        if (saveError) {
                                            setSaveError("");
                                        }
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="shopping-item-unit">
                                    Unit
                                </Label>

                                <Select
                                    value={unit}
                                    disabled={isSaving}
                                    onValueChange={(value) => {
                                        setUnit(value);

                                        if (saveError) {
                                            setSaveError("");
                                        }
                                    }}
                                >
                                    <SelectTrigger id="shopping-item-unit">
                                        <SelectValue placeholder="Select unit" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectItem value="kg">
                                            kg
                                        </SelectItem>

                                        <SelectItem value="gram">
                                            gram
                                        </SelectItem>

                                        <SelectItem value="litre">
                                            litre
                                        </SelectItem>

                                        <SelectItem value="ml">
                                            ml
                                        </SelectItem>

                                        <SelectItem value="pcs">
                                            pieces
                                        </SelectItem>

                                        <SelectItem value="packet">
                                            packet
                                        </SelectItem>

                                        <SelectItem value="dozen">
                                            dozen
                                        </SelectItem>

                                        <SelectItem value="bottle">
                                            bottle
                                        </SelectItem>

                                        <SelectItem value="other">
                                            other
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Quantity and unit are optional.
                        </p>

                        <div className="space-y-2">
                            <Label htmlFor="shopping-item-priority">
                                Priority
                            </Label>

                            <Select
                                value={priority}
                                disabled={isSaving}
                                onValueChange={(value) =>
                                    setPriority(
                                        value as ShoppingItemPriority
                                    )
                                }
                            >
                                <SelectTrigger id="shopping-item-priority">
                                    <SelectValue />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="normal">
                                        Normal
                                    </SelectItem>

                                    <SelectItem value="urgent">
                                        Urgent
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="shopping-item-note">
                                Note
                            </Label>

                            <Textarea
                                id="shopping-item-note"
                                placeholder="Optional details about the item"
                                rows={3}
                                value={note}
                                disabled={isSaving}
                                onChange={(event) =>
                                    setNote(event.target.value)
                                }
                            />
                        </div>

                        {saveError && (
                            <p
                                role="alert"
                                className="text-sm text-destructive"
                            >
                                {saveError}
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isSaving}
                            onClick={() =>
                                handleDialogChange(false)
                            }
                        >
                            Cancel
                        </Button>

                        <Button
                            type="button"
                            disabled={
                                isSaving || !itemName.trim()
                            }
                            onClick={() =>
                                void handleAddItem()
                            }
                        >
                            {isSaving
                                ? "Adding..."
                                : "Add Item"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation dialog */}
            <Dialog
                open={Boolean(itemToDelete)}
                onOpenChange={handleDeleteDialogChange}
            >
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>
                            Delete shopping item?
                        </DialogTitle>

                        <DialogDescription>
                            {itemToDelete
                                ? `"${itemToDelete.name}" will be permanently removed from the shared shopping list.`
                                : "This item will be permanently removed."}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isDeleting}
                            onClick={() =>
                                setItemToDelete(null)
                            }
                        >
                            Cancel
                        </Button>

                        <Button
                            type="button"
                            variant="destructive"
                            disabled={isDeleting}
                            onClick={() =>
                                void handleDeleteItem()
                            }
                            className="gap-2"
                        >
                            <Trash2 className="h-4 w-4" />

                            {isDeleting
                                ? "Deleting..."
                                : "Delete item"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}