
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { useFirebase, useUser, useDoc, useCollection } from "@/firebase";
import { doc, addDoc, collection, serverTimestamp, Timestamp, writeBatch, query, getDocs, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShoppingCart, Camera, Upload, X, Plus, Trash2, AlertCircle } from "lucide-react";
import { sanitizeFirestoreData } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import imageCompression from "browser-image-compression";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";
import type { FoodItem, PurchasedItem } from "@/lib/types";
import { useInventory } from "@/contexts/InventoryContext";

interface AddExpenseCardProps {
  selectedDate: Date;
}

const purchasedItemSchema = z.object({
  name: z.string().min(1, "Item name is required."),
  quantity: z.coerce.number().min(0.1, "Quantity is required."),
  unit: z.string().min(1, "Unit is required."),
  cost: z.coerce.number().min(0.01, "Cost is required."),
  itemId: z.string().optional(), // To link to master FoodItem
});


export function AddExpenseCard({ selectedDate }: AddExpenseCardProps) {
  const { firestore, storage } = useFirebase();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { triggerUpdate } = useInventory();


  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showInventoryFields, setShowInventoryFields] = useState(false);


  const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData } = useDoc(currentUserRef);
  const groupId = currentUserData?.groupId;

  const groupRef = useMemo(() => (groupId ? doc(firestore, "groups", groupId) : null), [firestore, groupId]);
  const { data: groupData, isLoading: isGroupDataLoading } = useDoc(groupRef);

  const isUtilityReceiptRequired = useMemo(() => groupData?.settings?.isUtilityReceiptRequired ?? false, [groupData]);

  const expenseSchema = useMemo(() => {
    return z.object({
        amount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
        expenseItem: z.string().optional(),
        category: z.enum(["Food & Groceries", "Electricity", "Gas", "Other"], {
            required_error: "Please select a category.",
        }),
        receipt: z.instanceof(File).optional(),
        purchasedItems: z.array(purchasedItemSchema).optional(),
    }).refine(data => { // Receipt validation for utilities
        if((data.category === 'Electricity' || data.category === 'Gas') && isUtilityReceiptRequired) {
            return !!data.receipt;
        }
        return true;
    }, {
        message: "A receipt is required for utility expenses.",
        path: ['receipt'],
    }).refine(data => { // Food & Groceries amount validation
        if (data.category === 'Food & Groceries' && data.purchasedItems && data.purchasedItems.length > 0) {
            const itemsTotal = data.purchasedItems.reduce((sum, item) => sum + (item.cost || 0), 0);
            // Use a small epsilon for floating point comparison
            return Math.abs(itemsTotal - data.amount) < 0.01;
        }
        return true;
    }, {
        message: "The total cost of items must match the expense amount.",
        path: ['amount'],
    }).refine(data => { // Other category expenseItem validation
      if(data.category === 'Other') {
        return !!data.expenseItem && data.expenseItem.length > 0;
      }
      return true;
    }, {
      message: "Expense Item is required for 'Other' category.",
      path: ['expenseItem']
    });
  }, [isUtilityReceiptRequired]);

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: '' as unknown as number,
      expenseItem: "",
      purchasedItems: [],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "purchasedItems",
  });

  const categoryValue = form.watch("category");
  const purchasedItemsValue = form.watch("purchasedItems");
  const amountValue = form.watch("amount");

  const itemsTotal = useMemo(() => {
    if (!purchasedItemsValue) return 0;
    return purchasedItemsValue.reduce((acc, item) => acc + (item.cost || 0), 0);
  }, [purchasedItemsValue]);

  const remainingToLog = useMemo(() => {
      if(!amountValue) return 0;
      return Number(amountValue) - itemsTotal;
  }, [amountValue, itemsTotal])

  useEffect(() => {
    setShowReceipt(categoryValue === 'Electricity' || categoryValue === 'Gas');
    const isFood = categoryValue === 'Food & Groceries';
    setShowInventoryFields(isFood);
    
    if (!isFood) {
      form.setValue('purchasedItems', []);
      form.clearErrors('amount');
    }
  }, [categoryValue, form]);
  
  useEffect(() => {
    if (categoryValue === 'Food & Groceries') {
      const itemNames = purchasedItemsValue?.map(item => item.name).filter(Boolean).join(', ');
      if (itemNames) {
        form.setValue('expenseItem', itemNames.substring(0, 100) + (itemNames.length > 100 ? '...' : ''));
      } else {
        form.setValue('expenseItem', 'Groceries');
      }
    } else if (categoryValue === 'Electricity') {
      form.setValue('expenseItem', 'Electricity Bill');
    } else if (categoryValue === 'Gas') {
      form.setValue('expenseItem', 'Gas Bill');
    }

  }, [purchasedItemsValue, categoryValue, form]);


  useEffect(() => {
    if (!isCameraDialogOpen) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
  }, [isCameraDialogOpen]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const compressedFile = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1024 });
        form.setValue("receipt", compressedFile);
        setImagePreview(URL.createObjectURL(compressedFile));
      } catch (error) {
        toast({ variant: "destructive", title: "Error compressing image." });
      }
    }
  };

  const clearImage = () => {
      form.setValue("receipt", undefined);
      setImagePreview(null);
      if(fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  }

  const getCameraPermission = async () => {
    if(hasCameraPermission === null) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({video: true});
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
      }
    } else if (hasCameraPermission && videoRef.current && !videoRef.current.srcObject) {
        const stream = await navigator.mediaDevices.getUserMedia({video: true});
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
    }
  };
  
  const handleCapture = async () => {
      if(videoRef.current && canvasRef.current) {
          setIsCapturing(true);
          const video = videoRef.current;
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const context = canvas.getContext('2d');
          context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
          
          canvas.toBlob(async (blob) => {
              if(blob) {
                  const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                   try {
                    const compressedFile = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1024 });
                    form.setValue("receipt", compressedFile);
                    setImagePreview(URL.createObjectURL(compressedFile));
                    setIsCameraDialogOpen(false);
                  } catch (error) {
                    toast({ variant: "destructive", title: "Error compressing image." });
                  }
              }
              setIsCapturing(false);
          }, 'image/jpeg');
      }
  };

  const findMasterItemId = async (itemName: string) => {
    if (!groupId) return undefined;
    const q = query(collection(firestore, `groups/${groupId}/inventory`), where("name", "==", itemName));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        return querySnapshot.docs[0].id;
    }
    return undefined;
  };

  async function onSubmit(values: z.infer<typeof expenseSchema>) {
    if (!currentUser || !groupId) {
      toast({ variant: "destructive", title: "Error", description: "You must be in a group to add an expense." });
      return;
    }

    setIsSubmitting(true);
    let receiptUrl: string | undefined = undefined;

    try {
        const batch = writeBatch(firestore);

        if (values.receipt) {
            const storageRef = ref(storage, `receipts/${groupId}/${Date.now()}_${values.receipt.name}`);
            const snapshot = await uploadBytes(storageRef, values.receipt);
            receiptUrl = await getDownloadURL(snapshot.ref);
        }

        const expenseRef = doc(collection(firestore, `groups/${groupId}/expenses`));

        let finalExpenseItem = values.expenseItem || "";
        if(values.category === 'Food & Groceries') {
            finalExpenseItem = values.purchasedItems?.map(item => item.name).filter(Boolean).join(', ') || "Groceries";
        } else if (values.category === 'Electricity') {
            finalExpenseItem = 'Electricity Bill';
        } else if (values.category === 'Gas') {
            finalExpenseItem = 'Gas Bill';
        }


        const expenseData = sanitizeFirestoreData({
            amount: values.amount,
            expenseItem: finalExpenseItem,
            category: values.category,
            receiptPhotoUrl: receiptUrl,
            userId: currentUser.uid,
            userName: currentUser.displayName || currentUser.email?.split('@')[0],
            date: Timestamp.fromDate(selectedDate),
            createdAt: serverTimestamp(),
        });
        batch.set(expenseRef, expenseData);

        if (values.category === 'Food & Groceries' && values.purchasedItems) {
            for (const item of values.purchasedItems) {
                const purchaseRef = doc(collection(firestore, `groups/${groupId}/purchases`));
                
                const masterItemId = await findMasterItemId(item.name);

                const purchaseData = sanitizeFirestoreData({
                    itemId: masterItemId,
                    itemName: item.name,
                    quantity: item.quantity,
                    cost: item.cost,
                    unit: item.unit,
                    unitPrice: item.cost / item.quantity,
                    date: Timestamp.fromDate(selectedDate),
                    userId: currentUser.uid,
                    userName: currentUser.displayName || currentUser.email?.split('@')[0],
                    groupId,
                });
                batch.set(purchaseRef, purchaseData);
            }
        }
        
        await batch.commit();

        toast({
            title: "Expense Added",
            description: `Your ${values.category.toLowerCase()} expense of ৳${values.amount} has been logged.`,
        });

        if (values.category === 'Food & Groceries') {
            triggerUpdate(); // Notify inventory page of the update
        }

        form.reset({ amount: '' as unknown as number, expenseItem: "", category: undefined, receipt: undefined, purchasedItems: [] });
        clearImage();

    } catch (error) {
        console.error("Error adding expense:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not log expense. Please try again." });
    } finally {
        setIsSubmitting(false);
    }
  }
  
  if (isGroupDataLoading && groupId) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShoppingCart /> Add an Expense</CardTitle>
                <CardDescription>Loading group settings...</CardDescription>
            </CardHeader>
            <CardContent>
                <Skeleton className="h-48 w-full" />
            </CardContent>
        </Card>
    );
  }

  const commonUnits = ['kg', 'gm', 'L', 'ml', 'pcs', 'dozen', 'unit'];

  return (
    <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShoppingCart /> Add an Expense</CardTitle>
          <CardDescription>
            Log a personal expense for your group.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select an expense category" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="Food & Groceries">Food & Groceries</SelectItem>
                        <SelectItem value="Electricity">Electricity</SelectItem>
                        <SelectItem value="Gas">Gas</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
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
                    <FormLabel>Total Amount (৳)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="0.00" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                  control={form.control}
                  name="expenseItem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expense Item</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={categoryValue === 'Other' ? 'e.g., Kitchen repair' : 'Auto-generated for other categories'} 
                          {...field} 
                          disabled={categoryValue !== 'Other'}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {showInventoryFields && (
                  <div className="space-y-4 rounded-md border p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Log Purchased Items</h4>
                        <div className="text-sm">
                            <span className="text-muted-foreground">Remaining: </span>
                            <span className={remainingToLog === 0 ? "text-green-600 font-semibold" : "text-destructive font-semibold"}>
                                ৳{remainingToLog.toFixed(2)}
                            </span>
                        </div>
                      </div>

                      {fields.length > 0 && (
                        <div className="grid grid-cols-12 gap-2 items-start text-xs font-medium text-muted-foreground">
                            <div className="col-span-5">Item Name</div>
                            <div className="col-span-2">Qty</div>
                            <div className="col-span-2">Unit</div>
                            <div className="col-span-2">Cost (৳)</div>
                        </div>
                      )}
                      
                      {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                           <FormField
                              control={form.control}
                              name={`purchasedItems.${index}.name`}
                              render={({ field }) => (
                                <FormItem className="col-span-5">
                                  <FormControl>
                                      <Input placeholder="e.g. Rice" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`purchasedItems.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem className="col-span-2">
                                  <FormControl><Input type="number" placeholder="1" {...field}/></FormControl>
                                  <FormMessage/>
                                </FormItem>
                              )}
                            />
                             <FormField
                              control={form.control}
                              name={`purchasedItems.${index}.unit`}
                              render={({ field }) => (
                                <FormItem className="col-span-3">
                                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Unit" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {commonUnits.map(unit => (
                                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage/>
                                </FormItem>
                              )}
                            />
                             <FormField
                              control={form.control}
                              name={`purchasedItems.${index}.cost`}
                              render={({ field }) => (
                                <FormItem className="col-span-2">
                                  <FormControl><Input type="number" placeholder="0" {...field}/></FormControl>
                                  <FormMessage/>
                                </FormItem>
                              )}
                            />
                           <div className="col-span-12 sm:col-span-1 flex items-center justify-end sm:justify-center h-10 -mt-2 sm:mt-0">
                              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-8 w-8">
                                <Trash2 className="h-4 w-4 text-destructive"/>
                                <span className="sr-only">Remove Item</span>
                              </Button>
                           </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ name: "", quantity: 1, unit: "", cost: 0 })}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add Item
                      </Button>
                  </div>
                )}

                {showReceipt && (
                  <FormField
                    control={form.control}
                    name="receipt"
                    render={({ field }) => (
                      <FormItem>
                          <FormLabel>Receipt {isUtilityReceiptRequired ? '' : '(Optional)'}</FormLabel>
                           {imagePreview ? (
                            <div className="relative w-24 h-24">
                              <img src={imagePreview} alt="Receipt preview" className="w-full h-full object-cover rounded-md border"/>
                              <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={clearImage}>
                                <X className="h-4 w-4"/>
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                                <Dialog open={isCameraDialogOpen} onOpenChange={setIsCameraDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button type="button" variant="outline" className="flex-1" onClick={getCameraPermission}>
                                            <Camera className="mr-2"/> Take Photo
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Take a Photo</DialogTitle>
                                            <DialogDescription>Center the receipt in the frame and click capture.</DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4">
                                            <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay playsInline muted />
                                            <canvas ref={canvasRef} className="hidden" />
                                            {hasCameraPermission === false && (
                                                <Alert variant="destructive" className="mt-4">
                                                    <AlertTitle>Camera Access Denied</AlertTitle>
                                                    <AlertDescription>Please enable camera permissions in your browser settings.</AlertDescription>
                                                </Alert>
                                            )}
                                        </div>
                                        <Button onClick={handleCapture} disabled={!hasCameraPermission || isCapturing}>
                                            {isCapturing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                            Capture
                                        </Button>
                                    </DialogContent>
                                </Dialog>
                                <Button type="button" variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()}>
                                    <Upload className="mr-2"/> Upload
                                </Button>
                                <FormControl>
                                    <Input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange}/>
                                </FormControl>
                            </div>
                          )}
                          <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Expense
                </Button>
            </form>
            </Form>
        </CardContent>
    </Card>
  );
}
