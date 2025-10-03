
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
import { AuthCard } from "./auth-card";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { useAuth, useFirebase } from "@/firebase";
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, updateProfile, type User } from "firebase/auth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { doc, getDoc, writeBatch, serverTimestamp, collection } from "firebase/firestore";
import { GoogleIcon } from "../icons/google";

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
});

export function SignupForm() {
  const router = useRouter();
  const auth = useAuth();
  const { firestore } = useFirebase();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createUserDocument = async (user: User) => {
    const userDocRef = doc(firestore, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        const batch = writeBatch(firestore);
        
        // 1. Create the Solo Group
        const newGroupRef = doc(collection(firestore, "groups"));
        const groupName = `${user.displayName}'s Solo Group`;
        batch.set(newGroupRef, {
            groupName,
            invitationCode: generateInviteCode(),
            adminId: user.uid,
            createdAt: serverTimestamp(),
            settings: {
                mealTypes: ["Breakfast", "Lunch", "Dinner", "Snack"],
                isMealItemNameRequired: false,
                isExpenseDescriptionRequired: false,
                isUtilityReceiptRequired: false,
            }
        });

        // 2. Create the user document
        batch.set(userDocRef, {
            id: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            groupId: newGroupRef.id, // Assign the new group ID
            isAdmin: true, // User is admin of their own solo group
        });

        // 3. Add user to the group's members subcollection
        const memberRef = doc(firestore, `groups/${newGroupRef.id}/members`, user.uid);
        batch.set(memberRef, {
            id: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: 'admin',
            joinedAt: serverTimestamp(),
        });
        
        await batch.commit();
    }
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: values.name });
      
      // We need to use auth.currentUser to get the updated profile
      if (auth.currentUser) {
        await createUserDocument(auth.currentUser);
      }
      
      router.push('/dashboard');

    } catch (error: any) {
      console.error("Error creating user:", error);
      let description = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        description = "This email address is already in use. Please try logging in.";
      }
      toast({
        variant: "destructive",
        title: "Sign-Up Failed",
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      await createUserDocument(user);
      
      router.push('/dashboard');
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      toast({ variant: "destructive", title: "Google Sign-In Failed", description: "Could not sign in with Google. Please try again."})
    }
  };

  return (
    <AuthCard
      title="Create an Account"
      description="Join BachelorBite and simplify your flat's finances."
      footerText="Already have an account?"
      footerLinkText="Log In"
      footerLinkHref="/login"
    >
      <div className="space-y-4">
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
           <GoogleIcon className="mr-2 h-4 w-4" />
          Sign up with Google
        </Button>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
               {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>          </form>
        </Form>
      </div>
    </AuthCard>
  );
}
