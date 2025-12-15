"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, LoadingSpinner } from "@/components";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export const runtime = "edge";

interface StudentResult {
  id: string;
  student: {
    name: string;
    roll: string;
  };
  score: number;
  submitted_at: string;
}

interface RawStudentResult {
  id: string;
  student_id: { name: string; roll: string } | null;
  score: number;
  correct_answers: number;
  wrong_answers: number;
  submitted_at: string;
}

export default function ExamLeaderboardPage() {
  const { user } = useAuth();
  const params = useParams();
  const { toast } = useToast();

  const exam_id = params.exam_id as string;
  const [exam, setExam] = useState<Exam | null>(null);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!exam_id) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const { data: examData, error: examError } = await supabase
          .from("exams")
          .select("*")
          .eq("id", exam_id)
          .single();

        if (examError) throw examError;
        setExam(examData);

        const { data: resultsData, error: resultsError } = await supabase
          .from("student_exams")
          .select(
            `id, score, correct_answers, wrong_answers, submitted_at,
            student_id (name, roll)`,
          )
          .eq("exam_id", exam_id)
          .order("score", { ascending: false });

        if (resultsError) throw resultsError;

        setResults(
          (resultsData as unknown as RawStudentResult[]).map((r) => ({
            id: r.id,
            student: r.student_id || { name: "Unknown", roll: "Unknown" },
            score:
              r.correct_answers -
              r.wrong_answers * (examData?.negative_marks_per_wrong ?? 0),
            submitted_at: r.submitted_at,
          })),
        );
      } catch (err) {
        console.error(err);
        toast({
          title: "লিডারবোর্ড লোড করতে ব্যর্থ",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [exam_id, toast]);

  if (loading) {
    return <LoadingSpinner message="লিডারবোর্ড লোড হচ্ছে..." />;
  }

  return (
    <div className="container mx-auto p-2 md:p-4 space-y-6">
      <PageHeader
        title={`${exam?.name || "লিডারবোর্ড"}`}
        description="এই পরীক্ষায় অংশগ্রহণকারীদের র‌্যাঙ্কিং"
      />
      <Card>
        <CardHeader>
          <CardTitle>ফলাফল তালিকা</CardTitle>
          <CardDescription>
            সর্বোচ্চ স্কোর থেকে সর্বনিম্ন স্কোরের ক্রমানুসারে সাজানো
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>র‌্যাঙ্ক</TableHead>
                <TableHead>নাম</TableHead>
                <TableHead>রোল</TableHead>
                <TableHead className="text-right">স্কোর</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length > 0 ? (
                results.map((result, idx) => (
                  <TableRow
                    key={result.id}
                    className={
                      result.student.roll === user?.roll ? "bg-primary/10" : ""
                    }
                  >
                    <TableCell className="font-medium">{idx + 1}</TableCell>
                    <TableCell>{result.student.name}</TableCell>
                    <TableCell>{result.student.roll}</TableCell>
                    <TableCell className="text-right font-bold">
                      {result.score.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    এখনো কোনো ফলাফল পাওয়া যায়নি।
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
