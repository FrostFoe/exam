import { supabase } from "@/lib/supabase";
import type { Exam, Batch } from "@/lib/types";
import { ExamsClient } from "./ExamsClient";

async function getExams() {
  const { data, error } = await supabase
    .from("exams")
    .select("*")
    .order("created_at", { ascending: false });
  return { exams: data as Exam[], error };
}

async function getBatches() {
  const { data, error } = await supabase.from("batches").select("id, name");
  return { batches: (data as Batch[]) || [], error };
}

export default async function AdminExamsPage() {
  const [{ exams, error: examsError }, { batches, error: batchesError }] =
    await Promise.all([getExams(), getBatches()]);

  if (examsError || batchesError) {
    const errorMessages = [];
    if (examsError) errorMessages.push(examsError.message);
    if (batchesError) errorMessages.push(batchesError.message);
    return <p>তথ্য আনতে সমস্যা হয়েছে: {errorMessages.join(", ")}</p>;
  }

  return <ExamsClient initialExams={exams} initialBatches={batches} />;
}
