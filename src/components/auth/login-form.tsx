
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
import { auth } from "@/firebase/config";
import { 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  sendEmailVerification, 
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
  type User 
} from "firebase/auth";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, Eye, EyeOff, Phone, MessageSquare } from "lucide-react";
import { GoogleIcon } from "../icons/google";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const emailSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const phoneSchema = z.object({
    phone: z.string().min(10, "Please enter a valid phone number."),
    otp: z.string().optional(),
});

const formSchema = z.union([emailSchema, phoneSchema]);

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [userForVerification, setUserForVerification] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isOtpSent, setIsOtpSent] = useState(false);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "", phone: "", otp: "" },
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': (response: any) => {
              // reCAPTCHA solved, allow signInWithPhoneNumber.
            }
        });
    }
  }, []);

  async function onEmailSubmit(values: z.infer<typeof emailSchema>) {
    setIsLoading(true);
    setNeedsVerification(false);
    setUserForVerification(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      
      if (!userCredential.user.emailVerified) {
        setUserForVerification(userCredential.user);
        setNeedsVerification(true);
        setIsLoading(false);
        return;
      }
      
      router.push('/dashboard');

    } catch (error: any) {
      let description = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = "Invalid email or password. Please check your credentials and try again.";
      }
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: description,
      });
    } finally {
        setIsLoading(false);
    }
  }

  const handleSendOtp = async () => {
      const phone = form.getValues("phone");
      if (!phone) {
          form.setError("phone", { message: "Phone number is required." });
          return;
      }

      setIsLoading(true);
      try {
          const verifier = window.recaptchaVerifier;
          const result = await signInWithPhoneNumber(auth, `+${phone}`, verifier);
          setConfirmationResult(result);
          setIsOtpSent(true);
          toast({ title: "OTP Sent!", description: "Check your phone for the verification code." });
      } catch (error) {
          console.error(error);
          toast({ variant: "destructive", title: "Failed to send OTP", description: "Please check the phone number and try again." });
      } finally {
          setIsLoading(false);
      }
  };

  const handleVerifyOtp = async () => {
      const otp = form.getValues("otp");
      if (!otp) {
          form.setError("otp", { message: "OTP is required." });
          return;
      }
      if (!confirmationResult) return;

      setIsLoading(true);
      try {
          await confirmationResult.confirm(otp);
          toast({ title: "Success!", description: "You have been logged in." });
          router.push('/dashboard');
      } catch (error) {
          toast({ variant: "destructive", title: "Invalid OTP", description: "The code you entered is incorrect." });
      } finally {
          setIsLoading(false);
      }
  };


  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: "Success!",
        description: "Signed in with Google successfully.",
      });
      // The redirect is now handled by the onAuthStateChanged listener
      // in the FirebaseProvider, which prevents race conditions.
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        // User intentionally closed the popup, do nothing.
        return;
      }
      
      let errorMessage = "Could not sign in with Google. Please try again.";
      if (error.code === 'auth/popup-blocked') {
        errorMessage = "Popup was blocked. Please allow popups for this site.";
      }
      
      toast({ 
        variant: "destructive", 
        title: "Google Sign-In Failed", 
        description: errorMessage
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };
  
  const handleResendVerification = async () => {
    if (!userForVerification) {
        toast({ variant: "destructive", title: "Error", description: "Could not find user session. Please try logging in again."});
        return;
    }

    try {
        await sendEmailVerification(userForVerification);
        toast({
            title: "Verification Email Sent",
            description: "A new verification link has been sent to your email address. Please check your inbox.",
        });
    } catch (error) {
         toast({
          variant: "destructive",
          title: "Error",
          description: "Could not send verification email. Please try again later.",
        });
    } finally {
        await signOut(auth);
        setUserForVerification(null);
        setNeedsVerification(false);
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
      description="Log in to your BachelorBite account"
      footerText="Don't have an account?"
      footerLinkText="Sign Up"
      footerLinkHref="/signup"
    >
      <div id="recaptcha-container"></div>
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
         <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
           {isGoogleLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
           {!isGoogleLoading && <GoogleIcon className="mr-2 h-4 w-4" />}
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

        <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="phone">Phone</TabsTrigger>
            </TabsList>
            <TabsContent value="email">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onEmailSubmit)} className="space-y-4 pt-4">
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
                    <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                       {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Log In
                    </Button>
                  </form>
                </Form>
            </TabsContent>
            <TabsContent value="phone">
                 <Form {...form}>
                    <div className="space-y-4 pt-4">
                        {!isOtpSent ? (
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone Number</FormLabel>
                                        <FormControl>
                                            <div className="flex items-center gap-2">
                                                <span className="h-10 flex items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm">+</span>
                                                <Input placeholder="1234567890" {...field} className="rounded-l-none" />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ) : (
                             <FormField
                                control={form.control}
                                name="otp"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Verification Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter 6-digit code" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <Button 
                            onClick={isOtpSent ? handleVerifyOtp : handleSendOtp}
                            className="w-full" 
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isOtpSent ? 'Verify OTP' : 'Send OTP'}
                        </Button>

                         {isOtpSent && (
                            <Button variant="link" className="text-xs" onClick={() => setIsOtpSent(false)}>
                                Back to phone number
                            </Button>
                        )}
                    </div>
                </Form>
            </TabsContent>
        </Tabs>
      </div>
    </AuthCard>
  );
}
