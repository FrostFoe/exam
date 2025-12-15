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
import type { Batch } from "@/lib/types";

export const runtime = "edge";

interface LeaderboardEntry {
  student_id: string;
  student_name: string;
  student_roll: string;
  total_score: number;
}

interface RawStudentResult {
  student_id: string;
  exam_id: string;
  correct_answers: number;
  wrong_answers: number;
  student: {
    uid: string;
    name: string;
    roll: string;
  } | null;
}

export default function BatchLeaderboardPage() {
  const { user } = useAuth();
  const params = useParams();
  const { toast } = useToast();

  const batch_id = params.batch_id as string;
  const [batch, setBatch] = useState<Batch | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!batch_id) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch batch details
        const { data: batchData, error: batchError } = await supabase
          .from("batches")
          .select("id, name, created_at")
          .eq("id", batch_id)
          .single();

        if (batchError) throw batchError;
        setBatch(batchData as Batch);

        // Fetch exams for the batch
        const { data: exams, error: examsError } = await supabase
          .from("exams")
          .select("id, negative_marks_per_wrong")
          .eq("batch_id", batch_id);

        if (examsError) throw examsError;

        const examIds = exams.map((exam) => exam.id);
        const negativeMarksMap = new Map(
          exams.map((e) => [e.id, e.negative_marks_per_wrong ?? 0]),
        );

        if (examIds.length === 0) {
          setLeaderboard([]);
          setLoading(false);
          return;
        }

        // Fetch all results for these exams
        const { data: results, error: resultsError } = await supabase
          .from("student_exams")
          .select(
            "student_id, exam_id, correct_answers, wrong_answers, student:student_id(uid, name, roll)",
          )
          .in("exam_id", examIds);

        if (resultsError) throw resultsError;

        // Process results
        const studentScores: {
          [key: string]: { name: string; roll: string; total_score: number };
        } = {};

        (results as unknown as RawStudentResult[]).forEach((result) => {
          const student = result.student;
          if (!student) return;

          const negativeMarks = negativeMarksMap.get(result.exam_id) || 0;
          const score =
            (result.correct_answers || 0) -
            (result.wrong_answers || 0) * negativeMarks;

          if (!studentScores[student.uid]) {
            studentScores[student.uid] = {
              name: student.name,
              roll: student.roll,
              total_score: 0,
            };
          }
          studentScores[student.uid].total_score += score;
        });

        const finalLeaderboard = Object.entries(studentScores).map(
          ([uid, data]) => ({
            student_id: uid,
            student_name: data.name,
            student_roll: data.roll,
            total_score: data.total_score,
          }),
        );

        finalLeaderboard.sort((a, b) => b.total_score - a.total_score);

        setLeaderboard(finalLeaderboard);
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
  }, [batch_id, toast]);

  if (loading) {
    return <LoadingSpinner message="লিডারবোর্ড লোড হচ্ছে..." />;
  }

  return (
    <div className="container mx-auto p-2 md:p-4 space-y-6">
      <PageHeader
        title={`${batch?.name || "ব্যাচ"} - লিডারবোর্ড`}
        description="এই ব্যাচের সকল পরীক্ষার সম্মিলিত ফলাফল"
      />
      <Card>
        <CardHeader>
          <CardTitle>সার্বিক ফলাফল তালিকা</CardTitle>
          <CardDescription>
            সর্বোচ্চ মোট স্কোর থেকে সর্বনিম্ন স্কোরের ক্রমানুসারে সাজানো
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>র‌্যাঙ্ক</TableHead>
                <TableHead>নাম</TableHead>
                <TableHead>রোল</TableHead>
                <TableHead className="text-right">মোট স্কোর</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.length > 0 ? (
                leaderboard.map((entry, idx) => (
                  <TableRow
                    key={entry.student_id}
                    className={
                      entry.student_id === user?.uid ? "bg-primary/10" : ""
                    }
                  >
                    <TableCell className="font-medium">{idx + 1}</TableCell>
                    <TableCell>{entry.student_name}</TableCell>
                    <TableCell>{entry.student_roll}</TableCell>
                    <TableCell className="text-right font-bold">
                      {entry.total_score.toFixed(2)}
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
