"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import ConfirmPasswordDialog from "@/components/ConfirmPasswordDialog";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { verifyAdminPassword } from "@/lib/admin";
import type { Batch } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { createBatch, deleteBatch } from "@/lib/actions";
import { EditBatchModal } from "@/components/EditBatchModal";
import { BatchCard } from "@/components/BatchCard";

export function BatchesClient({ initialBatches }: { initialBatches: Batch[] }) {
  const [batches] = useState<Batch[]>(initialBatches);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const { admin } = useAdminAuth();
  const [pendingBatchToDelete, setPendingBatchToDelete] = useState<
    string | null
  >(null);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDeleteBatch = (batchId: string) => {
    setPendingBatchToDelete(batchId);
    setIsPasswordOpen(true);
  };

  const handleEditBatch = (batch: Batch) => {
    setEditingBatch(batch);
    setIsEditModalOpen(true);
  };

  const handleDeleteBatchConfirmed = async (password: string) => {
    if (!pendingBatchToDelete) return;

    if (!admin) {
      toast({ variant: "destructive", title: "অধিকার নেই" });
      setIsPasswordOpen(false);
      setPendingBatchToDelete(null);
      return;
    }

    const ok = await verifyAdminPassword(admin.uid, password);
    if (!ok) {
      toast({ variant: "destructive", title: "ভুল পাসওয়ার্ড" });
      return;
    }

    const formData = new FormData();
    formData.append("id", pendingBatchToDelete);
    const result = await deleteBatch(formData);

    if (result.success) {
      toast({
        title: "ব্যাচ সফলভাবে মুছে ফেলা হয়েছে",
      });
    } else {
      toast({
        title: "ব্যাচ মুছে ফেলতে সমস্যা হয়েছে",
        description: result.message,
        variant: "destructive",
      });
    }

    setIsPasswordOpen(false);
    setPendingBatchToDelete(null);
  };

  return (
    <div className="container mx-auto p-2 md:p-4">
      <Card>
        <CardHeader>
          <CardTitle>ব্যাচ পরিচালনা</CardTitle>
          <CardDescription>
            নতুন ব্যাচ তৈরি করুন এবং বিদ্যমান ব্যাচ পরিচালনা করুন।
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            ref={formRef}
            action={async (formData) => {
              setIsSubmitting(true);
              const result = await createBatch(formData);
              if (result.success) {
                toast({
                  title: "ব্যাচ সফলভাবে যোগ করা হয়েছে",
                });
                formRef.current?.reset();
              } else {
                toast({
                  title: "ব্যাচ যোগ করতে সমস্যা হয়েছে",
                  description: result.message,
                  variant: "destructive",
                });
              }
              setIsSubmitting(false);
            }}
            className="space-y-4 mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="text"
                name="name"
                placeholder="ব্যাচের নাম"
                disabled={isSubmitting}
                required
              />
              <Input
                type="text"
                name="description"
                placeholder="ব্যাচের বিবরণ"
                disabled={isSubmitting}
              />
              <Input
                type="url"
                name="icon_url"
                placeholder="আইকন URL"
                disabled={isSubmitting}
              />
              <select
                name="status"
                defaultValue="live"
                disabled={isSubmitting}
                className="px-3 py-2 border rounded-md"
              >
                <option value="live">লাইভ</option>
                <option value="end">শেষ</option>
              </select>
              <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-md">
                <input type="checkbox" name="is_public" value="true" />
                <span className="text-sm">পাবলিক ব্যাচ</span>
              </label>
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  যোগ করা হচ্ছে...
                </>
              ) : (
                "নতুন ব্যাচ যোগ করুন"
              )}
            </Button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map((batch) => (
              <BatchCard
                key={batch.id}
                batch={batch}
                onEdit={handleEditBatch}
                onDelete={handleDeleteBatch}
              />
            ))}
          </div>
        </CardContent>
      </Card>
      <hr className="h-8 border-transparent" />
      <ConfirmPasswordDialog
        open={isPasswordOpen}
        onOpenChange={(open) => {
          setIsPasswordOpen(open);
          if (!open) setPendingBatchToDelete(null);
        }}
        title="ব্যাচ মুছে ফেলার নিশ্চিতকরণ"
        description={
          pendingBatchToDelete
            ? "আপনি এই ব্যাচটি মুছে ফেলতে যাচ্ছেন — এটি সব পরীক্ষা এবং সম্পর্কিত তথ্য মুছে ফেলবে। অনুগ্রহ করে আপনার অ্যাডমিন পাসওয়ার্ড দিন।"
            : undefined
        }
        confirmLabel="মুছে ফেলুন"
        onConfirm={handleDeleteBatchConfirmed}
      />
      <EditBatchModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingBatch(null);
        }}
        batch={editingBatch}
      />
    </div>
  );
}
