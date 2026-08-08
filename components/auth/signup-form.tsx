"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  RecaptchaVerifier,
  sendEmailVerification,
  signInWithPhoneNumber,
  signInWithPopup,
  updateProfile,
  type ConfirmationResult,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  type Firestore,
} from "firebase/firestore";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { auth, firestore } from "@/firebase/config";
import { useToast } from "@/hooks/use-toast";
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

const emailSignupSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." }),
});

const phoneSignupSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  phone: z.string().min(10, "Please enter a valid phone number."),
  otp: z.string().optional(),
});

type EmailSignupFormValues = z.infer<typeof emailSignupSchema>;
type PhoneSignupFormValues = z.infer<typeof phoneSignupSchema>;

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

export function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const [isOtpSent, setIsOtpSent] = useState(false);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const emailForm = useForm<EmailSignupFormValues>({
    resolver: zodResolver(emailSignupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const phoneForm = useForm<PhoneSignupFormValues>({
    resolver: zodResolver(phoneSignupSchema),
    defaultValues: {
      name: "",
      phone: "",
      otp: "",
    },
  });

  useEffect(() => {
    const verifier = new RecaptchaVerifier(auth, "recaptcha-container-signup", {
      size: "invisible",
    });

    recaptchaVerifierRef.current = verifier;

    return () => {
      verifier.clear();
      recaptchaVerifierRef.current = null;
    };
  }, []);

  async function onEmailSubmit(values: EmailSignupFormValues) {
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;

      await updateProfile(user, { displayName: values.name });
      await createUserDocument(firestore, user);
      await sendEmailVerification(user);

      toast({
        title: "Account Created!",
        description:
          "Please check your email to verify your account before logging in.",
      });

      emailForm.reset();
      router.push("/login?mode=login");
    } catch (error: any) {
      let description = "An unexpected error occurred. Please try again.";

      if (error.code === "auth/email-already-in-use") {
        description = "This email is already registered. Please log in instead.";
      }

      toast({
        variant: "destructive",
        title: "Sign-Up Failed",
        description,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleSendOtp = async () => {
    const isValid = await phoneForm.trigger(["name", "phone"]);

    if (!isValid) {
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

    setIsLoading(true);

    try {
      const result = await signInWithPhoneNumber(auth, `+${phone}`, verifier);
      setConfirmationResult(result);
      setIsOtpSent(true);

      toast({
        title: "OTP Sent!",
        description: "Check your phone for the verification code.",
      });
    } catch (error) {
      console.error("Phone signup error:", error);

      toast({
        variant: "destructive",
        title: "Failed to send OTP",
        description: "Please check the phone number and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtpAndSignup = async () => {
    const name = phoneForm.getValues("name").trim();
    const otp = phoneForm.getValues("otp")?.trim();

    if (!name) {
      phoneForm.setError("name", { message: "Name is required." });
      return;
    }

    if (!otp) {
      phoneForm.setError("otp", { message: "OTP is required." });
      return;
    }

    if (!confirmationResult) {
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await confirmationResult.confirm(otp);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });
      await createUserDocument(firestore, user);

      toast({
        title: "Success!",
        description: "You have been signed up.",
      });

      router.push("/dashboard");
    } catch (error) {
      console.error("OTP signup error:", error);

      toast({
        variant: "destructive",
        title: "Invalid OTP",
        description: "The code you entered is incorrect.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      await createUserDocument(firestore, result.user);

      toast({
        title: "Account Created!",
        description: "You've successfully signed up with Google.",
      });
    } catch (error: any) {
      if (error.code === "auth/popup-closed-by-user") {
        return;
      }

      toast({
        variant: "destructive",
        title: "Google Sign-Up Failed",
        description:
          error.message ||
          "Could not complete sign up with Google. Please try again.",
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
      footerLinkHref="/login?mode=login"
    >
      <div id="recaptcha-container-signup" />

      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isLoading || isGoogleLoading}
        >
          {isGoogleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon className="mr-2 h-4 w-4" />
          )}
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
            <Form {...emailForm}>
              <form
                onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                className="space-y-4 pt-4"
              >
                <FormField
                  control={emailForm.control}
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
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
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
                  disabled={isLoading || isGoogleLoading}
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Account
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="phone">
            <Form {...phoneForm}>
              <form className="space-y-4 pt-4">
                <FormField
                  control={phoneForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your Name"
                          {...field}
                          disabled={isOtpSent}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                  onClick={
                    isOtpSent ? handleVerifyOtpAndSignup : handleSendOtp
                  }
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isOtpSent ? "Verify & Sign Up" : "Send OTP"}
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
