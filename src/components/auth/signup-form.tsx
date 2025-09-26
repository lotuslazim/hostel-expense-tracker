
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
import { useAuth } from "@/firebase";
import { GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup } from "firebase/auth";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const emailSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
});

const phoneSchema = z.object({
  phone: z.string().min(10, { message: "Please enter a valid phone number." }),
});

export function SignupForm() {
  const router = useRouter();
  const auth = useAuth();
  const [step, setStep] = useState<"form" | "verify">("form");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });

  useEffect(() => {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      'size': 'invisible',
      'callback': (response: any) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      }
    });
  }, [auth]);

  function onEmailSubmit(values: z.infer<typeof emailSchema>) {
    console.log(values);
    // TODO: Implement actual email/password signup
    router.push('/dashboard');
  }

  async function onPhoneSubmit(values: z.infer<typeof phoneSchema>) {
    setIsLoading(true);
    const appVerifier = window.recaptchaVerifier;
    try {
      const result = await signInWithPhoneNumber(auth, `+${values.phone}`, appVerifier);
      setConfirmationResult(result);
      setStep("verify");
      toast({ title: "Verification code sent!" });
    } catch (error) {
      console.error("Error sending verification code:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to send verification code. Please try again." });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyCode() {
    setIsLoading(true);
    if (!confirmationResult) return;
    try {
      await confirmationResult.confirm(verificationCode);
      toast({ title: "Phone number verified!" });
      router.push('/dashboard');
    } catch (error) {
      console.error("Error verifying code:", error);
      toast({ variant: "destructive", title: "Error", description: "Invalid verification code. Please try again." });
    } finally {
      setIsLoading(false);
    }
  }


  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      toast({ variant: "destructive", title: "Google Sign-In Failed", description: "Could not sign in with Google. Please try again."})
    }
  };

  return (
    <AuthCard
      title="Create an Account"
      description="Start your wellness journey today"
      footerText="Already have an account?"
      footerLinkText="Log In"
      footerLinkHref="/login"
    >
      <div className="space-y-4">
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
           <svg
              className="mr-2 h-4 w-4"
              aria-hidden="true"
              focusable="false"
              data-prefix="fab"
              data-icon="google"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
            >
              <path
                fill="#4285F4"
                d="M488 261.8C488 403.3 381.5 512 244 512S0 403.3 0 261.8 106.5 11.6 244 11.6c67.3 0 121.5 24.3 166.5 66.2l-69.5 68.3c-24-23.2-56.3-39.3-97-39.3-75.3 0-136.3 60.8-136.3 136.3s61 136.3 136.3 136.3c83.8 0 119-58.8 123.3-88.3H244v-85.8h244z"
              ></path>
            </svg>
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
              <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4 pt-4">
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
          </TabsContent>
          <TabsContent value="phone">
            {step === "form" ? (
              <Form {...phoneForm}>
                <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4 pt-4">
                   <FormField
                    control={phoneForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Verification Code
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Verification Code</Label>
                  <Input 
                    placeholder="Enter the 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                  />
                </div>
                 <Button onClick={handleVerifyCode} className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify & Sign Up
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
        <div id="recaptcha-container"></div>
      </div>
    </AuthCard>
  );
}
