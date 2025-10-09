
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
import { useFirebase } from "@/firebase";
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, updateProfile, type User, sendEmailVerification } from "firebase/auth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { GoogleIcon } from "../icons/google";

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
});

export function SignupForm() {
  const router = useRouter();
  const { auth, firestore, servicesLoading } = useFirebase();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    if (servicesLoading) {
        toast({ title: "Services initializing...", description: "Please wait a moment and try again."});
        return;
    }
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: values.name });
      await createUserDocument(user, values.name);

      const actionCodeSettings = {
        url: `${window.location.origin}/login`,
        handleCodeInApp: true,
      };

      try {
        await sendEmailVerification(user, actionCodeSettings);
        toast({
          title: "Account Created!",
          description: "Please check your email to verify your account before logging in.",
        });
      } catch (emailError: any) {
        console.error("Email verification failed:", emailError.code, emailError.message);
        toast({
          variant: "destructive",
          title: "Account Created, But...",
          description: "Your account was created, but we couldn't send a verification email. Please try logging in and resending it.",
        });
      }

      router.push('/login');
      form.reset();

    } catch (error: any) {
        console.error("Error creating user:", error);
        let description = "An unexpected error occurred. Please try again.";
        if (error.code === 'auth/email-already-in-use') {
            description = "This email is already registered. Please log in instead.";
        } else if (error.code === 'auth/invalid-email') {
          description = "Please enter a valid email address.";
        } else if (error.code === 'auth/network-request-failed') {
          description = "A network error occurred. Please check your connection and try again.";
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
  
  const handleGoogleSignIn = () => {
    if (servicesLoading) {
        toast({ title: "Services initializing...", description: "Please wait a moment and try again."});
        return;
    }
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then(async (result) => {
        const user = result.user;
        await createUserDocument(user, user.displayName || user.email!.split('@')[0]);
        router.push('/dashboard');
      })
      .catch((error) => {
        if (error.code === 'auth/popup-closed-by-user') {
          return;
        }
        console.error("Error during Google sign-in:", error);
        toast({ 
          variant: "destructive", 
          title: "Google Sign-In Failed", 
          description: error.code === 'auth/popup-blocked' 
            ? "Pop-up blocked by browser. Please allow pop-ups for this site."
            : "Could not sign in with Google. Please try again."
        });
      });
  };

  return (
    <AuthCard
      title="Create an Account"
      description="Join NourishTrack and simplify your flat's finances."
      footerText="Already have an account?"
      footerLinkText="Log In"
      footerLinkHref="/login"
    >
      <div className="space-y-4">
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={servicesLoading}>
           {servicesLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-4 w-4" />}
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
                    <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading || servicesLoading}>
               {(isLoading || servicesLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>
        </Form>
      </div>
    </AuthCard>
  );
}
