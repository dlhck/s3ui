import { FileBrowser } from "@/components/file-manager/file-browser";

interface BucketPageProps {
  params: Promise<{
    bucket: string;
    path?: string[];
  }>;
}

export default async function BucketPage({ params }: BucketPageProps) {
  const { bucket, path = [] } = await params;

  return <FileBrowser bucket={bucket} path={path} />;
}
