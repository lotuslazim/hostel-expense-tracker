
import { FirebaseClientProvider } from "@/firebase/client-provider";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <FirebaseClientProvider>
      <div className="flex min-h-screen items-center justify-center p-4 bg-background">
        {children}
      </div>
    </FirebaseClientProvider>
  );
}
