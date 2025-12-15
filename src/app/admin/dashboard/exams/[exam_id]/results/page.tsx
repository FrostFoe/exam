"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { PageHeader } from "@/components";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { Exam } from "@/lib/types";
import { Loader2, Download, FileDown, ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import ConfirmPasswordDialog from "@/components/ConfirmPasswordDialog";
import { verifyAdminPassword } from "@/lib/admin";

export const runtime = "edge";

interface StudentResult {
  id: string;
  exam_id: string;
  student_id_obj: {
    name: string;
    roll: string;
  };
  score: number;
  correct_answers: number;
  wrong_answers: number;
  unattempted: number;
  submitted_at: string;
}

interface RawStudentResult {
  id: string;
  exam_id: string;
  student_id: { name: string; roll: string };
  score: number;
  correct_answers: number;
  wrong_answers: number;
  unattempted: number;
  submitted_at: string;
}

export default function AdminExamResultsPage() {
  const { admin } = useAdminAuth();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const exam_id = params.exam_id as string;
  const [exam, setExam] = useState<Exam | null>(null);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [pendingResultToDelete, setPendingResultToDelete] =
    useState<StudentResult | null>(null);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);

  useEffect(() => {
    if (!admin) return;
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch exam
        const { data: examData, error: examError } = await supabase
          .from("exams")
          .select("*")
          .eq("id", exam_id)
          .single();

        if (examError) {
          toast({
            title: "পরীক্ষা খুঁজে পাওয়া যায়নি",
            variant: "destructive",
          });
          router.push("/admin/dashboard/exams");
          return;
        }

        setExam(examData);

        // Fetch results with student details
        const { data: resultsData, error: resultsError } = await supabase
          .from("student_exams")
          .select(
            `id, exam_id, student_id, score, correct_answers, wrong_answers, unattempted, submitted_at,
            student_id(name, roll)`,
          )
          .eq("exam_id", exam_id)
          .order("score", { ascending: false });

        if (resultsError) throw resultsError;

        setResults(
          resultsData?.map((r: RawStudentResult) => ({
            id: r.id,
            exam_id: r.exam_id,
            student_id_obj: r.student_id,
            score:
              r.correct_answers -
              r.wrong_answers * (examData?.negative_marks_per_wrong ?? 0),
            correct_answers: r.correct_answers,
            wrong_answers: r.wrong_answers,
            unattempted: r.unattempted,
            submitted_at: r.submitted_at,
          })) || [],
        );
      } catch (err) {
        console.error(err);
        toast({
          title: "ডেটা লোড করতে ব্যর্থ",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [admin, exam_id, router, toast]);

  const handleDownloadPDF = async () => {
    setGeneratingPDF(true);
    try {
      const response = await fetch("/api/generate-results-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId: exam_id }),
      });

      if (!response.ok) throw new Error("Failed to generate results");

      const html = await response.text();
      const newWin = window.open("", "_blank");
      if (newWin) {
        newWin.document.write(html);
        newWin.document.close();
        newWin.focus();
        setTimeout(() => {
          try {
            newWin.print();
          } catch (err) {
            console.error("Print failed:", err);
            newWin.close();
          }
        }, 500);
      } else {
        toast({
          title: "পপ-আপ ব্লক করা হয়েছে",
          description: "রিপোর্ট দেখতে পপ-আপ চালু করুন।",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "রিপোর্ট তৈরিতে ব্যর্থ", variant: "destructive" });
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleExportCSV = async () => {
    setExportingCSV(true);
    try {
      const response = await fetch("/api/export-results-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId: exam_id }),
      });

      if (!response.ok) throw new Error("Failed to export CSV");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exam?.name?.replace(/\s+/g, "_")}_results.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "CSV সফলভাবে ডাউনলোড হয়েছে",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "CSV এক্সপোর্ট করতে ব্যর্থ",
        variant: "destructive",
      });
    } finally {
      setExportingCSV(false);
    }
  };

  const requestDeleteResult = (result: StudentResult) => {
    setPendingResultToDelete(result);
    setIsPasswordOpen(true);
  };

  const handleDeleteConfirmed = async (password: string) => {
    if (!pendingResultToDelete) return;

    if (!admin) {
      toast({ variant: "destructive", title: "অধিকার নেই" });
      setIsPasswordOpen(false);
      setPendingResultToDelete(null);
      return;
    }

    const ok = await verifyAdminPassword(admin.uid, password);
    if (!ok) {
      toast({ variant: "destructive", title: "ভুল পাসওয়ার্ড" });
      return;
    }

    const { error } = await supabase
      .from("student_exams")
      .delete()
      .eq("id", pendingResultToDelete.id);

    if (error) {
      toast({
        title: "ফলাফল মুছতে ব্যর্থ",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "ফলাফল সফলভাবে মুছে ফেলা হয়েছে" });
      setResults(results.filter((r) => r.id !== pendingResultToDelete.id));
    }

    setIsPasswordOpen(false);
    setPendingResultToDelete(null);
  };

  if (!admin) {
    return <div className="container mx-auto p-4">লোড হচ্ছে...</div>;
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-red-600">পরীক্ষা খুঁজে পাওয়া যায়নি</p>
      </div>
    );
  }

  const avgScore =
    results.length > 0
      ? results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length
      : 0;
  const maxScore = Math.max(...results.map((r) => r.score || 0), 0);
  const minScore =
    results.length > 0 ? Math.min(...results.map((r) => r.score || 0)) : 0;

  return (
    <div className="container mx-auto p-2 md:p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/dashboard/exams">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <PageHeader
          title={`${exam.name} - ফলাফল`}
          description="সমস্ত শিক্ষার্থীর পরীক্ষার ফলাফল"
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              মোট শিক্ষার্থী
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{results.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">গড় স্কোর</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgScore.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              সর্বোচ্চ স্কোর
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maxScore.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              সর্বনিম্ন স্কোর
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{minScore.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Results Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>শিক্ষার্থীর ফলাফল</CardTitle>
            <CardDescription>
              স্কোর অনুযায়ী সাজানো (সর্বোচ্চ থেকে সর্বনিম্ন)
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={handleDownloadPDF}
              disabled={generatingPDF}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {generatingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ডাউনলোড হচ্ছে...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  রিপোর্ট ডাউনলোড
                </>
              )}
            </Button>
            <Button
              onClick={handleExportCSV}
              disabled={exportingCSV}
              className="w-full sm:w-auto"
            >
              {exportingCSV ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  এক্সপোর্ট হচ্ছে...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 mr-2" />
                  CSV ডাউনলোড
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ক্র.স.</TableHead>
                <TableHead>রোল</TableHead>
                <TableHead>নাম</TableHead>
                <TableHead className="text-right">স্কোর</TableHead>
                <TableHead className="text-center">সঠিক</TableHead>
                <TableHead className="text-center">ভুল</TableHead>
                <TableHead className="text-center">উত্তর না দেওয়া</TableHead>
                <TableHead>সময়</TableHead>
                <TableHead className="text-right">কার্যক্রম</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-24 text-center text-muted-foreground"
                  >
                    কোনো ফলাফল নেই
                  </TableCell>
                </TableRow>
              ) : (
                results.map((result, idx) => (
                  <TableRow key={result.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>
                      {result.student_id_obj?.roll || "N/A"}
                    </TableCell>
                    <TableCell>
                      {result.student_id_obj?.name || "N/A"}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {result.score?.toFixed(2) || 0}
                    </TableCell>
                    <TableCell className="text-center text-green-600">
                      {result.correct_answers || 0}
                    </TableCell>
                    <TableCell className="text-center text-destructive">
                      {result.wrong_answers || 0}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {result.unattempted || 0}
                    </TableCell>
                    <TableCell>
                      {new Date(result.submitted_at).toLocaleString("bn-BD", {
                        timeZone: "Asia/Dhaka",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => requestDeleteResult(result)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ConfirmPasswordDialog
        open={isPasswordOpen}
        onOpenChange={(open) => {
          setIsPasswordOpen(open);
          if (!open) setPendingResultToDelete(null);
        }}
        title="ফলাফল মুছুন"
        description={`আপনি কি নিশ্চিতভাবে ${pendingResultToDelete?.student_id_obj.name || ""} এর ফলাফল মুছে ফেলতে চান? এটি স্থায়ীভাবে মুছে যাবে।`}
        confirmLabel="মুছে ফেলুন"
        onConfirm={handleDeleteConfirmed}
      />
    </div>
  );
}
