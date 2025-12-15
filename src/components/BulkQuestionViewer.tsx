"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type QuestionLike = {
  id?: string;
  question?: string;
  question_text?: string;
  options?: string[];
  answer?: number | string;
  explanation?: string;
  [key: string]: unknown;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: QuestionLike[] | null;
}
export default function BulkQuestionViewer({
  open,
  onOpenChange,
  questions,
}: Props) {
  const [mode, setMode] = React.useState<"question" | "solution">("question");

  React.useEffect(() => {
    // Reset to question only when closed
    if (!open) setMode("question");
  }, [open]);

  React.useEffect(() => {
    // autoPrint removed — printing handled elsewhere if needed
    if (open) {
      // keep current behavior of resetting mode on open
    }
  }, [open]);

  // printing removed: printable HTML and window.print are no longer used

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>সকল প্রশ্ন দেখুন</DialogTitle>
          <DialogDescription>
            এখানে আপনি সকল প্রশ্ন শুধুমাত্র বা সমাধান সহ দেখতে পারবেন।
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between mt-2 mb-4 gap-2 flex-wrap">
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
              সম্পূর্ণ সমাধান
            </Button>

            {/* Print removed */}
          </div>
          <div className="text-sm text-muted-foreground">
            ({questions?.length || 0} টি প্রশ্ন)
          </div>
        </div>

        <div
          className={cn(
            "prose dark:prose-invert max-w-none p-4 rounded-md border space-y-6 max-h-[60vh] overflow-y-auto",
            mode === "question" ? "bg-white/50" : "bg-muted/10",
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
                      __html: q.question || q.question_text || "",
                    }}
                  />
                </div>

                {/* Options - show options in question-only view as well */}
                {q.options && (
                  <div className="mt-3 space-y-2 ml-4">
                    {Array.isArray(q.options)
                      ? (q.options as unknown as string[]).map(
                          (opt: string, i: number) => (
                            <div key={i} className="flex items-start gap-2">
                              <div className="font-semibold">
                                {String.fromCharCode(65 + i)}.
                              </div>
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: String(opt),
                                }}
                              />
                            </div>
                          ),
                        )
                      : null}

                    {/* Answer & explanation - show only in solution or print mode */}
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
                                __html: q.explanation,
                              }}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">কোনো প্রশ্ন নেই</p>
          )}
        </div>

        <div className="flex justify-end mt-4 gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            বন্ধ করুন
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
