"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  type ConfirmationResult,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  type Firestore,
} from "firebase/firestore";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

import { auth, firestore } from "@/firebase/config";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { GoogleIcon } from "../icons/google";
import { AuthCard } from "./auth-card";
import { AppBrandLoader } from "@/components/app/AppBrandLoader";

const emailSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const phoneSchema = z.object({
  phone: z.string().min(10, "Please enter a valid phone number."),
  otp: z.string().optional(),
});

type EmailFormValues = z.infer<typeof emailSchema>;
type PhoneFormValues = z.infer<typeof phoneSchema>;

const createUserDocument = async (db: Firestore, user: User) => {
  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    await setDoc(userDocRef, {
      id: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split("@")[0],
      photoURL: user.photoURL,
      groupId: null,
      isAdmin: false,
    });
  }
};

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [userForVerification, setUserForVerification] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const [isOtpSent, setIsOtpSent] = useState(false);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: "",
      otp: "",
    },
  });

  useEffect(() => {
    const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
    });

    recaptchaVerifierRef.current = verifier;

    return () => {
      verifier.clear();
      recaptchaVerifierRef.current = null;
    };
  }, []);

  async function onEmailSubmit(values: EmailFormValues) {
    setIsSubmitting(true);
    setNeedsVerification(false);
    setUserForVerification(null);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );

      if (!userCredential.user.emailVerified) {
        setUserForVerification(userCredential.user);
        setNeedsVerification(true);

        await signOut(auth);
        return;
      }

      toast({
        title: "Login successful",
        description: "Welcome back to BachelorBite.",
      });

      setIsRedirecting(true);
      router.replace("/dashboard");
      router.refresh();
    } catch (error: any) {
      let description = "An unexpected error occurred. Please try again.";

      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        description =
          "Invalid email or password. Please check your credentials and try again.";
      }

      console.error("Email login error:", error);

      toast({
        variant: "destructive",
        title: "Login Failed",
        description,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleSendOtp = async () => {
    const isPhoneValid = await phoneForm.trigger("phone");

    if (!isPhoneValid) {
      return;
    }

    const verifier = recaptchaVerifierRef.current;

    if (!verifier) {
      toast({
        variant: "destructive",
        title: "Verification unavailable",
        description: "Please reload the page and try again.",
      });
      return;
    }

    const phone = phoneForm.getValues("phone").trim();

    setIsSubmitting(true);

    try {
      const result = await signInWithPhoneNumber(auth, `+${phone}`, verifier);
      setConfirmationResult(result);
      setIsOtpSent(true);

      toast({
        title: "OTP Sent!",
        description: "Check your phone for the verification code.",
      });
    } catch (error) {
      console.error("Phone login error:", error);

      toast({
        variant: "destructive",
        title: "Failed to send OTP",
        description: "Please check the phone number and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otp = phoneForm.getValues("otp")?.trim();

    if (!otp) {
      phoneForm.setError("otp", { message: "OTP is required." });
      return;
    }

    if (!confirmationResult) {
      return;
    }

    setIsSubmitting(true);

    try {
      await confirmationResult.confirm(otp);

      toast({
        title: "Success!",
        description: "You have been logged in.",
      });

      setIsRedirecting(true);
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("OTP verification error:", error);

      toast({
        variant: "destructive",
        title: "Invalid OTP",
        description: "The code you entered is incorrect.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      await createUserDocument(firestore, result.user);

      toast({
        title: "Success!",
        description: "Signed in with Google successfully.",
      });

      setIsRedirecting(true);
      router.replace("/dashboard");
      router.refresh();
    } catch (error: any) {
      if (error.code === "auth/popup-closed-by-user") {
        return;
      }

      let errorMessage = "Could not sign in with Google. Please try again.";

      if (error.code === "auth/popup-blocked") {
        errorMessage = "Popup was blocked. Please allow popups for this site.";
      }

      toast({
        variant: "destructive",
        title: "Google Sign-In Failed",
        description: errorMessage,
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!userForVerification) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not find user session. Please try logging in again.",
      });
      return;
    }

    try {
      await sendEmailVerification(userForVerification);

      toast({
        title: "Verification Email Sent",
        description:
          "A new verification link has been sent to your email address. Please check your inbox.",
      });
    } catch (error) {
      console.error("Verification email error:", error);

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
    const email = emailForm.getValues("email").trim();

    if (!email) {
      emailForm.setError("email", {
        type: "manual",
        message: "Please enter your email to reset your password.",
      });
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

      if (error.code === "auth/user-not-found") {
        description = "No account found with this email address.";
      }

      toast({
        variant: "destructive",
        title: "Reset Failed",
        description,
      });
    }
  };

  if (isRedirecting) {
    return (
      <AppBrandLoader label="Preparing your dashboard…" />
    );
  }

  return (
    <AuthCard
      title="Welcome Back"
      description="Log in to your BachelorBite account"
      footerText="Don't have an account?"
      footerLinkText="Sign Up"
      footerLinkHref="/signup"
    >
      <div id="recaptcha-container" />

      <div className="space-y-4">
        {needsVerification && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Email Not Verified</AlertTitle>
            <AlertDescription>
              You must verify your email before logging in. Check your inbox for
              the verification link.
              <Button
                type="button"
                variant="link"
                className="ml-1 h-auto p-0 font-bold text-destructive"
                onClick={handleResendVerification}
              >
                Resend link
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting || isGoogleLoading}
        >
          {isGoogleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon className="mr-2 h-4 w-4" />
          )}
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
            <Form {...emailForm}>
              <form
                onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                className="space-y-4 pt-4"
              >
                <FormField
                  control={emailForm.control}
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
                  control={emailForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto px-0 text-xs"
                          onClick={handlePasswordReset}
                        >
                          Forgot password?
                        </Button>
                      </div>

                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((value) => !value)}
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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || isGoogleLoading}
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Log In
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="phone">
            <Form {...phoneForm}>
              <form className="space-y-4 pt-4">
                {!isOtpSent ? (
                  <FormField
                    control={phoneForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <span className="flex h-10 items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm">
                              +
                            </span>
                            <Input
                              placeholder="1234567890"
                              {...field}
                              className="rounded-l-none"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={phoneForm.control}
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
                  type="button"
                  onClick={isOtpSent ? handleVerifyOtp : handleSendOtp}
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isOtpSent ? "Verify OTP" : "Send OTP"}
                </Button>

                {isOtpSent && (
                  <Button
                    type="button"
                    variant="link"
                    className="text-xs"
                    onClick={() => {
                      setIsOtpSent(false);
                      setConfirmationResult(null);
                      phoneForm.setValue("otp", "");
                    }}
                  >
                    Back to phone number
                  </Button>
                )}
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </div>
    </AuthCard>
  );
}