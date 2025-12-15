import { supabase } from "@/lib/supabase";
import type { Batch } from "@/lib/types";
import { BatchesClient } from "./BatchesClient";

export default async function AdminBatchesPage() {
  const { data: batches, error } = await supabase.from("batches").select("*");

  if (error) {
    console.error("ব্যাচ আনতে সমস্যা হয়েছে:", error);
    return <p>ব্যাচ আনতে সমস্যা হয়েছে: {error.message}</p>;
  }

  return <BatchesClient initialBatches={batches as Batch[]} />;
}
