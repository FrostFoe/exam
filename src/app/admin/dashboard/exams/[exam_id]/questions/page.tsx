"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BulkQuestionList from "@/components/BulkQuestionList";
import { fetchQuestions, type RawQuestion } from "@/lib/fetchQuestions";
import { supabase } from "@/lib/supabase";

export const runtime = "edge";

export default function ExamQuestionsPage() {
  const params = useParams();
  const exam_id = params.exam_id as string;

  const [questions, setQuestions] = useState<RawQuestion[]>([]);
  const [examName, setExamName] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!exam_id) return;

    const load = async () => {
      try {
        // try to fetch exam file_id to load questions
        const { data: examData, error } = await supabase
          .from("exams")
          .select("file_id, name")
          .eq("id", exam_id)
          .single();

        if (!error && examData) {
          setExamName(examData.name || undefined);
          if (examData.file_id) {
            const fetched = await fetchQuestions(examData.file_id);
            setQuestions(fetched || []);
          }
        }
      } catch (err) {
        // keep page minimal; failures silently result in empty questions
        console.error(err);
      }
    };

    load();
  }, [exam_id]);

  return (
    <div className="container mx-auto p-2 md:p-4 space-y-6">
      <BulkQuestionList questions={questions} examName={examName} />
    </div>
  );
}
