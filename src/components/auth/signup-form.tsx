
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
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, updateProfile, type User, sendEmailVerification, signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
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

  const createUserDocument = async (user: User, name: string) => {
    const userDocRef = doc(firestore, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        await setDoc(userDocRef, {
            id: user.uid,
            email: user.email,
            displayName: name,
            photoURL: user.photoURL,
            groupId: null,
            isAdmin: false,
        });
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      // 1. Try to create a new user
      console.log("Attempting to create a new user...");
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      console.log("Signup successful for:", userCredential.user.email);
      const user = userCredential.user;
      
      // Update profile and create Firestore document
      await updateProfile(user, { displayName: values.name });
      await createUserDocument(user, values.name);

      // Send verification email
      await sendEmailVerification(user);
      console.log("Verification email sent.");
      
      toast({
        title: "Account Created!",
        description: "We've sent a verification link to your email. Please verify to log in.",
      });

      form.reset();

    } catch (error: any) {
      // 2. If email is already in use, try to sign in instead
      if (error.code === 'auth/email-already-in-use') {
        console.log("Email already in use. Attempting to sign in...");
        try {
          const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
           console.log("Fallback login successful for:", userCredential.user.email);
           
           if (!userCredential.user.emailVerified) {
               toast({
                   variant: "destructive",
                   title: "Login Failed",
                   description: "Your email is not verified. Please check your inbox for the verification link.",
               });
           } else {
               router.push('/dashboard');
           }
        } catch (signInError: any) {
          console.error("Fallback sign-in error:", signInError);
          let description = "An unexpected error occurred during login.";
          if (signInError.code === 'auth/wrong-password' || signInError.code === 'auth/invalid-credential') {
              description = "This email is already registered. Please enter the correct password to log in.";
          }
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: description,
          });
        }
      } else {
        // 3. Handle other signup errors
        console.error("Error creating user:", error);
        let description = "An unexpected error occurred. Please try again.";
        if (error.code === 'auth/invalid-email') {
          description = "Please enter a valid email address.";
        } else if (error.code === 'auth/network-request-failed') {
          description = "A network error occurred. Please check your connection and try again.";
        }
        toast({
          variant: "destructive",
          title: "Sign-Up Failed",
          description: description,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }
  
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      await createUserDocument(user, user.displayName || user.email!.split('@')[0]);
      
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
            </Button>
          </form>
        </Form>
      </div>
    </AuthCard>
  );
}
