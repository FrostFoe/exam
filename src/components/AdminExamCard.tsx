
"use client";

import Link from "next/link";
import { BarChart3, Trash2, Pencil, FileText, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ConfirmPasswordDialog from "@/components/ConfirmPasswordDialog";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { verifyAdminPassword } from "@/lib/admin";
import { useToast } from "@/hooks/use-toast";
import type { Exam } from "@/lib/types";
import { deleteExam } from "@/lib/actions";
import { EditExamModal } from "./EditExamModal";

interface AdminExamCardProps {
  exam: Exam;
  onDelete?: () => void;
}

export function AdminExamCard({ exam, onDelete }: AdminExamCardProps) {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { admin } = useAdminAuth();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowPasswordDialog(true);
  };

  const handleCopyLink = () => {
    const examUrl = `${window.location.origin}/dashboard/exams/${exam.id}`;
    navigator.clipboard.writeText(examUrl);
    toast({
      title: "লিংক কপি হয়েছে",
      description: "পরীক্ষার লিংক আপনার ক্লিপবোর্ডে কপি করা হয়েছে।",
    });
  };

  const handleDeleteConfirmed = async (password: string) => {
    setShowPasswordDialog(false);

    if (!admin) {
      toast({ title: "অধিকার নেই", variant: "destructive" });
      return;
    }

    const ok = await verifyAdminPassword(admin.uid, password);
    if (!ok) {
      toast({ title: "ভুল পাসওয়ার্ড", variant: "destructive" });
      return;
    }

    setDeleting(true);

    const formData = new FormData();
    formData.append("id", exam.id);
    if (exam.batch_id) {
      formData.append("batch_id", exam.batch_id);
    }

    const result = await deleteExam(formData);
    if (result.success) {
      toast({ title: "পরীক্ষা মুছে ফেলা হয়েছে" });
      onDelete?.();
    } else {
      toast({ title: "মুছতে ব্যর্থ", variant: "destructive" });
    }
    setDeleting(false);
  };

  return (
    <>
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-neutral-950 hover:shadow-md transition-all duration-300">
        {/* Header - Exam Info */}
        <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="font-semibold text-lg mb-1 line-clamp-2">
            {exam.name}
          </h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            আইডি: {exam.id.slice(0, 12)}...
          </p>
        </div>

        {/* Details */}
        <div className="p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-600 dark:text-neutral-400">
              সময়:
            </span>
            <span className="font-medium">{exam.duration_minutes} মিনিট</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600 dark:text-neutral-400">
              নেগেটিভ মার্ক:
            </span>
            <span className="font-medium">{exam.negative_marks_per_wrong}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600 dark:text-neutral-400">
              তৈরি:
            </span>
            <span className="font-medium">
              {new Date(exam.created_at).toLocaleDateString("bn-BD", {
                timeZone: "Asia/Dhaka",
              })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap gap-2 justify-center">
          <Link href={`/admin/dashboard/exams/${exam.id}/questions`}>
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              প্রশ্ন ও সমাধান
            </Button>
          </Link>
          <Link href={`/admin/dashboard/exams/${exam.id}/results`}>
            <Button variant="outline" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              ফলাফল
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            <Copy className="w-4 h-4 mr-2" />
            লিংক কপি
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            disabled={deleting}
          >
            <Pencil className="w-4 h-4 mr-2" />
            এডিট
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <ConfirmPasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        title="পরীক্ষা মুছুন"
        description={`আপনি '${exam.name}' পরীক্ষা মুছে ফেলতে যাচ্ছেন — এটি স্থায়ী। অ্যাডমিন পাসওয়ার্ড দিন।`}
        confirmLabel="মুছে ফেলুন"
        onConfirm={handleDeleteConfirmed}
      />
      <EditExamModal
        exam={exam}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </>
  );
}
