import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "edge";

interface Student {
  name: string;
  roll: string;
}

export async function POST(request: NextRequest) {
  try {
    const { examId } = await request.json();

    if (!examId) {
      return NextResponse.json({ error: "Exam ID required" }, { status: 400 });
    }

    // Fetch exam details
    const { data: exam, error: examError } = await supabase
      .from("exams")
      .select("*")
      .eq("id", examId)
      .single();

    if (examError || !exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Fetch all student results for this exam
    const { data: results, error: resultsError } = await supabase
      .from("student_exams")
      .select("*,student_id(name,roll)")
      .eq("exam_id", examId)
      .order("score", { ascending: false });

    if (resultsError) {
      return NextResponse.json(
        { error: "Failed to fetch results" },
        { status: 500 },
      );
    }

    // Create CSV content
    const headers = [
      "ক্র.স.",
      "রোল",
      "নাম",
      "স্কোর",
      "সঠিক",
      "ভুল",
      "উত্তর না দেওয়া",
      "জমা দেওয়ার সময়",
    ];

    const rows: string[] = [];

    // Add summary info as comments
    rows.push(`# পরীক্ষা: ${exam.name}`);
    rows.push(`# সময়: ${exam.duration_minutes} মিনিট`);
    rows.push(`# নেগেটিভ মার্ক: ${exam.negative_marks_per_wrong}`);
    rows.push(`# মোট শিক্ষার্থী: ${results?.length || 0}`);
    rows.push("");

    // Add CSV headers
    rows.push(headers.map((h) => `"${h}"`).join(","));

    // Add data rows
    (results || []).forEach((result, idx) => {
      const finalScore =
        result.correct_answers -
        result.wrong_answers * (exam?.negative_marks_per_wrong ?? 0);
      const row = [
        idx + 1,
        `"${(result.student_id as Student)?.roll || "N/A"}"`,
        `"${(result.student_id as Student)?.name || "N/A"}"`,
        finalScore.toFixed(2),
        result.correct_answers || 0,
        result.wrong_answers || 0,
        result.unattempted || 0,
        `"${new Date(result.submitted_at).toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" })}"`,
      ];
      rows.push(row.join(","));
    });

    const csv = rows.join("\n");

    // Return CSV as downloadable file
    const filename = `${exam.name.replace(/\s+/g, "_")}_results_${Date.now()}.csv`;
    const encoder = new TextEncoder();
    return new NextResponse(encoder.encode(csv), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("CSV export error:", error);
    return NextResponse.json(
      { error: "Failed to export CSV" },
      { status: 500 },
    );
  }
}
