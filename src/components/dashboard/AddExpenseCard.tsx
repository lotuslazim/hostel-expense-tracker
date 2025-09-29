
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShoppingCart, Paperclip, X, Camera } from "lucide-react";
import imageCompression from 'browser-image-compression';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Image from "next/image";

const expenseSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
  description: z.string().optional(),
  category: z.enum(["Food & Groceries", "Electricity", "Gas", "Other"], {
    required_error: "Please select a category.",
  }),
  receipt: z.instanceof(File).optional(),
});

interface AddExpenseCardProps {
  selectedDate: Date;
}

export function AddExpenseCard({ selectedDate }: AddExpenseCardProps) {
  const { firestore, storage } = useFirebase();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);


  const currentUserRef = useMemo(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData } = useDoc(currentUserRef);
  const groupId = currentUserData?.groupId;

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      description: "",
    },
  });

  const selectedCategory = form.watch("category");

  useEffect(() => {
    if (isCameraOpen) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings.',
          });
        }
      };
      getCameraPermission();
    } else {
      // Stop camera stream when dialog is closed
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }
  }, [isCameraOpen, toast]);


  const processAndSetImage = async (file: File) => {
     try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      }
      const compressedFile = await imageCompression(file, options);
      form.setValue("receipt", compressedFile);

      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);

    } catch (error) {
      console.error('Error compressing image:', error);
      toast({
        variant: "destructive",
        title: "Image Error",
        description: "Could not process image. Please try another one.",
      });
      clearReceiptPreview();
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processAndSetImage(file);
  };
  
  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            canvas.toBlob(async (blob) => {
                if (blob) {
                    const capturedFile = new File([blob], `receipt-${Date.now()}.jpg`, { type: 'image/jpeg' });
                    await processAndSetImage(capturedFile);
                    setIsCameraOpen(false); // Close dialog on capture
                }
            }, 'image/jpeg');
        }
    }
  };


  const clearReceiptPreview = () => {
      setReceiptPreview(null);
      form.setValue("receipt", undefined);
      if(fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  }
  
  async function onSubmit(values: z.infer<typeof expenseSchema>) {
    if (!currentUser || !groupId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be in a group to add an expense.",
      });
      return;
    }

    setIsSubmitting(true);
    let receiptPhotoUrl: string | undefined = undefined;

    try {
      if (values.receipt) {
        const imageRef = ref(storage, `receipts/${groupId}/${Date.now()}_${values.receipt.name}`);
        const snapshot = await uploadBytes(imageRef, values.receipt);
        receiptPhotoUrl = await getDownloadURL(snapshot.ref);
      }
      
      const expenseData: any = {
        amount: values.amount,
        description: values.description || "",
        category: values.category,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email?.split('@')[0],
        date: selectedDate,
        createdAt: serverTimestamp(),
      };

      if (receiptPhotoUrl) {
          expenseData.receiptPhotoUrl = receiptPhotoUrl;
      }

      await addDoc(collection(firestore, `groups/${groupId}/expenses`), expenseData);

      toast({
        title: "Expense Added",
        description: `Your ${values.category.toLowerCase()} expense of ৳${values.amount} has been logged.`,
      });
      form.reset({ amount: 0, description: "", category: values.category });
      clearReceiptPreview();
    } catch (error) {
      console.error("Error adding expense:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not log expense. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
        <canvas ref={canvasRef} className="hidden"></canvas>
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
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Weekly groceries" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                {(selectedCategory === 'Electricity' || selectedCategory === 'Gas') && (
                    <FormField
                    control={form.control}
                    name="receipt"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Receipt (Optional)</FormLabel>
                        <FormControl>
                             <div className="flex items-center gap-2">
                                <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}>
                                    <Paperclip className="h-4 w-4"/>
                                    <span className="sr-only">Attach receipt</span>
                                </Button>
                                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden"/>

                                <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
                                  <DialogTrigger asChild>
                                    <Button type="button" variant="outline" size="icon">
                                      <Camera className="h-4 w-4" />
                                      <span className="sr-only">Use Camera</span>
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Capture Receipt</DialogTitle>
                                    </DialogHeader>
                                    <div className="py-4">
                                      <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
                                      {!hasCameraPermission && (
                                        <Alert variant="destructive" className="mt-4">
                                          <AlertTitle>Camera Access Required</AlertTitle>
                                          <AlertDescription>
                                            Please allow camera access to use this feature.
                                          </AlertDescription>
                                        </Alert>
                                      )}
                                    </div>
                                    <DialogFooter>
                                      <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                                      <Button onClick={handleCapture} disabled={!hasCameraPermission}>Capture Photo</Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>

                                {receiptPreview && (
                                    <div className="relative">
                                        <Image src={receiptPreview} alt="Receipt preview" width={40} height={40} className="rounded-md object-cover"/>
                                        <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 bg-black/50 hover:bg-black/75 text-white rounded-full" onClick={clearReceiptPreview}>
                                            <X className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </FormControl>
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

    