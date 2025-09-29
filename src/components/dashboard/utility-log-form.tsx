
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
import { useFirebase, useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Loader2, Zap, Flame, Camera, Video, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useState, useEffect, useRef } from "react";
import type { ExpenseCategory } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import Image from "next/image";

const utilityExpenseSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
  category: z.enum(["Electricity", "Gas"]),
  receiptPhotoUrl: z.string().optional(),
});

interface UtilityLogFormProps {
  selectedDate: Date;
}

export function UtilityLogForm({ selectedDate }: UtilityLogFormProps) {
  const { firestore } = useFirebase();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const form = useForm<z.infer<typeof utilityExpenseSchema>>({
    resolver: zodResolver(utilityExpenseSchema),
    defaultValues: {
      amount: 0,
      category: "Electricity",
    },
  });

  const { isSubmitting } = form.formState;

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!("mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices)) {
          return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setHasCameraPermission(false);
      }
    };
    getCameraPermission();
  }, []);

  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/png');
        setCapturedImage(dataUrl);
        form.setValue('receiptPhotoUrl', dataUrl); // We'll handle upload later
        setIsCameraOpen(false);
      }
    }
  };
  
  const onSubmit = async (values: z.infer<typeof utilityExpenseSchema>) => {
    if (!currentUser?.uid) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to log an expense." });
      return;
    }

    try {
      const userDoc = await (await import("firebase/firestore")).getDoc(
        (await import("firebase/firestore")).doc(firestore, "users", currentUser.uid)
      );
      const groupId = userDoc.data()?.groupId;
      const userName = userDoc.data()?.displayName || currentUser.email?.split('@')[0];

      if (!groupId) {
        toast({ variant: "destructive", title: "Error", description: "You must be in a group to log an expense." });
        return;
      }

      await addDoc(collection(firestore, `groups/${groupId}/expenses`), {
        ...values,
        date: selectedDate,
        userId: currentUser.uid,
        userName,
        createdAt: serverTimestamp(),
      });

      toast({ title: "Success", description: "Utility expense logged successfully!" });
      form.reset();
      setCapturedImage(null);
    } catch (error) {
      console.error("Error logging expense:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not log expense. Please try again." });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Utility Expense</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (৳)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Electricity">
                          <div className="flex items-center gap-2">
                            <Zap /> Electricity
                          </div>
                        </SelectItem>
                        <SelectItem value="Gas">
                          <div className="flex items-center gap-2">
                            <Flame /> Gas
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {capturedImage && (
                <div className="space-y-2">
                    <FormLabel>Receipt Preview</FormLabel>
                    <div className="relative aspect-video w-full">
                        <Image src={capturedImage} alt="Receipt preview" layout="fill" objectFit="contain" className="rounded-md border"/>
                    </div>
                </div>
            )}
            
            {isCameraOpen ? (
                 <div className="space-y-2">
                    <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay playsInline muted />
                    <Button onClick={handleTakePhoto} className="w-full">
                        <Camera className="mr-2 h-4 w-4" />
                        Capture
                    </Button>
                 </div>
            ) : (
                <Button variant="outline" onClick={() => setIsCameraOpen(true)} className="w-full" disabled={!hasCameraPermission}>
                    <Camera className="mr-2 h-4 w-4" />
                    {capturedImage ? "Retake Receipt Photo" : "Take Receipt Photo"}
                </Button>
            )}

            {!hasCameraPermission && (
                <Alert variant="default" className="bg-yellow-50 border-yellow-200 text-yellow-800">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <AlertTitle>Camera Access Recommended</AlertTitle>
                    <AlertDescription>
                        To upload receipts, please allow camera access in your browser settings.
                    </AlertDescription>
                </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log Utility Expense
            </Button>
          </form>
        </Form>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </CardContent>
    </Card>
  );
}
