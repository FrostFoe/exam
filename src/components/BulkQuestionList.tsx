"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RawQuestion } from "@/lib/fetchQuestions";

type Props = {
  questions: RawQuestion[] | null;
  examName?: string;
};

export default function BulkQuestionList({ questions, examName }: Props) {
  const [mode, setMode] = React.useState<"question" | "solution">("question");

  const buildPrintableHtml = (printMode: "question" | "solution") => {
    if (!questions || questions.length === 0) return "";

    const questionsHtml = (questions || [])
      .map((q, idx) => {
        const qHtml = (q.question || q.question_text || "").replace(
          /<img/g,
          '<img class="qimg"',
        );
        const optsCandidate = (q as Record<string, unknown>).options;
        const opts = Array.isArray(optsCandidate)
          ? (optsCandidate as string[]).map(String)
          : [q.option1, q.option2, q.option3, q.option4, q.option5].filter(
              (o): o is string => Boolean(o),
            );
        const answer =
          typeof q.answer === "number"
            ? String.fromCharCode(65 + Number(q.answer))
            : String(q.answer || "");
        const explanation = (q.explanation || "").replace(
          /<img/g,
          '<img class="qimg"',
        );

        const optionsHtml = opts
          .map(
            (o, i) =>
              `<div style='margin-bottom:6px;'><strong>${String.fromCharCode(65 + i)}.</strong> ${o}</div>`,
          )
          .join("");

        const answerHtml =
          printMode === "solution"
            ? `<div style='margin-top: 12px; padding: 8px; background-color: #f3f4f6; border-radius: 4px'><strong style='color: #374151'>উত্তর:</strong> <span style='font-weight: bold; color: #059669'>${answer}</span></div>`
            : "";

        const explanationHtml =
          printMode === "solution" && explanation
            ? `<div style='margin-top: 8px; padding: 8px; background-color: #fef3c7; border-radius: 4px'><strong style='color: #78350f'>ব্যাখ্যা:</strong><div style='margin-top: 4px; color: #92400e'>${explanation}</div></div>`
            : "";

        return `
          <div style='page-break-inside: avoid; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb'>
            <div style='margin-bottom: 8px'>
              <strong style='font-size: 16px'>প্রশ্ন ${idx + 1}.</strong>
              <div style='margin-top: 4px; font-size: 15px'>${qHtml}</div>
            </div>
            <div style='margin-top: 12px; margin-left: 12px'>${optionsHtml}</div>
            ${answerHtml}
            ${explanationHtml}
          </div>
        `;
      })
      .join("");

    return `
      <html>
        <head>
          <meta charset='UTF-8' />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${examName || "সকল প্রশ্ন"}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap');
            body { 
              font-family: 'Hind Siliguri', sans-serif; 
              padding: 24px; 
              color: #111827; 
              line-height: 1.6;
              position: relative;
            }
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              z-index: -1;
              opacity: 0.05;
              width: 60%;
            }
            .container { max-width: 900px; margin: 0 auto }
            .header { text-align: center; margin-bottom: 32px; border-bottom: 2px solid #1f2937; padding-bottom: 16px; }
            .header h1 { margin: 0; font-size: 28px; color: #1f2937 }
            .header p { margin: 8px 0 0 0; color: #6b7280; font-size: 14px }
            .meta { margin-top: 12px; padding: 8px 12px; background-color: #f9fafb; border-radius: 4px; font-size: 12px; color: #6b7280; }
            .footer { text-align: center; font-size: 10px; color: #999; margin-top: 30px; }
            .qimg {
              width: 100%;
              max-width: 400px;
            }
            @media print { body { padding: 12px } .container { max-width: 100% } .header { page-break-after: avoid } }
          </style>
        </head>
        <body>
          <div class="watermark">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 171.000002">
              <path fill="#f41212" d="M149.06 94.19 76.86 94.36l14.84 25.57 98.12-.22-68.58-118.16-19.41 11.26 47.23 81.38Z"/>
              <path fill="#009f0b" d="m2.14 50.25 68.58 118.16 19.42-11.26-47.23-81.41 72.2-0.16-14.84-25.57-98.12.22Z"/>
            </svg>
          </div>
          <div class="container">
            <div class="header">
              <h1>${examName || "সকল প্রশ্ন"}</h1>
              <p>মোট প্রশ্ন: ${questions.length}</p>
              <div class="meta">নির্মিত: ${new Date().toLocaleString("bn-BD")}</div>
            </div>
            ${questionsHtml}
            <div class="footer">
              <p style="font-weight: bold; font-size: 12px;">&copy; MNR Exam</p>
              <p>Generated on: ${new Date().toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" })}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handlePrintMode = (printMode: "question" | "solution") => {
    if (!questions || questions.length === 0) return;

    // Build HTML and open in new window synchronously (user-initiated click)
    const html = buildPrintableHtml(printMode);
    try {
      const blob = new Blob([html], { type: "text/html" });
      const url = window.URL.createObjectURL(blob);
      const newWin = window.open(url, "_blank");
      if (!newWin) {
        // fallback: download the HTML file
        const a = document.createElement("a");
        a.href = url;
        a.download = `${examName || "questions"}_${printMode}.html`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        return;
      }

      // Try to print after load
      newWin.focus();
      setTimeout(() => {
        try {
          newWin.print();
        } catch (err) {
          console.error("Print failed:", err);
        }
      }, 400);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex gap-2 items-center">
          <Button
            variant={mode === "question" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("question")}
          >
            শুধু প্রশ্ন
          </Button>
          <Button
            variant={mode === "solution" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("solution")}
          >
            সমাধান
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePrintMode("question")}
          >
            প্রশ্ন প্রিন্ট
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePrintMode("solution")}
          >
            সমাধানসহ প্রিন্ট
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          ({questions?.length || 0} টি প্রশ্ন)
        </div>
      </div>

      <div
        className={cn(
          "prose dark:prose-invert max-w-none p-4 rounded-md border space-y-6 bg-card text-card-foreground",
        )}
      >
        {questions && questions.length > 0 ? (
          questions.map((q, idx) => (
            <div key={q.id || idx} className="border-b pb-6 last:border-b-0">
              <div className="mb-3">
                <strong className="text-lg">প্রশ্ন {idx + 1}.</strong>
                <div
                  className="mt-2"
                  dangerouslySetInnerHTML={{
                    __html: (q.question || q.question_text || "").replace(
                      /<img/g,
                      '<img class="qimg"',
                    ),
                  }}
                />
              </div>

              {(() => {
                const optsCandidate = (q as Record<string, unknown>).options;
                const optsArr: string[] = Array.isArray(optsCandidate)
                  ? (optsCandidate as string[]).map(String)
                  : [
                      q.option1,
                      q.option2,
                      q.option3,
                      q.option4,
                      q.option5,
                    ].filter((o): o is string => Boolean(o));
                if (!optsArr || optsArr.length === 0) return null;
                return (
                  <div className="mt-3 space-y-2 ml-4">
                    {optsArr.map((opt: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="font-semibold">
                          {String.fromCharCode(65 + i)}.
                        </div>
                        <div
                          dangerouslySetInnerHTML={{ __html: String(opt) }}
                        />
                      </div>
                    ))}

                    {mode === "solution" && (
                      <>
                        <div className="mt-3 pt-3 border-t text-sm">
                          <strong>উত্তর:</strong>
                          <span className="ml-2">
                            {typeof q.answer === "number"
                              ? String.fromCharCode(65 + Number(q.answer))
                              : String(q.answer)}
                          </span>
                        </div>

                        {q.explanation && (
                          <div className="mt-3">
                            <strong>ব্যাখ্যা:</strong>
                            <div
                              className="mt-1 text-sm"
                              dangerouslySetInnerHTML={{
                                __html: (q.explanation || "").replace(
                                  /<img/g,
                                  '<img class="qimg"',
                                ),
                              }}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">কোনো প্রশ্ন নেই</p>
        )}
      </div>
    </div>
  );
}
