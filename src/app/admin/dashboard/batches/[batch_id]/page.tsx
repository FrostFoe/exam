import { supabase } from "@/lib/supabase";
import type { Batch, Exam, User } from "@/lib/types";
import { BatchDetailsClient } from "./BatchDetailsClient";
import { use } from "react";

export const runtime = "edge";

async function getBatchDetails(batch_id: string) {
  const { data, error } = await supabase
    .from("batches")
    .select("*")
    .eq("id", batch_id)
    .single();
  return { batch: data as Batch, error };
}

async function getExams(batch_id: string) {
  const { data, error } = await supabase
    .from("exams")
    .select("*")
    .eq("batch_id", batch_id);
  return { exams: data as Exam[], error };
}

async function getEnrolledStudents(batch_id: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .contains("enrolled_batches", [batch_id]);
  return { students: data as User[], error };
}

export default function BatchExamsPage({
  params,
}: {
  params: Promise<{ batch_id: string }>;
}) {
  const { batch_id } = use(params);

  const [batchResult, examsResult, studentsResult] = use(
    Promise.all([
      getBatchDetails(batch_id),
      getExams(batch_id),
      getEnrolledStudents(batch_id),
    ]),
  );

  const { batch, error: batchError } = batchResult;
  const { exams, error: examsError } = examsResult;
  const { students, error: studentsError } = studentsResult;

  if (batchError || examsError || studentsError) {
    const errorMessages = [];
    if (batchError) errorMessages.push(batchError.message);
    if (examsError) errorMessages.push(examsError.message);
    if (studentsError) errorMessages.push(studentsError.message);
    return <p>তথ্য আনতে সমস্যা হয়েছে: {errorMessages.join(", ")}</p>;
  }

  return (
    <BatchDetailsClient
      initialBatch={batch}
      initialExams={exams}
      initialEnrolledStudents={students}
    />
  );
}
