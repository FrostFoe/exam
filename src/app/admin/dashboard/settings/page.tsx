import { PageHeader, EmptyState } from "@/components";
import { Settings } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="container mx-auto p-2 md:p-4 space-y-6">
      <PageHeader
        title="সেটিংস"
        description="অ্যাডমিন প্যানেলের কনফিগারেশন এবং পছন্দসমূহ পরিচালনা করুন।"
      />
      <EmptyState
        icon={<Settings className="h-12 w-12 text-primary" />}
        title="সেটিংস উপলব্ধ নয়"
        description="অ্যাডমিন সেটিংস বৈশিষ্ট্য শীঘ্রই আসছে। দয়া করে পরে চেষ্টা করুন।"
      />
    </div>
  );
}
