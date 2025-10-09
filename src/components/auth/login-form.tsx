
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
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification } from "firebase/auth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { GoogleIcon } from "../icons/google";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { doc, getDoc, setDoc } from "firebase/firestore";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export function LoginForm() {
  const router = useRouter();
  const { auth, firestore, servicesLoading } = useFirebase();
  const [isLoading, setIsLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  const createUserDocument = async (user: any) => {
    const userDocRef = doc(firestore, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        id: user.uid,
        email: user.email,
        displayName: user.displayName,
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
    setNeedsVerification(false);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      if (!userCredential.user.emailVerified) {
        await auth.signOut();
        setNeedsVerification(true);
        setIsLoading(false);
        return;
      }
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Error signing in:", error);
      let description = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = "Invalid email or password. Please check your credentials and try again.";
      }
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: description,
      });
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
        await createUserDocument(result.user);
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
  
  const handleResendVerification = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
        toast({
          title: "Verification Email Sent",
          description: "A new verification link has been sent to your email address.",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not send verification email. Please try again later.",
        });
      }
    }
  };


  const handlePasswordReset = async () => {
    const email = form.getValues("email");
    if (!email) {
      form.setError("email", { type: "manual", message: "Please enter your email to reset your password." });
      return;
    }
    
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Password Reset Email Sent",
        description: "Check your inbox for a link to reset your password.",
      });
    } catch (error: any) {
      console.error("Error sending password reset email:", error);
      let description = "An unexpected error occurred.";
      if (error.code === 'auth/user-not-found') {
        description = "No account found with this email address.";
      }
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description,
      });
    }
  };


  return (
    <AuthCard
      title="Welcome Back"
      description="Log in to your NourishTrack account"
      footerText="Don't have an account?"
      footerLinkText="Sign Up"
      footerLinkHref="/signup"
    >
      <div className="space-y-4">
        {needsVerification && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Email Not Verified</AlertTitle>
                <AlertDescription>
                    You must verify your email before logging in. Check your inbox for the verification link.
                    <Button variant="link" className="p-0 h-auto ml-1 text-destructive font-bold" onClick={handleResendVerification}>
                        Resend link
                    </Button>
                </AlertDescription>
            </Alert>
        )}
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={servicesLoading}>
           {servicesLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-4 w-4" />}
          Sign in with Google
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                   <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 h-auto text-xs"
                      onClick={handlePasswordReset}
                    >
                      Forgot password?
                    </Button>
                  </div>
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
              Log In
            </Button>
          </form>
        </Form>
      </div>
    </AuthCard>
  );
}
