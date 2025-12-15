"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Batch } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { updateBatch } from "@/lib/actions";

interface EditBatchModalProps {
  batch: Batch | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditBatchModal({
  batch,
  isOpen,
  onClose,
}: EditBatchModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublic, setIsPublic] = useState(batch?.is_public || false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (batch) {
      formRef.current?.reset();
      setIsPublic(batch.is_public || false);
    }
  }, [batch]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>কোর্স সম্পাদন করুন</DialogTitle>
          <DialogDescription>নিচে কোর্সের বিবরণ আপডেট করুন।</DialogDescription>
        </DialogHeader>
        <form
          ref={formRef}
          action={async (formData) => {
            setIsSubmitting(true);
            if (batch?.id) {
              formData.append("id", batch.id);
            }

            const result = await updateBatch(formData);
            if (result.success) {
              toast({ title: "ব্যাচ সফলভাবে আপডেট করা হয়েছে!" });
              onClose();
            } else {
              toast({
                title: "ব্যাচ আপডেট করতে সমস্যা হয়েছে",
                description: result.message,
                variant: "destructive",
              });
            }
            setIsSubmitting(false);
          }}
          className="space-y-4"
        >
          <Input
            type="text"
            name="name"
            defaultValue={batch?.name || ""}
            placeholder="কোর্সের নাম"
            required
          />
          <Textarea
            name="description"
            defaultValue={batch?.description || ""}
            placeholder="কোর্সের বিবরণ"
          />
          <div className="space-y-2">
            <Label htmlFor="icon_url">কভার ছবির URL</Label>
            <Input
              id="icon_url"
              name="icon_url"
              type="text"
              defaultValue={batch?.icon_url || ""}
              placeholder="https://example.com/image.png"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="is_public"
              name="is_public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
            <Label htmlFor="is_public">পাবলিক কোর্স</Label>
          </div>
          <input
            type="hidden"
            name="is_public_hidden"
            value={isPublic ? "true" : "false"}
          />
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                আপডেট করা হচ্ছে...
              </>
            ) : (
              "কোর্স আপডেট করুন"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
