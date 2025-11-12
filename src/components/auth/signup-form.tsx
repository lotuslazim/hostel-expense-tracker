
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
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { GoogleIcon } from "../icons/google";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const emailSignupSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
});

const phoneSignupSchema = z.object({
    name: z.string().min(1, { message: "Name is required." }),
    phone: z.string().min(10, "Please enter a valid phone number."),
    otp: z.string().optional(),
});


export function SignupForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isOtpSent, setIsOtpSent] = useState(false);

  const form = useForm({
    defaultValues: { name: "", email: "", password: "", phone: "", otp: "" },
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container-signup', {
            'size': 'invisible',
            'callback': (response: any) => { }
        });
    }
  }, []);

  async function onEmailSubmit(values: z.infer<typeof emailSignupSchema>) {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: values.name });
      await sendEmailVerification(user);
      
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account before logging in.",
      });
      
      router.push('/login');
      form.reset();

    } catch (error: any) {
        let description = "An unexpected error occurred. Please try again.";
        if (error.code === 'auth/email-already-in-use') {
            description = "This email is already registered. Please log in instead.";
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
          toast({ variant: "destructive", title: "Failed to send OTP" });
      } finally {
          setIsLoading(false);
      }
  };

  const handleVerifyOtpAndSignup = async () => {
      const otp = form.getValues("otp");
      const name = form.getValues("name");
      if (!otp) {
          form.setError("otp", { message: "OTP is required." });
          return;
      }
      if (!name) {
          form.setError("name", { message: "Name is required." });
          return;
      }
      if (!confirmationResult) return;
      setIsLoading(true);
      try {
          const userCredential = await confirmationResult.confirm(otp);
          await updateProfile(userCredential.user, { displayName: name });
          toast({ title: "Success!", description: "You have been signed up." });
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
        title: "Account Created!",
        description: "You've successfully signed up with Google.",
      });
      
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        return;
      }
      
      toast({ 
        variant: "destructive", 
        title: "Google Sign-Up Failed", 
        description: error.message || "Could not complete sign up with Google. Please try again."
      });
    } finally {
        setIsGoogleLoading(false);
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
      <div id="recaptcha-container-signup"></div>
      <div className="space-y-4">
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
           {isGoogleLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
           {!isGoogleLoading && <GoogleIcon className="mr-2 h-4 w-4" />}
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
                    <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                       {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Account
                    </Button>
                  </form>
                </Form>
            </TabsContent>
             <TabsContent value="phone">
                 <Form {...form}>
                    <div className="space-y-4 pt-4">
                       <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your Name" {...field} disabled={isOtpSent} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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
                            onClick={isOtpSent ? handleVerifyOtpAndSignup : handleSendOtp}
                            className="w-full" 
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isOtpSent ? 'Verify & Sign Up' : 'Send OTP'}
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
