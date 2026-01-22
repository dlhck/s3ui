import { HardDrive } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
      <HardDrive className="h-16 w-16" />
      <h1 className="text-xl font-medium">Welcome to S3UI</h1>
      <p>Select a bucket from the sidebar to get started</p>
    </div>
  );
}
