
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
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
import { useFirebase, useUser, useDoc } from "@/firebase";
import { doc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShoppingCart, Camera, Upload, X, Paperclip } from "lucide-react";
import { sanitizeFirestoreData } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import imageCompression from "browser-image-compression";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";


interface AddExpenseCardProps {
  selectedDate: Date;
}

export function AddExpenseCard({ selectedDate }: AddExpenseCardProps) {
  const { firestore, storage } = useFirebase();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData } = useDoc(currentUserRef);
  const groupId = currentUserData?.groupId;

  const groupRef = useMemo(() => (groupId ? doc(firestore, "groups", groupId) : null), [firestore, groupId]);
  const { data: groupData, isLoading: isGroupDataLoading } = useDoc(groupRef);

  const isExpenseDescriptionRequired = useMemo(() => groupData?.settings?.isExpenseDescriptionRequired ?? false, [groupData]);
  const isUtilityReceiptRequired = useMemo(() => groupData?.settings?.isUtilityReceiptRequired ?? false, [groupData]);


  const expenseSchema = useMemo(() => {
    return z.object({
        amount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
        description: isExpenseDescriptionRequired
            ? z.string().min(1, "Description is required.")
            : z.string().optional(),
        category: z.enum(["Food & Groceries", "Electricity", "Gas", "Other"], {
            required_error: "Please select a category.",
        }),
        receipt: z.instanceof(File).optional(),
    }).refine(data => {
        if((data.category === 'Electricity' || data.category === 'Gas') && isUtilityReceiptRequired) {
            return !!data.receipt;
        }
        return true;
    }, {
        message: "A receipt is required for utility expenses.",
        path: ['receipt'],
    });
  }, [isExpenseDescriptionRequired, isUtilityReceiptRequired]);

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      description: "",
    },
  });

  const categoryValue = form.watch("category");

  useEffect(() => {
    setShowReceipt(categoryValue === 'Electricity' || categoryValue === 'Gas');
  }, [categoryValue]);
  
  useEffect(() => {
    if (!isCameraDialogOpen) {
      // Stop camera stream when dialog is closed
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

  async function onSubmit(values: z.infer<typeof expenseSchema>) {
    if (!currentUser || !groupId) {
      toast({ variant: "destructive", title: "Error", description: "You must be in a group to add an expense." });
      return;
    }

    setIsSubmitting(true);
    let receiptUrl: string | undefined = undefined;

    try {
      if (values.receipt) {
        const storageRef = ref(storage, `receipts/${groupId}/${Date.now()}_${values.receipt.name}`);
        const snapshot = await uploadBytes(storageRef, values.receipt);
        receiptUrl = await getDownloadURL(snapshot.ref);
      }

      const expenseData = sanitizeFirestoreData({
        amount: values.amount,
        description: values.description || "",
        category: values.category,
        receiptPhotoUrl: receiptUrl,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email?.split('@')[0],
        date: selectedDate,
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(firestore, `groups/${groupId}/expenses`), expenseData);

      toast({
        title: "Expense Added",
        description: `Your ${values.category.toLowerCase()} expense of ৳${values.amount} has been logged.`,
      });
      form.reset({ amount: 0, description: "", category: undefined, receipt: undefined });
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
                    <FormLabel>Amount (৳)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Description {isExpenseDescriptionRequired ? '' : '(Optional)'}</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Weekly groceries" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                
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

    