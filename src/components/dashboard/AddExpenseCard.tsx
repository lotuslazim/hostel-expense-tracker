"use client";

import {
  type ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
} from "firebase/firestore";

import {
  AlertTriangle,
  Camera,
  Check,
  Loader2,
  Plus,
  RefreshCw,
  ShoppingBasket,
  ShoppingCart,
  Trash2,
  Upload,
  UserCheck,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ToastAction } from "@/components/ui/toast";

import { useDoc, useUser } from "@/firebase";
import { firestore } from "@/firebase/config";
import { useToast } from "@/hooks/use-toast";
import { useInventory } from "@/contexts/InventoryContext";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { sanitizeFirestoreData } from "@/lib/utils";
import type { ShoppingItem } from "@/lib/types";

const COMMON_UNITS = [
  "kg",
  "gm",
  "L",
  "ml",
  "pcs",
  "dozen",
  "unit",
];

const UNDO_WINDOW_MS = 10_000;

interface AddExpenseCardProps {
  selectedDate: Date;
}

type ShoppingUndoState = {
  id: string;
  quantity: number | null;
  unit: string | null;
  status: "needed" | "claimed" | "completed";
  claimedBy: string | null;
  claimedByName: string | null;
  claimedAt: Timestamp | null;
  completedBy: string | null;
  completedByName: string | null;
  completedAt: Timestamp | null;
  linkedExpenseId: string | null;
};

const purchasedItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Item name is required."),

  quantity: z.coerce
    .number()
    .min(0.1, "Quantity is required."),

  unit: z
    .string()
    .trim()
    .min(1, "Unit is required."),

  cost: z.coerce
    .number()
    .int("Cost must be a whole number.")
    .min(1, "Cost is required."),

  itemId: z.string().optional(),

  shoppingItemId: z.string().optional(),

  shoppingOriginalQuantity: z.coerce
    .number()
    .nullable()
    .optional(),
});

const compressImage = async (
  file: File | Blob
): Promise<Blob> => {
  const imageCompression = (
    await import("browser-image-compression")
  ).default;

  return imageCompression(file as File, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1024,
  });
};

const normalizeShoppingUnit = (
  unit?: string | null
): string => {
  const normalizedUnit = unit
    ?.trim()
    .toLowerCase();

  switch (normalizedUnit) {
    case "kg":
      return "kg";

    case "gram":
    case "grams":
    case "gm":
      return "gm";

    case "litre":
    case "liter":
    case "litres":
    case "liters":
    case "l":
      return "L";

    case "ml":
      return "ml";

    case "pcs":
    case "piece":
    case "pieces":
      return "pcs";

    case "dozen":
      return "dozen";

    default:
      return "unit";
  }
};

const getDigitsOnly = (
  value: string
): string => value.replace(/\D/g, "");

export function AddExpenseCard({
  selectedDate,
}: AddExpenseCardProps) {
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const { triggerUpdate } = useInventory();

  const [imagePreview, setImagePreview] =
    useState<string | null>(null);

  const [
    receiptImageFile,
    setReceiptImageFile,
  ] = useState<File | null>(null);

  const [
    hasCameraPermission,
    setHasCameraPermission,
  ] = useState<boolean | null>(null);

  const [
    isCameraDialogOpen,
    setIsCameraDialogOpen,
  ] = useState(false);

  const [isCapturing, setIsCapturing] =
    useState(false);

  const [facingMode, setFacingMode] =
    useState<"user" | "environment">(
      "environment"
    );

  const [shoppingItems, setShoppingItems] =
    useState<ShoppingItem[]>([]);

  const [
    isShoppingItemsLoading,
    setIsShoppingItemsLoading,
  ] = useState(false);

  const [
    shoppingListError,
    setShoppingListError,
  ] = useState("");

  const [
    isShoppingDialogOpen,
    setIsShoppingDialogOpen,
  ] = useState(false);

  const [
    shoppingPromptHandled,
    setShoppingPromptHandled,
  ] = useState(false);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const videoRef =
    useRef<HTMLVideoElement>(null);

  const canvasRef =
    useRef<HTMLCanvasElement>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const currentUserRef = useMemo(() => {
    if (!currentUser) {
      return null;
    }

    return doc(
      firestore,
      "users",
      currentUser.uid
    );
  }, [currentUser]);

  const { data: currentUserData } =
    useDoc(currentUserRef);

  const groupId = currentUserData?.groupId;

  const currentUserName =
    currentUserData?.displayName ||
    currentUser?.displayName ||
    currentUser?.email?.split("@")[0] ||
    "User";

  const groupRef = useMemo(() => {
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
    isLoading: isGroupDataLoading,
  } = useDoc(groupRef);

  const isUtilityReceiptRequired =
    useMemo(() => {
      return (
        groupData?.settings
          ?.isUtilityReceiptRequired ??
        false
      );
    }, [groupData]);

  const expenseSchema = useMemo(() => {
    return z
      .object({
        amount: z.coerce
          .number()
          .int(
            "Amount must be a whole number."
          )
          .min(
            1,
            "Amount must be greater than 0."
          ),

        expenseItem: z
          .string()
          .optional(),

        category: z.enum(
          [
            "Food & Groceries",
            "Electricity",
            "Gas",
            "Wi-Fi",
            "Other",
          ],
          {
            required_error:
              "Please select a category.",
          }
        ),

        purchasedItems: z
          .array(purchasedItemSchema)
          .optional(),
      })
      .refine(
        (data) => {
          if (
            data.category !==
            "Food & Groceries"
          ) {
            return true;
          }

          if (
            !data.purchasedItems ||
            data.purchasedItems.length === 0
          ) {
            return true;
          }

          const itemsTotal =
            data.purchasedItems.reduce(
              (total, item) => {
                return total + item.cost;
              },
              0
            );

          return itemsTotal === data.amount;
        },
        {
          message:
            "The total cost of items must match the expense amount.",
          path: ["amount"],
        }
      )
      .refine(
        (data) => {
          if (
            data.category !== "Other"
          ) {
            return true;
          }

          return Boolean(
            data.expenseItem?.trim()
          );
        },
        {
          message:
            "Expense Item is required for 'Other' category.",
          path: ["expenseItem"],
        }
      );
  }, []);

  const form = useForm<
    z.infer<typeof expenseSchema>
  >({
    resolver: zodResolver(expenseSchema),

    defaultValues: {
      amount: "" as unknown as number,
      expenseItem: "",
      purchasedItems: [],
    },
  });

  const {
    fields,
    append,
    remove,
  } = useFieldArray({
    control: form.control,
    name: "purchasedItems",
  });

  const categoryValue = useWatch({
    control: form.control,
    name: "category",
  });

  const watchedPurchasedItems =
    useWatch({
      control: form.control,
      name: "purchasedItems",
    }) ?? [];

  const isFoodCategory =
    categoryValue ===
    "Food & Groceries";

  const isUtilityCategory =
    categoryValue === "Electricity" ||
    categoryValue === "Gas";

  const groceryItemsTotal =
    useMemo(() => {
      return watchedPurchasedItems.reduce(
        (total, item) => {
          const itemCost = Number(
            item?.cost ?? 0
          );

          if (
            !Number.isFinite(itemCost) ||
            itemCost < 0
          ) {
            return total;
          }

          return total + Math.trunc(itemCost);
        },
        0
      );
    }, [watchedPurchasedItems]);

  const selectedShoppingItemIds =
    useMemo(() => {
      return new Set(
        watchedPurchasedItems
          .map(
            (item) =>
              item.shoppingItemId
          )
          .filter(
            (
              itemId
            ): itemId is string =>
              Boolean(itemId)
          )
      );
    }, [watchedPurchasedItems]);

  /*
   * Grocery item cost পরিবর্তন হলেই
   * Total Amount automatically update হবে।
   */
  useEffect(() => {
    if (!isFoodCategory) {
      return;
    }

    if (groceryItemsTotal <= 0) {
      form.setValue(
        "amount",
        "" as unknown as number,
        {
          shouldDirty: true,
          shouldValidate: false,
        }
      );

      form.clearErrors("amount");
      return;
    }

    form.setValue(
      "amount",
      groceryItemsTotal,
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );

    form.clearErrors("amount");
  }, [
    form,
    groceryItemsTotal,
    isFoodCategory,
  ]);

  /*
   * Shopping List realtime load.
   */
  useEffect(() => {
    if (!groupId) {
      setShoppingItems([]);
      setIsShoppingItemsLoading(false);
      return;
    }

    setIsShoppingItemsLoading(true);
    setShoppingListError("");

    const shoppingItemsRef =
      collection(
        firestore,
        "groups",
        groupId,
        "shoppingItems"
      );

    const unsubscribe = onSnapshot(
      shoppingItemsRef,
      (snapshot) => {
        const activeItems =
          snapshot.docs
            .map((shoppingItemDocument) => {
              return {
                id: shoppingItemDocument.id,
                ...shoppingItemDocument.data(),
              } as ShoppingItem;
            })
            .filter((item) => {
              return (
                item.status !== "completed"
              );
            })
            .sort(
              (
                firstItem,
                secondItem
              ) => {
                if (
                  firstItem.priority ===
                  "urgent" &&
                  secondItem.priority !==
                  "urgent"
                ) {
                  return -1;
                }

                if (
                  firstItem.priority !==
                  "urgent" &&
                  secondItem.priority ===
                  "urgent"
                ) {
                  return 1;
                }

                const firstTime =
                  firstItem.createdAt
                    ?.toMillis?.() ?? 0;

                const secondTime =
                  secondItem.createdAt
                    ?.toMillis?.() ?? 0;

                return (
                  secondTime - firstTime
                );
              }
            );

        setShoppingItems(activeItems);
        setIsShoppingItemsLoading(false);
      },
      (error) => {
        console.error(
          "Error loading shopping items:",
          error
        );

        setShoppingListError(
          "Shopping List items could not be loaded."
        );

        setIsShoppingItemsLoading(false);
      }
    );

    return unsubscribe;
  }, [groupId]);

  /*
   * Category অনুযায়ী expense item set।
   */
  useEffect(() => {
    if (
      categoryValue ===
      "Electricity"
    ) {
      form.setValue(
        "expenseItem",
        "Electricity Bill"
      );
    } else if (
      categoryValue === "Gas"
    ) {
      form.setValue(
        "expenseItem",
        "Gas Bill"
      );
    } else if (
      categoryValue === "Wi-Fi"
    ) {
      form.setValue(
        "expenseItem",
        "Wi-Fi Bill"
      );
    } else if (
      !isFoodCategory &&
      categoryValue !== "Other"
    ) {
      form.setValue(
        "expenseItem",
        ""
      );
    }

    if (!isFoodCategory) {
      setIsShoppingDialogOpen(false);
      setShoppingPromptHandled(false);
    }
  }, [
    categoryValue,
    form,
    isFoodCategory,
  ]);

  /*
   * Food category select করলে
   * active Shopping List থাকলে
   * dialog একবার খুলবে।
   */
  useEffect(() => {
    if (
      isFoodCategory &&
      !isShoppingItemsLoading &&
      shoppingItems.length > 0 &&
      !shoppingPromptHandled
    ) {
      setIsShoppingDialogOpen(true);
      setShoppingPromptHandled(true);
    }
  }, [
    isFoodCategory,
    isShoppingItemsLoading,
    shoppingItems.length,
    shoppingPromptHandled,
  ]);

  const addShoppingItemToExpense = (
    shoppingItem: ShoppingItem
  ) => {
    if (
      selectedShoppingItemIds.has(
        shoppingItem.id
      )
    ) {
      return;
    }

    const isClaimedByOther =
      shoppingItem.status === "claimed" &&
      Boolean(shoppingItem.claimedBy) &&
      shoppingItem.claimedBy !==
      currentUser?.uid;

    if (isClaimedByOther) {
      toast({
        variant: "destructive",
        title: "Item already claimed",
        description: `${shoppingItem.claimedByName ||
          "Another group member"
          } will bring this item.`,
      });

      return;
    }

    append({
      name: shoppingItem.name,

      quantity:
        shoppingItem.quantity ?? 1,

      unit: normalizeShoppingUnit(
        shoppingItem.unit
      ),

      cost: 0,

      shoppingItemId:
        shoppingItem.id,

      shoppingOriginalQuantity:
        shoppingItem.quantity ?? null,
    });

    toast({
      title: "Shopping item selected",
      description: `${shoppingItem.name} was added to this expense form.`,
    });
  };

  const stopCameraStream = () => {
    if (!streamRef.current) {
      return;
    }

    streamRef.current
      .getTracks()
      .forEach((track) => {
        track.stop();
      });

    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject =
        null;
    }
  };

  useEffect(() => {
    if (!isCameraDialogOpen) {
      stopCameraStream();
    }
  }, [isCameraDialogOpen]);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const compressedFile =
        await compressImage(file);

      const nextFile = new File(
        [compressedFile],
        file.name,
        {
          type: compressedFile.type,
        }
      );

      if (imagePreview) {
        URL.revokeObjectURL(
          imagePreview
        );
      }

      setReceiptImageFile(nextFile);

      setImagePreview(
        URL.createObjectURL(
          compressedFile
        )
      );
    } catch (error) {
      console.error(
        "Image compression error:",
        error
      );

      toast({
        variant: "destructive",
        title:
          "Error compressing image.",
      });
    }
  };

  const clearImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(
        imagePreview
      );
    }

    setReceiptImageFile(null);
    setImagePreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getCameraPermission =
    async () => {
      stopCameraStream();

      try {
        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: {
                facingMode,
              },
            }
          );

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject =
            stream;
        }

        setHasCameraPermission(true);
      } catch (error) {
        console.error(
          "Error accessing camera:",
          error
        );

        setHasCameraPermission(false);

        toast({
          variant: "destructive",
          title:
            "Camera Access Denied",
          description:
            "Please enable camera permissions in your browser settings.",
        });
      }
    };

  const handleRotateCamera = () => {
    setFacingMode(
      (previousFacingMode) => {
        return previousFacingMode ===
          "user"
          ? "environment"
          : "user";
      }
    );
  };

  useEffect(() => {
    if (
      isCameraDialogOpen &&
      hasCameraPermission !== false
    ) {
      void getCameraPermission();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    facingMode,
    isCameraDialogOpen,
  ]);

  const handleCapture = async () => {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      isCapturing
    ) {
      return;
    }

    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    try {
      const context =
        canvas.getContext("2d");

      if (!context) {
        return;
      }

      context.drawImage(
        video,
        0,
        0,
        video.videoWidth,
        video.videoHeight
      );

      const blob =
        await new Promise<Blob | null>(
          (resolve) => {
            canvas.toBlob(
              resolve,
              "image/jpeg",
              0.95
            );
          }
        );

      if (!blob) {
        return;
      }

      const compressedBlob =
        await compressImage(blob);

      const file = new File(
        [compressedBlob],
        `receipt-${Date.now()}.jpg`,
        {
          type: "image/jpeg",
        }
      );

      if (imagePreview) {
        URL.revokeObjectURL(
          imagePreview
        );
      }

      setReceiptImageFile(file);

      setImagePreview(
        URL.createObjectURL(
          compressedBlob
        )
      );

      setIsCameraDialogOpen(false);
    } catch (error) {
      console.error(
        "Error processing captured image:",
        error
      );

      toast({
        variant: "destructive",
        title:
          "Could not process image.",
      });

      setIsCameraDialogOpen(false);
    } finally {
      setIsCapturing(false);
      stopCameraStream();
    }
  };

  const findMasterItemId = async (
    itemName: string
  ) => {
    if (!groupId) {
      return undefined;
    }

    const inventoryQuery = query(
      collection(
        firestore,
        `groups/${groupId}/inventory`
      ),
      where(
        "name",
        "==",
        itemName
      )
    );

    const querySnapshot =
      await getDocs(inventoryQuery);

    if (querySnapshot.empty) {
      return undefined;
    }

    return querySnapshot.docs[0].id;
  };

  const handleUndo = async (
    expenseId: string,
    purchaseIds: string[] = [],
    undoActivityId = "",
    expenseLabel = "expense",
    loggedAt = 0,
    shoppingUndoStates:
      ShoppingUndoState[] = []
  ) => {
    if (!groupId || !currentUser) {
      return;
    }

    if (!undoActivityId || Date.now() - loggedAt > UNDO_WINDOW_MS) {
      toast({
        variant: "destructive",
        title: "Undo time ended",
        description: "The expense is now final in the activity history.",
      });
      return;
    }

    const batch =
      writeBatch(firestore);

    batch.delete(
      doc(
        firestore,
        `groups/${groupId}/expenses`,
        expenseId
      )
    );

    purchaseIds.forEach(
      (purchaseId) => {
        batch.delete(
          doc(
            firestore,
            `groups/${groupId}/purchases`,
            purchaseId
          )
        );
      }
    );

    const undoActivityRef = doc(
      firestore,
      `groups/${groupId}/notifications`,
      undoActivityId
    );

    batch.set(
      undoActivityRef,
      {
        groupId,
        recordId: expenseId,
        senderId:
          currentUser.uid,
        senderName:
          currentUserName,
        targetUserId:
          currentUser.uid,
        messageText:
          `undid expense: ${expenseLabel}`,
        type:
          "expense_undo",
        createdAt:
          serverTimestamp(),
        readBy: [
          currentUser.uid,
        ],
      }
    );

    shoppingUndoStates.forEach(
      (undoState) => {
        batch.update(
          doc(
            firestore,
            "groups",
            groupId,
            "shoppingItems",
            undoState.id
          ),
          {
            quantity:
              undoState.quantity,

            unit:
              undoState.unit,

            status:
              undoState.status,

            claimedBy:
              undoState.claimedBy,

            claimedByName:
              undoState.claimedByName,

            claimedAt:
              undoState.claimedAt,

            completedBy:
              undoState.completedBy,

            completedByName:
              undoState.completedByName,

            completedAt:
              undoState.completedAt,

            linkedExpenseId:
              undoState.linkedExpenseId,

            updatedAt:
              serverTimestamp(),
          }
        );
      }
    );

    try {
      await batch.commit();

      toast({
        title: "Action Undone",
        description:
          "The expense and related records have been removed.",
      });

      if (purchaseIds.length > 0) {
        triggerUpdate();
      }
    } catch (error) {
      console.error(
        "Undo error:",
        error
      );

      toast({
        variant: "destructive",
        title: "Error Undoing",
        description:
          "Could not remove the expense.",
      });
    }
  };

  async function onSubmit(
    values: z.infer<
      typeof expenseSchema
    >
  ) {
    if (!currentUser || !groupId) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "You must be in a group to add an expense.",
      });

      return;
    }

    if (
      isUtilityCategory &&
      isUtilityReceiptRequired &&
      !receiptImageFile
    ) {
      toast({
        variant: "destructive",
        title: "Receipt Required",
        description:
          "A receipt image is required for utility bills.",
      });

      return;
    }

    try {
      let receiptUrl:
        | string
        | null = null;

      if (receiptImageFile) {
        receiptUrl =
          await uploadToCloudinary(
            receiptImageFile,
            process.env
              .NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
            process.env
              .NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
          );
      }

      const finalExpenseItem =
        values.category ===
          "Food & Groceries"
          ? values.purchasedItems
            ?.map((item) => item.name)
            .filter(Boolean)
            .join(", ") ||
          "Groceries"
          : values.expenseItem;

      const batch =
        writeBatch(firestore);

      const expenseRef = doc(
        collection(
          firestore,
          `groups/${groupId}/expenses`
        )
      );

      const notificationRef = doc(
        collection(
          firestore,
          `groups/${groupId}/notifications`
        )
      );

      const undoActivityRef = doc(
        collection(
          firestore,
          `groups/${groupId}/notifications`
        )
      );

      const storedPurchasedItems =
        values.category ===
          "Food & Groceries"
          ? (
            values.purchasedItems ?? []
          ).map((item) => {
            return sanitizeFirestoreData({
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              cost: item.cost,
              itemId: item.itemId,
              shoppingItemId:
                item.shoppingItemId,
            });
          })
          : [];

      batch.set(
        expenseRef,
        sanitizeFirestoreData({
          amount: values.amount,

          expenseItem:
            finalExpenseItem,

          category:
            values.category,

          receiptPhotoUrl:
            receiptUrl,

          userId:
            currentUser.uid,

          userName:
            currentUserName,

          date:
            Timestamp.fromDate(
              selectedDate
            ),

          createdAt:
            serverTimestamp(),

          groupId,

          createdActivityId:
            notificationRef.id,

          undoActivityId:
            undoActivityRef.id,

          purchasedItems:
            storedPurchasedItems,
        })
      );

      const purchaseIds: string[] =
        [];

      const shoppingUndoStates:
        ShoppingUndoState[] = [];

      if (
        values.category ===
        "Food & Groceries" &&
        values.purchasedItems
      ) {
        for (
          const item of
          values.purchasedItems
        ) {
          const masterItemId =
            await findMasterItemId(
              item.name
            );

          const purchaseRef = doc(
            collection(
              firestore,
              `groups/${groupId}/purchases`
            )
          );

          batch.set(
            purchaseRef,
            sanitizeFirestoreData({
              itemId:
                masterItemId,

              itemName:
                item.name,

              quantity:
                item.quantity,

              cost:
                item.cost,

              unit:
                item.unit,

              unitPrice:
                item.cost /
                item.quantity,

              date:
                Timestamp.fromDate(
                  selectedDate
                ),

              userId:
                currentUser.uid,

              userName:
                currentUserName,

              groupId,

              expenseId:
                expenseRef.id,

              shoppingItemId:
                item.shoppingItemId,
            })
          );

          purchaseIds.push(
            purchaseRef.id
          );

          if (
            !item.shoppingItemId
          ) {
            continue;
          }

          const linkedShoppingItem =
            shoppingItems.find(
              (shoppingItem) => {
                return (
                  shoppingItem.id ===
                  item.shoppingItemId
                );
              }
            );

          if (!linkedShoppingItem) {
            continue;
          }

          shoppingUndoStates.push({
            id:
              linkedShoppingItem.id,

            quantity:
              linkedShoppingItem.quantity ??
              null,

            unit:
              linkedShoppingItem.unit ??
              null,

            status:
              linkedShoppingItem.status,

            claimedBy:
              linkedShoppingItem.claimedBy ??
              null,

            claimedByName:
              linkedShoppingItem.claimedByName ??
              null,

            claimedAt:
              linkedShoppingItem.claimedAt ??
              null,

            completedBy:
              linkedShoppingItem.completedBy ??
              null,

            completedByName:
              linkedShoppingItem.completedByName ??
              null,

            completedAt:
              linkedShoppingItem.completedAt ??
              null,

            linkedExpenseId:
              linkedShoppingItem.linkedExpenseId ??
              null,
          });

          const shoppingItemRef = doc(
            firestore,
            "groups",
            groupId,
            "shoppingItems",
            linkedShoppingItem.id
          );

          const availableQuantityValue =
            linkedShoppingItem.quantity ??
            item.shoppingOriginalQuantity ??
            null;

          const availableQuantity =
            availableQuantityValue ===
              null ||
              availableQuantityValue ===
              undefined
              ? null
              : Number(
                availableQuantityValue
              );

          const purchasedQuantity =
            Number(item.quantity);

          const hasValidQuantities =
            availableQuantity !== null &&
            Number.isFinite(
              availableQuantity
            ) &&
            Number.isFinite(
              purchasedQuantity
            ) &&
            purchasedQuantity > 0;

          const remainingQuantity =
            hasValidQuantities
              ? Number(
                (
                  availableQuantity -
                  purchasedQuantity
                ).toFixed(3)
              )
              : 0;

          /*
           * Partial purchase হলে item active থাকবে।
           */
          if (
            hasValidQuantities &&
            remainingQuantity > 0.0001
          ) {
            batch.update(
              shoppingItemRef,
              {
                quantity:
                  remainingQuantity,

                status:
                  linkedShoppingItem.status ===
                    "claimed"
                    ? "claimed"
                    : "needed",

                claimedBy:
                  linkedShoppingItem.claimedBy ??
                  null,

                claimedByName:
                  linkedShoppingItem.claimedByName ??
                  null,

                claimedAt:
                  linkedShoppingItem.claimedAt ??
                  null,

                completedBy: null,

                completedByName:
                  null,

                completedAt: null,

                linkedExpenseId:
                  null,

                updatedAt:
                  serverTimestamp(),
              }
            );
          } else {
            /*
             * Full quantity কেনা হলে completed।
             */
            batch.update(
              shoppingItemRef,
              {
                quantity: 0,

                status: "completed",

                claimedBy: null,

                claimedByName:
                  null,

                claimedAt: null,

                completedBy:
                  currentUser.uid,

                completedByName:
                  currentUserName,

                completedAt:
                  serverTimestamp(),

                linkedExpenseId:
                  expenseRef.id,

                updatedAt:
                  serverTimestamp(),
              }
            );
          }
        }
      }

      const notificationMessage =
        `added a new expense: ${finalExpenseItem} – ৳${values.amount}`;

      batch.set(
        notificationRef,
        {
          groupId,

          recordId:
            expenseRef.id,

          senderId:
            currentUser.uid,

          senderName:
            currentUserName,

          targetUserId:
            currentUser.uid,

          messageText:
            notificationMessage,

          type: "expense",

          createdAt:
            serverTimestamp(),

          readBy: [
            currentUser.uid,
          ],
        }
      );

      await batch.commit();

      const loggedAt = Date.now();

      toast({
        title: "Expense Added",

        description:
          `Your ${values.category.toLowerCase()} expense of ৳${values.amount} has been logged.`,

        duration:
          UNDO_WINDOW_MS,

        action: (
          <ToastAction
            altText="Undo"
            onClick={() => {
              void handleUndo(
                expenseRef.id,
                purchaseIds,
                undoActivityRef.id,
                finalExpenseItem,
                loggedAt,
                shoppingUndoStates
              );
            }}
          >
            Undo
          </ToastAction>
        ),
      });

      if (
        values.category ===
        "Food & Groceries"
      ) {
        triggerUpdate();
      }

      form.reset({
        amount:
          "" as unknown as number,

        expenseItem: "",

        category:
          undefined,

        purchasedItems: [],
      });

      setShoppingPromptHandled(false);
      setIsShoppingDialogOpen(false);

      clearImage();
    } catch (error) {
      console.error(
        "Error adding expense:",
        error
      );

      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Could not log expense. Please check permissions and try again.",
      });
    }
  }

  if (
    isGroupDataLoading &&
    groupId
  ) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart />
            Add an Expense
          </CardTitle>

          <CardDescription>
            Loading group settings...
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart />
            Add an Expense
          </CardTitle>

          <CardDescription>
            Log a personal expense for your group.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(
                onSubmit
              )}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Category
                    </FormLabel>

                    <Select
                      onValueChange={(
                        value
                      ) => {
                        field.onChange(
                          value
                        );

                        if (
                          value ===
                          "Food & Groceries"
                        ) {
                          setShoppingPromptHandled(
                            false
                          );
                        }
                      }}
                      value={field.value}
                      disabled={
                        form.formState
                          .isSubmitting
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an expense category" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        <SelectItem value="Food & Groceries">
                          Food & Groceries
                        </SelectItem>

                        <SelectItem value="Electricity">
                          Electricity
                        </SelectItem>

                        <SelectItem value="Gas">
                          Gas
                        </SelectItem>

                        <SelectItem value="Wi-Fi">
                          Wi-Fi
                        </SelectItem>

                        <SelectItem value="Other">
                          Other
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isFoodCategory
                        ? "Total Amount — Auto Calculated (৳)"
                        : "Total Amount (৳)"}
                    </FormLabel>

                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="0"
                        name={field.name}
                        ref={field.ref}
                        onBlur={
                          field.onBlur
                        }
                        value={
                          field.value ?? ""
                        }
                        onChange={(
                          event
                        ) => {
                          if (
                            isFoodCategory
                          ) {
                            return;
                          }

                          const digitsOnly =
                            getDigitsOnly(
                              event.target
                                .value
                            );

                          field.onChange(
                            digitsOnly === ""
                              ? ""
                              : Number(
                                digitsOnly
                              )
                          );
                        }}
                        readOnly={
                          isFoodCategory
                        }
                        disabled={
                          form.formState
                            .isSubmitting
                        }
                        className={
                          isFoodCategory
                            ? "cursor-not-allowed bg-muted font-semibold"
                            : undefined
                        }
                      />
                    </FormControl>

                    {isFoodCategory && (
                      <p className="text-xs text-muted-foreground">
                        The total updates automatically as item costs are entered.
                      </p>
                    )}

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expenseItem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Expense Item
                    </FormLabel>

                    <FormControl>
                      <Input
                        placeholder={
                          categoryValue ===
                            "Other"
                            ? "e.g., Kitchen repair"
                            : "Auto-generated for other categories"
                        }
                        {...field}
                        value={
                          field.value ?? ""
                        }
                        disabled={
                          categoryValue !==
                          "Other" ||
                          form.formState
                            .isSubmitting
                        }
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {isFoodCategory && (
                <div className="space-y-4 rounded-md border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="font-medium">
                        Log Purchased Items
                      </h4>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Select from the shared Shopping List or add a custom item.
                      </p>
                    </div>

                    {shoppingItems.length >
                      0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => {
                            setShoppingPromptHandled(
                              true
                            );

                            setIsShoppingDialogOpen(
                              true
                            );
                          }}
                          disabled={
                            form.formState
                              .isSubmitting
                          }
                        >
                          <ShoppingBasket className="h-4 w-4" />
                          Shopping List
                        </Button>
                      )}
                  </div>

                  {shoppingListError && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />

                      <AlertTitle>
                        Shopping List unavailable
                      </AlertTitle>

                      <AlertDescription>
                        {shoppingListError}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="hidden grid-cols-12 items-start gap-2 border-t pt-3 sm:grid">
                    <div className="col-span-5">
                      <FormLabel>
                        Item Name
                      </FormLabel>
                    </div>

                    <div className="col-span-2">
                      <FormLabel>
                        Qty
                      </FormLabel>
                    </div>

                    <div className="col-span-2">
                      <FormLabel>
                        Unit
                      </FormLabel>
                    </div>

                    <div className="col-span-2">
                      <FormLabel>
                        Cost (৳)
                      </FormLabel>
                    </div>

                    <div className="col-span-1" />
                  </div>

                  {fields.map(
                    (
                      purchasedItemField,
                      index
                    ) => (
                      <div
                        key={
                          purchasedItemField.id
                        }
                        className="grid grid-cols-12 items-start gap-2 rounded-md border p-2 sm:border-0 sm:p-0"
                      >
                        <FormField
                          control={
                            form.control
                          }
                          name={`purchasedItems.${index}.name`}
                          render={({
                            field,
                          }) => (
                            <FormItem className="col-span-12 sm:col-span-5">
                              <FormLabel className="sm:hidden">
                                Item Name
                              </FormLabel>

                              <FormControl>
                                <Input
                                  placeholder="e.g. Rice"
                                  {...field}
                                  disabled={
                                    form
                                      .formState
                                      .isSubmitting
                                  }
                                />
                              </FormControl>

                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={
                            form.control
                          }
                          name={`purchasedItems.${index}.quantity`}
                          render={({
                            field,
                          }) => (
                            <FormItem className="col-span-4 sm:col-span-2">
                              <FormLabel className="sm:hidden">
                                Qty
                              </FormLabel>

                              <FormControl>
                                <Input
                                  type="number"
                                  min="0.1"
                                  step="0.1"
                                  placeholder="1"
                                  {...field}
                                  value={
                                    field.value ??
                                    ""
                                  }
                                  disabled={
                                    form
                                      .formState
                                      .isSubmitting
                                  }
                                />
                              </FormControl>

                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={
                            form.control
                          }
                          name={`purchasedItems.${index}.unit`}
                          render={({
                            field,
                          }) => (
                            <FormItem className="col-span-4 sm:col-span-2">
                              <FormLabel className="sm:hidden">
                                Unit
                              </FormLabel>

                              <Select
                                onValueChange={
                                  field.onChange
                                }
                                value={
                                  field.value
                                }
                                disabled={
                                  form
                                    .formState
                                    .isSubmitting
                                }
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Unit" />
                                  </SelectTrigger>
                                </FormControl>

                                <SelectContent>
                                  {COMMON_UNITS.map(
                                    (unit) => (
                                      <SelectItem
                                        key={unit}
                                        value={unit}
                                      >
                                        {unit}
                                      </SelectItem>
                                    )
                                  )}
                                </SelectContent>
                              </Select>

                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={
                            form.control
                          }
                          name={`purchasedItems.${index}.cost`}
                          render={({
                            field,
                          }) => (
                            <FormItem className="col-span-4 sm:col-span-2">
                              <FormLabel className="sm:hidden">
                                Cost (৳)
                              </FormLabel>

                              <FormControl>
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  placeholder="0"
                                  name={
                                    field.name
                                  }
                                  ref={
                                    field.ref
                                  }
                                  onBlur={
                                    field.onBlur
                                  }
                                  value={
                                    field.value ??
                                    ""
                                  }
                                  onChange={(
                                    event
                                  ) => {
                                    const digitsOnly =
                                      getDigitsOnly(
                                        event
                                          .target
                                          .value
                                      );

                                    field.onChange(
                                      digitsOnly ===
                                        ""
                                        ? ""
                                        : Number(
                                          digitsOnly
                                        )
                                    );
                                  }}
                                  disabled={
                                    form
                                      .formState
                                      .isSubmitting
                                  }
                                />
                              </FormControl>

                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="col-span-12 flex h-10 items-center justify-end sm:col-span-1 sm:justify-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              remove(index);
                            }}
                            disabled={
                              form.formState
                                .isSubmitting
                            }
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />

                            <span className="sr-only">
                              Remove Item
                            </span>
                          </Button>
                        </div>

                        {purchasedItemField.shoppingItemId && (
                          <div className="col-span-12">
                            <Badge
                              variant="secondary"
                              className="gap-1"
                            >
                              <ShoppingBasket className="h-3 w-3" />
                              Linked to Shopping List
                            </Badge>
                          </div>
                        )}
                      </div>
                    )
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      append({
                        name: "",
                        quantity: 1,
                        unit: "",
                        cost: 0,
                      });
                    }}
                    disabled={
                      form.formState
                        .isSubmitting
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Custom Item
                  </Button>
                </div>
              )}

              {isUtilityCategory && (
                <FormItem>
                  <FormLabel>
                    Receipt{" "}
                    {isUtilityReceiptRequired
                      ? ""
                      : "(Optional)"}
                  </FormLabel>

                  {imagePreview ? (
                    <div className="relative h-24 w-24">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Receipt preview"
                        className="h-full w-full rounded-md border object-cover"
                      />

                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                        onClick={
                          clearImage
                        }
                        disabled={
                          form.formState
                            .isSubmitting
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Dialog
                        open={
                          isCameraDialogOpen
                        }
                        onOpenChange={
                          setIsCameraDialogOpen
                        }
                      >
                        <DialogTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            disabled={
                              form.formState
                                .isSubmitting
                            }
                          >
                            <Camera className="mr-2" />
                            Take Photo
                          </Button>
                        </DialogTrigger>

                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              Take a Photo
                            </DialogTitle>

                            <DialogDescription>
                              Center the receipt in the frame and click capture.
                            </DialogDescription>
                          </DialogHeader>

                          <div className="relative py-4">
                            <video
                              ref={videoRef}
                              className="aspect-video w-full rounded-md bg-muted"
                              autoPlay
                              playsInline
                              muted
                            />

                            <canvas
                              ref={canvasRef}
                              className="hidden"
                            />

                            {hasCameraPermission ===
                              false && (
                                <Alert
                                  variant="destructive"
                                  className="mt-4"
                                >
                                  <AlertTitle>
                                    Camera Access Denied
                                  </AlertTitle>

                                  <AlertDescription>
                                    Please enable camera permissions in your browser settings.
                                  </AlertDescription>
                                </Alert>
                              )}

                            {hasCameraPermission && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={
                                  handleRotateCamera
                                }
                                className="absolute bottom-2 right-2 rounded-full"
                                disabled={
                                  isCapturing
                                }
                              >
                                <RefreshCw className="h-5 w-5" />

                                <span className="sr-only">
                                  Rotate Camera
                                </span>
                              </Button>
                            )}
                          </div>

                          <Button
                            type="button"
                            onClick={() => {
                              void handleCapture();
                            }}
                            disabled={
                              !hasCameraPermission ||
                              isCapturing
                            }
                          >
                            {isCapturing && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}

                            Capture
                          </Button>
                        </DialogContent>
                      </Dialog>

                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          fileInputRef.current?.click();
                        }}
                        disabled={
                          form.formState
                            .isSubmitting
                        }
                      >
                        <Upload className="mr-2" />
                        Upload
                      </Button>

                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={
                            handleFileChange
                          }
                          disabled={
                            form.formState
                              .isSubmitting
                          }
                        />
                      </FormControl>
                    </div>
                  )}

                  <FormMessage />
                </FormItem>
              )}

              <Button
                type="submit"
                disabled={
                  form.formState
                    .isSubmitting
                }
                className="w-full"
              >
                {form.formState
                  .isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}

                Add Expense
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Dialog
        open={isShoppingDialogOpen}
        onOpenChange={(open) => {
          setIsShoppingDialogOpen(
            open
          );

          if (!open) {
            setShoppingPromptHandled(
              true
            );
          }
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBasket className="h-5 w-5" />
              Choose from Shopping List
            </DialogTitle>

            <DialogDescription>
              Select items that you purchased. Name, quantity and unit will be added automatically. You can edit the quantity afterwards.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {isShoppingItemsLoading && (
              <>
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </>
            )}

            {!isShoppingItemsLoading &&
              shoppingItems.length ===
              0 && (
                <Alert>
                  <ShoppingBasket className="h-4 w-4" />

                  <AlertTitle>
                    Shopping List is empty
                  </AlertTitle>

                  <AlertDescription>
                    Continue with the form and add a custom purchased item.
                  </AlertDescription>
                </Alert>
              )}

            {!isShoppingItemsLoading &&
              shoppingItems.map(
                (shoppingItem) => {
                  const isAdded =
                    selectedShoppingItemIds.has(
                      shoppingItem.id
                    );

                  const isClaimedByCurrentUser =
                    shoppingItem.status ===
                    "claimed" &&
                    shoppingItem.claimedBy ===
                    currentUser?.uid;

                  const isClaimedByOther =
                    shoppingItem.status ===
                    "claimed" &&
                    Boolean(
                      shoppingItem.claimedBy
                    ) &&
                    shoppingItem.claimedBy !==
                    currentUser?.uid;

                  return (
                    <div
                      key={shoppingItem.id}
                      className="rounded-lg border p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="break-words font-semibold">
                              {shoppingItem.name}
                            </p>

                            {shoppingItem.priority ===
                              "urgent" && (
                                <Badge variant="destructive">
                                  Urgent
                                </Badge>
                              )}

                            {isClaimedByCurrentUser && (
                              <Badge
                                variant="secondary"
                                className="gap-1"
                              >
                                <UserCheck className="h-3 w-3" />
                                You claimed this
                              </Badge>
                            )}

                            {isClaimedByOther && (
                              <Badge
                                variant="outline"
                                className="gap-1"
                              >
                                <UserCheck className="h-3 w-3" />
                                Claimed
                              </Badge>
                            )}
                          </div>

                          <p className="mt-1 text-sm text-muted-foreground">
                            {shoppingItem.quantity !==
                              null &&
                              shoppingItem.quantity !==
                              undefined
                              ? `${shoppingItem.quantity} ${shoppingItem.unit ||
                              ""
                              }`
                              : "Quantity not specified"}
                          </p>

                          {shoppingItem.note && (
                            <p className="mt-1 break-words text-xs text-muted-foreground">
                              {shoppingItem.note}
                            </p>
                          )}

                          {isClaimedByOther && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              {shoppingItem.claimedByName ||
                                "Another group member"}{" "}
                              will bring this item.
                            </p>
                          )}
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          variant={
                            isAdded
                              ? "secondary"
                              : "default"
                          }
                          disabled={
                            isAdded ||
                            isClaimedByOther ||
                            form.formState
                              .isSubmitting
                          }
                          onClick={() => {
                            addShoppingItemToExpense(
                              shoppingItem
                            );
                          }}
                          className="shrink-0 gap-2"
                        >
                          {isAdded ? (
                            <>
                              <Check className="h-4 w-4" />
                              Added
                            </>
                          ) : isClaimedByOther ? (
                            "Already claimed"
                          ) : (
                            <>
                              <Plus className="h-4 w-4" />
                              Add to expense
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                }
              )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsShoppingDialogOpen(
                  false
                );
              }}
            >
              Continue with form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
