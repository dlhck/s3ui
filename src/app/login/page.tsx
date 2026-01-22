import { HardDrive } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="mb-8 flex items-center gap-2">
        <HardDrive className="h-8 w-8" />
        <span className="text-2xl font-bold">S3UI</span>
      </div>
      <LoginForm />
    </div>
  );
}
