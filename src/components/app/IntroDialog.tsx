
"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Utensils, Wallet, FileText, Package, Users, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useRouter } from "next/navigation";

const introSteps = [
    {
        title: "Welcome to BachelorBite",
        description: "The all-in-one solution for managing shared living expenses and meals. Say goodbye to spreadsheets and confusion.",
        icon: Users,
        image: PlaceHolderImages.find(p => p.id === 'landing-hero-2')?.imageUrl || '',
    },
    {
        title: "Log Meals & Expenses Effortlessly",
        description: "Quickly log your daily meals and any shared expenses. Attach receipts with your camera. It’s that simple.",
        icon: Utensils,
        image: PlaceHolderImages.find(p => p.id === 'app-dashboard')?.imageUrl || '',
    },
    {
        title: "Track Your Inventory",
        description: "When you log a 'Food & Groceries' expense, the items are automatically added to a monthly inventory list.",
        icon: Package,
        image: PlaceHolderImages.find(p => p.id === 'app-inventory')?.imageUrl || '',
    },
    {
        title: "Automated Monthly Reports",
        description: "At the end of the month, get a detailed report with a final settlement. See who owes what and who gets money back, all calculated automatically.",
        icon: FileText,
        image: PlaceHolderImages.find(p => p.id === 'app-report')?.imageUrl || '',
    },
    {
        title: "Ready to Get Started?",
        description: "Sign up or log in to create your group and simplify your shared living experience.",
        icon: CheckCircle,
        image: PlaceHolderImages.find(p => p.id === 'landing-hero')?.imageUrl || '',
    }
];

const onboardingSteps = [
     {
        title: "Welcome to Your Dashboard!",
        description: "This is your central hub. Here you can log daily meals and add shared expenses.",
        icon: Users,
        image: PlaceHolderImages.find(p => p.id === 'app-dashboard')?.imageUrl || '',
    },
    {
        title: "Automated Reports",
        description: "Visit the 'Reports' section to see the magic. Your monthly summary calculates who owes what based on meal counts and expenses.",
        icon: FileText,
        image: PlaceHolderImages.find(p => p.id === 'app-report')?.imageUrl || '',
    },
    {
        title: "Inventory Tracking",
        description: "Check the 'Inventory' tab to see a list of all groceries purchased during the month, automatically compiled from your expense logs.",
        icon: Package,
        image: PlaceHolderImages.find(p => p.id === 'app-inventory')?.imageUrl || '',
    },
     {
        title: "You're All Set!",
        description: "Start by logging your first meal or expense from the dashboard. If you need to manage your group, head to the 'Group Details' page from your profile menu.",
        icon: CheckCircle,
        image: PlaceHolderImages.find(p => p.id === 'landing-hero')?.imageUrl || '',
    }
];


export function IntroDialog({ onOpenChange, isOnboardingFlow = false }: { onOpenChange: (open: boolean) => void, isOnboardingFlow?: boolean }) {
    const [step, setStep] = useState(0);
    const router = useRouter();

    const steps = isOnboardingFlow ? onboardingSteps : introSteps;
    const currentStep = steps[step];

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
             if (isOnboardingFlow) {
                onOpenChange(false);
             } else {
                router.push('/signup');
             }
        }
    };

    const handleBack = () => {
        if (step > 0) {
            setStep(step + 1);
        }
    };

    return (
        <Dialog open={true} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1C1C1C] border-neutral-700 text-white max-w-4xl p-0 aspect-video flex flex-col">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
                    {/* Left Side (Image) */}
                    <div className="relative h-64 md:h-full">
                        <Image 
                            src={currentStep.image}
                            alt={currentStep.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30"></div>
                    </div>
                    
                    {/* Right Side (Content) */}
                    <div className="p-8 md:p-10 flex flex-col justify-between">
                       <div>
                            <div className="mb-4">
                                <currentStep.icon className="h-8 w-8 text-primary" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold font-headline mb-3">{currentStep.title}</h2>
                            <p className="text-neutral-400 text-base">{currentStep.description}</p>
                       </div>

                       <div className="mt-8">
                            <div className="flex justify-between items-center">
                                <div className="flex gap-2">
                                    {steps.map((_, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                "h-2 w-2 rounded-full bg-neutral-600 transition-all",
                                                i === step && "w-6 bg-primary"
                                            )}
                                        />
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    {step > 0 && (
                                         <Button variant="outline" size="icon" onClick={handleBack} className="text-white border-neutral-600 hover:bg-neutral-700 hover:text-white">
                                            <ArrowLeft className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button onClick={handleNext} className="bg-primary hover:bg-primary/90">
                                        {step === steps.length - 1 ? (isOnboardingFlow ? "Finish" : "Sign Up") : "Continue"}
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                       </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
