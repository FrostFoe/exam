
"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { fetchQuestions, type RawQuestion } from "@/lib/fetchQuestions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { Exam, Question } from "@/lib/types";
import LatexRenderer from "@/components/LatexRenderer";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Zap,
} from "lucide-react";

export const runtime = "edge";

export default function SolvePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const exam_id = params.exam_id as string;
  const { toast } = useToast();

  const [exam, setExam] = useState<Exam | null>(null);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedUserAnswers, setLoadedUserAnswers] = useState<{
    [key: string]: number;
  } | null>(null);
  const [filter, setFilter] = useState<"all" | "correct" | "wrong" | "skipped">(
    "all",
  );

  useEffect(() => {
    if (exam_id) {
      fetchExamAndAnswers();
    }
  }, [exam_id, user, searchParams]);

  const fetchExamAndAnswers = async () => {
    setLoading(true);
    try {
      const { data: examData, error: examError } = await supabase
        .from("exams")
        .select("*")
        .eq("id", exam_id)
        .single();

      if (examError) {
        toast({
          title: "পরীক্ষা লোড করতে সমস্যা হয়েছে",
          variant: "destructive",
        });
        return;
      }
      setExam(examData);

      const fetched = await fetchQuestions(examData.file_id);
      if (Array.isArray(fetched) && fetched.length > 0) {
        const convertedQuestions = fetched.map((q: RawQuestion) => {
          let answerIndex = -1;
          const answerString = (q.answer || q.correct || "").toString().trim();

          if (/^\d+$/.test(answerString)) {
            const num = parseInt(answerString, 10);
            if (num > 0) {
              answerIndex = num - 1; // 1-based to 0-based
            } else {
              answerIndex = num; // Assume it's already 0-based
            }
          } else if (answerString.length === 1 && /[a-zA-Z]/.test(answerString)) {
            answerIndex = answerString.toUpperCase().charCodeAt(0) - 65;
          }
          
          const options =
            q.options && Array.isArray(q.options) && q.options.length > 0
              ? q.options
              : [q.option1, q.option2, q.option3, q.option4, q.option5].filter(
                  Boolean,
                );

          return {
            id: q.id,
            question: q.question || q.question_text || "",
            options: options,
            answer: answerIndex,
            explanation: q.explanation || "",
            type: q.type || null,
            section: q.section || null,
          };
        });
        setAllQuestions(convertedQuestions);
      } else {
        toast({
          title: "প্রশ্ন লোড করতে সমস্যা হয়েছে",
          variant: "destructive",
        });
      }

      if (user?.uid && exam_id) {
        const isCustom = searchParams.get('start_custom') === 'true';
        const storageKey = `exam_answers_${user.uid}_${exam_id}${isCustom ? '_custom' : ''}`;
        
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData);
            setLoadedUserAnswers(parsedData.answers || parsedData); // For backward compatibility
          } catch (e) {
            console.error("Failed to parse saved answers", e);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const customSectionsParam = searchParams.get('sections');
    if (customSectionsParam) {
      const customSections = customSectionsParam.split(',');
      const filtered = allQuestions.filter(q => q.section && customSections.includes(q.section.toLowerCase()));
      setQuestions(filtered);
    } else {
      setQuestions(allQuestions);
    }
  }, [allQuestions, searchParams]);

  const {
    correctAnswers,
    wrongAnswers,
    unattempted,
    finalScore,
    negativeMarks,
    marksFromCorrect,
  } = useMemo(() => {
    if (!loadedUserAnswers || questions.length === 0) {
      return {
        correctAnswers: 0,
        wrongAnswers: 0,
        unattempted: 0,
        finalScore: 0,
        negativeMarks: 0,
        marksFromCorrect: 0,
      };
    }
    let correct = 0;
    let wrong = 0;
    const answeredIds = Object.keys(loadedUserAnswers);

    questions.forEach((q) => {
      if (q.id && answeredIds.includes(q.id)) {
        if (loadedUserAnswers[q.id] === q.answer) {
          correct++;
        } else {
          wrong++;
        }
      }
    });

    const unattemptedCount = questions.length - (correct + wrong);
    const marksPerQuestion = exam?.marks_per_question || 1;
    const negativeMarksPerWrong = exam?.negative_marks_per_wrong || 0;
    const score = correct * marksPerQuestion - wrong * negativeMarksPerWrong;
    const totalNegative = wrong * negativeMarksPerWrong;

    return {
      correctAnswers: correct,
      wrongAnswers: wrong,
      unattempted: unattemptedCount,
      finalScore: score,
      negativeMarks: totalNegative,
      marksFromCorrect: correct * marksPerQuestion,
    };
  }, [loadedUserAnswers, questions, exam]);

  const filteredQuestions = useMemo(() => {
    if (filter === "all" || !loadedUserAnswers) {
      return questions;
    }

    return questions.filter((question) => {
      const userAnswer = loadedUserAnswers[question.id!];
      const isSkipped = userAnswer === undefined;
      const isCorrect = userAnswer === question.answer;

      if (filter === "correct") {
        return !isSkipped && isCorrect;
      }
      if (filter === "wrong") {
        return !isSkipped && !isCorrect;
      }
      if (filter === "skipped") {
        return isSkipped;
      }
      return false;
    });
  }, [filter, questions, loadedUserAnswers]);

  if (loading) {
    return <p>সমাধান লোড হচ্ছে...</p>;
  }

  if (!exam || questions.length === 0) {
    return <p>কোনো সমাধান পাওয়া যায়নি।</p>;
  }

  const totalNegativeMarksFromWrong =
    wrongAnswers * (exam?.negative_marks_per_wrong || 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/50 flex items-center justify-center p-2 md:p-4">
      <div className="w-full max-w-2xl space-y-6">
        <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-success/20 blur-2xl rounded-full"></div>
                <CheckCircle2 className="h-16 w-16 text-success relative" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">পরীক্ষা সম্পন্ন!</h1>
              <p className="text-muted-foreground text-lg">
                আপনার ফলাফল নিচে দেখুন
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <p className="text-sm font-semibold text-muted-foreground mb-2">
              আপনার মোট স্কোর
            </p>
            <div className="space-y-2">
              <div className="text-6xl font-black bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {finalScore.toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 space-y-2">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-semibold">সঠিক উত্তর</span>
              </div>
              <p className="text-3xl font-bold text-success">
                {correctAnswers}
              </p>
              <p className="text-xs text-muted-foreground">
                প্রাপ্ত নম্বর: {marksFromCorrect.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-2">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm font-semibold">ভুল উত্তর</span>
              </div>
              <p className="text-3xl font-bold text-destructive">
                {wrongAnswers}
              </p>
              <p className="text-xs text-muted-foreground">
                {totalNegativeMarksFromWrong > 0 ? "-" : ""}
                {totalNegativeMarksFromWrong.toFixed(2)} মার্ক
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-2">
              <div className="flex items-center gap-2 text-warning">
                <HelpCircle className="h-5 w-5" />
                <span className="text-sm font-semibold">চেষ্টা করেননি</span>
              </div>
              <p className="text-3xl font-bold text-warning">{unattempted}</p>
              <p className="text-xs text-muted-foreground">কোন মার্ক নেই</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Zap className="h-5 w-5" />
                <span className="text-sm font-semibold">নেগেটিভ মার্ক</span>
              </div>
              <p className="text-3xl font-bold text-primary">
                {negativeMarks > 0 ? "-" : ""}
                {negativeMarks.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                প্রতি ভুলে {exam?.negative_marks_per_wrong || 0}
              </p>
            </CardContent>
          </Card>
        </div>
        <Alert
          className={`mb-8 ${
            finalScore >= questions.length * 0.75
              ? "bg-success/5"
              : finalScore >= questions.length * 0.5
                ? "bg-warning/5"
                : "bg-destructive/5"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <AlertDescription
            className="text-sm mb-8"
            style={{ marginBottom: "2rem" }}
          >
            <strong>ফিডব্যাক:</strong>{" "}
            {finalScore >= questions.length * 0.75
              ? " চমৎকার! আপনি খুব ভালো করেছেন। এই মানের পরীক্ষা চালিয়ে যান।"
              : finalScore >= questions.length * 0.5
                ? " ভালো! আরও বেশি অনুশীলন করুন এবং পরবর্তী পরীক্ষায় আরও ভালো করতে পারবেন।"
                : " আরও বেশি মনোযোগ দিয়ে পড়ুন এবং পরবর্তী পরীক্ষায় আরও ভালো করুন।"}{" "}
            ।
          </AlertDescription>
        </Alert>

        <div className="space-y-6 mt-8">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between items-center">
              <h2 className="text-2xl font-bold">বিস্তারিত ফলাফল</h2>
              <div className="flex items-center gap-2 p-1 bg-muted rounded-md">
                <Button
                  size="sm"
                  variant={filter === "all" ? "default" : "ghost"}
                  onClick={() => setFilter("all")}
                >
                  সবগুলো
                </Button>
                <Button
                  size="sm"
                  variant={filter === "correct" ? "default" : "ghost"}
                  onClick={() => setFilter("correct")}
                >
                  সঠিক
                </Button>
                <Button
                  size="sm"
                  variant={filter === "wrong" ? "default" : "ghost"}
                  onClick={() => setFilter("wrong")}
                >
                  ভুল
                </Button>
                <Button
                  size="sm"
                  variant={filter === "skipped" ? "default" : "ghost"}
                  onClick={() => setFilter("skipped")}
                >
                  স্কিপ
                </Button>
              </div>
            </CardHeader>
          </Card>

          {filteredQuestions.length > 0 ? (
            filteredQuestions.map((question) => {
              const userAnswer = loadedUserAnswers
                ? loadedUserAnswers[question.id!]
                : undefined;
              const correctAnswer = question.answer;
              const isCorrect = userAnswer === correctAnswer;
              const isSkipped = userAnswer === undefined;

              return (
                <Card
                  key={question.id}
                  className={`mb-4 ${
                    isCorrect && !isSkipped
                      ? "bg-success/5 border-l-4 border-success"
                      : isSkipped
                        ? "bg-warning/5 border-l-4 border-warning"
                        : "bg-destructive/5 border-l-4 border-destructive"
                  }`}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-2">
                        <Badge
                          variant={
                            isCorrect && !isSkipped
                              ? "default"
                              : isSkipped
                                ? "outline"
                                : "destructive"
                          }
                          className={
                            isCorrect && !isSkipped
                              ? "bg-success"
                              : isSkipped
                                ? "text-warning border-warning"
                                : ""
                          }
                        >
                          {isCorrect && !isSkipped
                            ? "সঠিক"
                            : isSkipped
                              ? "উত্তর করা হয়নি"
                              : "ভুল"}
                        </Badge>
                        <h3 className="text-lg font-semibold">
                          <span className="mr-2">{questions.indexOf(question) + 1}.</span>
                          <LatexRenderer html={question.question} />
                        </h3>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      {(Array.isArray(question.options)
                        ? question.options
                        : Object.values(question.options)
                      ).map((option, optIdx) => {
                        const isSelected = userAnswer === optIdx;
                        const isRightAnswer = correctAnswer === optIdx;
                        const bengaliLetters = [
                          "ক",
                          "খ",
                          "গ",
                          "ঘ",
                          "ঙ",
                          "চ",
                          "ছ",
                          "জ",
                        ];

                        let optionClass =
                          "p-3 rounded-lg border flex items-center gap-3 ";
                        if (isRightAnswer) {
                          optionClass +=
                            "bg-success/20 border-success text-success-foreground font-medium";
                        } else if (isSelected && !isRightAnswer) {
                          optionClass +=
                            "bg-destructive/20 border-destructive text-destructive-foreground font-medium";
                        } else {
                          optionClass += "bg-background border-muted";
                        }

                        return (
                          <div key={optIdx} className={optionClass}>
                            <div
                              className={`w-6 h-6 rounded-full border flex items-center justify-center text-sm ${
                                isRightAnswer
                                  ? "border-success bg-success text-white"
                                  : isSelected
                                    ? "border-destructive bg-destructive text-white"
                                    : "border-muted"
                              }`}
                            >
                              {bengaliLetters[optIdx] ||
                                String.fromCharCode(65 + optIdx)}
                            </div>
                            <LatexRenderer html={option} />
                            {isRightAnswer && (
                              <CheckCircle2 className="h-4 w-4 text-success ml-auto" />
                            )}
                            {isSelected && !isRightAnswer && (
                              <AlertCircle className="h-4 w-4 text-destructive ml-auto" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {question.explanation && (
                      <div className="mt-4 pb-16 p-4 bg-muted/50 rounded-lg text-sm">
                        <p className="font-semibold mb-1">ব্যাখ্যা:</p>
                        <LatexRenderer html={question.explanation} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                এই ক্যাটাগরিতে কোনো প্রশ্ন পাওয়া যায়নি।
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex gap-3 pt-4 mt-6 pb-4 md:pb-8">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="flex-1 h-12"
            size="lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            পিছনে যান
          </Button>
          <Button
            onClick={() => router.push("/dashboard")}
            className="flex-1 h-12"
            size="lg"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            ড্যাশবোর্ডে যান
          </Button>
        </div>
        <hr className="h-16 border-transparent" />
      </div>
    </div>
  );
}
