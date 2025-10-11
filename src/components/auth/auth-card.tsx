import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Logo } from "@/components/icons/logo";
import Link from "next/link";

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  description: string;
  footerText: string;
  footerLinkText: string;
  footerLinkHref: string;
}

// Make sure this is exported as default or named export
export function AuthCard({
  children,
  title,
  description,
  footerText,
  footerLinkText,
  footerLinkHref,
}: AuthCardProps) {
  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <Logo />
        </div>
        <CardTitle className="text-2xl font-headline">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
      <CardFooter className="flex justify-center text-sm">
        <p className="text-muted-foreground">
          {footerText}{" "}
          <Link href={footerLinkHref} className="font-semibold text-primary hover:underline">
            {footerLinkText}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

// Make sure there's only one export
export default AuthCard;