
"use client";

import type { Expense, ExpenseCategory } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Zap, Flame, Receipt, User, Loader2, Camera, Upload, Image as ImageIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useRef, useEffect } from "react";
import { useFirebase, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";

const categoryIcons: Record<ExpenseCategory, React.ReactNode> = {
  Food: <Receipt className="h-5 w-5" />,
  Electricity: <Zap className="h-5 w-5" />,
  Gas: <Flame className="h-5 w-5" />,
  Other: <Receipt className="h-5 w-5" />,
};

const availableCategories: ExpenseCategory[] = ['Food', 'Electricity', 'Gas', 'Other'];

function ReceiptUploadDialog({ receipt, setReceipt }: { receipt: string | null, setReceipt: (url: string | null) => void }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    useEffect(() => {
        if (open) {
            const getCameraPermission = async () => {
                if (hasCameraPermission === null) {
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
                            description: 'Please enable camera permissions in your browser settings to use this feature.',
                        });
                    }
                } else if(hasCameraPermission && videoRef.current && !videoRef.current.srcObject) {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                     if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                }
            };
            getCameraPermission();
        } else {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
        }
    }, [open, hasCameraPermission, toast]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                const video = videoRef.current;
                canvasRef.current.width = video.videoWidth;
                canvasRef.current.height = video.videoHeight;
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const dataUrl = canvasRef.current.toDataURL('image/jpeg');
                setReceipt(dataUrl);
                setOpen(false);
            }
        }
    };
    
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setReceipt(e.target?.result as string);
                setOpen(false);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Camera className="mr-2 h-4 w-4" />
                    {receipt ? 'Change Receipt' : 'Add Receipt'}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Upload Receipt</DialogTitle>
                    <DialogDescription>Take a photo or upload an image of your receipt.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                     <div className="bg-muted rounded-md p-4">
                        <video ref={videoRef} className="w-full aspect-video rounded-md bg-black" autoPlay muted playsInline />
                        <canvas ref={canvasRef} className="hidden" />
                         {hasCameraPermission === false && (
                            <Alert variant="destructive" className="mt-2">
                                <AlertTitle>Camera Access Required</AlertTitle>
                                <AlertDescription>Please allow camera access to use this feature.</AlertDescription>
                            </Alert>
                        )}
                    </div>
                    <Button className="w-full" onClick={handleCapture} disabled={!hasCameraPermission}>
                        <Camera className="mr-2 h-4 w-4" />
                        Take Photo
                    </Button>
                     <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                           <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or</span>
                        </div>
                    </div>
                    <Button variant="secondary" className="w-full" asChild>
                        <label htmlFor="file-upload">
                            <Upload className="mr-2 h-4 w-4" />
                            Upload from device
                            <input id="file-upload" type="file" accept="image/*" className="sr-only" onChange={handleFileUpload} />
                        </label>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function AllExpenses({ expenses, currentDate }: { expenses: Expense[]; currentDate: Date }) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory | "">("");
  const [receipt, setReceipt] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const { firestore } = useFirebase();
  const { user: currentUser } = useUser();
  const currentUserRef = useMemoFirebase(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData } = useDoc(currentUserRef);
  const groupId = currentUserData?.groupId;

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setCategory("");
    setReceipt(null);
  };

  const handleSaveExpense = async () => {
    if (!description || !amount || !category || !groupId || !currentUser) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please fill out all required fields." });
      return;
    }
    setIsSaving(true);

    const expenseData = {
      userId: currentUser.uid,
      userName: currentUser.displayName || currentUser.email?.split('@')[0],
      groupId,
      description,
      amount: parseFloat(amount),
      category,
      date: currentDate,
      receiptPhotoUrl: receipt,
      createdAt: serverTimestamp(),
    };

    try {
      const expensesCol = collection(firestore, `groups/${groupId}/expenses`);
      await addDoc(expensesCol, expenseData);
      toast({ title: "Success", description: "Expense logged successfully." });
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error("Error saving expense:", error);
      toast({ variant: "destructive", title: "Save Failed", description: "There was a problem saving your expense." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Daily Expense Log</CardTitle>
          <CardDescription>Log and view all food and utility expenses for today.</CardDescription>
        </div>
         <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
              <DialogDescription>Log a food purchase, utility bill, or other shared cost.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={(value) => setCategory(value as ExpenseCategory)}>
                    <SelectTrigger id="category">
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableCategories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" placeholder="e.g., Groceries, Electricity Bill" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" type="number" placeholder="e.g., 1200.00" value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Receipt (Optional)</Label>
                <div className="flex gap-2">
                    <div className="w-full flex items-center gap-2 p-2 border rounded-md bg-muted">
                        <ImageIcon className="h-5 w-5 text-muted-foreground"/>
                        <span className="text-sm text-muted-foreground truncate">
                           {receipt ? 'Receipt captured' : 'No receipt added'}
                        </span>
                    </div>
                    <ReceiptUploadDialog receipt={receipt} setReceipt={setReceipt}/>
                </div>
                {receipt && <Image src={receipt} alt="Receipt preview" width={100} height={100} className="rounded-md object-cover mt-2" />}
              </div>
              <Button className="w-full" onClick={handleSaveExpense} disabled={isSaving || !description || !amount || !category}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Expense
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Expense</TableHead>
              <TableHead>Paid By</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length > 0 ? expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-muted rounded-full text-muted-foreground">
                        {categoryIcons[expense.category] || <Receipt className="h-5 w-5" />}
                    </span>
                    <span>{expense.description}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    {expense.userName || 'N/A'}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">৳{expense.amount.toFixed(2)}</TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">No expenses logged for today.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
