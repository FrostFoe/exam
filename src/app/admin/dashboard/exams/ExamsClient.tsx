
"use client";

import { useState, useRef, useEffect, FormEvent, useMemo } from "react";
import { PageHeader } from "@/components";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { AdminExamCard } from "@/components/AdminExamCard";
import type { Exam, Batch } from "@/lib/types";
import { CalendarIcon, ChevronDown, Loader2, PlusCircle } from "lucide-react";
import { createExam } from "@/lib/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const subjects = [
  { id: "p", name: "পদার্থবিজ্ঞান" },
  { id: "c", name: "রসায়ন" },
  { id: "m", name: "উচ্চতর গণিত" },
  { id: "b", name: "জীববিজ্ঞান" },
  { id: "bm", name: "জীববিজ্ঞান + উচ্চতর গণিত" },
  { id: "bn", name: "বাংলা" },
  { id: "e", name: "ইংরেজী" },
  { id: "i", name: "আইসিটি" },
  { id: "gk", name: "জিকে" },
  { id: "iq", name: "আইকিউ" },
];

const bengaliToEnglishNumber = (str: string) => {
  const bengaliNumerals = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  let newStr = str;
  for (let i = 0; i < 10; i++) {
    newStr = newStr.replace(new RegExp(bengaliNumerals[i], "g"), i.toString());
  }
  return newStr;
};

const hours12 = Array.from({ length: 12 }, (_, i) =>
  (i + 1).toString().padStart(2, "0"),
);
const minutes = Array.from({ length: 60 }, (_, i) =>
  i.toString().padStart(2, "0"),
);

export function ExamsClient({
  initialExams,
  initialBatches,
}: {
  initialExams: Exam[];
  initialBatches: Batch[];
}) {
  const { admin } = useAdminAuth();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddExamOpen, setIsAddExamOpen] = useState(false);
  const [mode, setMode] = useState<"live" | "practice">("live");
  const [exams, setExams] = useState<Exam[]>(initialExams);
  const [isCustomExam, setIsCustomExam] = useState(false);

  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [startHour, setStartHour] = useState("12");
  const [startMinute, setStartMinute] = useState("00");
  const [startPeriod, setStartPeriod] = useState<"AM" | "PM">("AM");

  const [endDate, setEndDate] = useState<Date | undefined>(
    new Date(new Date().getTime() + 60 * 60 * 1000),
  );
  const [endHour, setEndHour] = useState("01");
  const [endMinute, setEndMinute] = useState("00");
  const [endPeriod, setEndPeriod] = useState<"AM" | "PM">("AM");

  const publicExams = useMemo(
    () => exams.filter((exam) => !exam.batch_id),
    [exams],
  );

  const batchedExams = useMemo(
    () =>
      initialBatches
        .map((batch) => ({
          ...batch,
          exams: exams.filter((exam) => exam.batch_id === batch.id),
        }))
        .filter((batch) => batch.exams.length > 0),
    [exams, initialBatches],
  );

  useEffect(() => {
    if (mode === "live") {
      const now = new Date();
      setStartDate(now);
      const currentHour = now.getHours();
      setStartPeriod(currentHour >= 12 ? "PM" : "AM");
      setStartHour(
        (currentHour % 12 === 0 ? 12 : currentHour % 12)
          .toString()
          .padStart(2, "0"),
      );
      setStartMinute(now.getMinutes().toString().padStart(2, "0"));

      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      setEndDate(oneHourLater);
      const endHour24 = oneHourLater.getHours();
      setEndPeriod(endHour24 >= 12 ? "PM" : "AM");
      setEndHour(
        (endHour24 % 12 === 0 ? 12 : endHour24 % 12)
          .toString()
          .padStart(2, "0"),
      );
      setEndMinute(oneHourLater.getMinutes().toString().padStart(2, "0"));
    }
  }, [mode]);

  const handleNumberInput = (e: FormEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    input.value = bengaliToEnglishNumber(input.value);
  };

  const combineDateTime = (
    date?: Date,
    hour?: string,
    minute?: string,
    period?: "AM" | "PM",
  ) => {
    if (!date || !hour || !minute || !period) return null;
    let h24 = parseInt(hour, 10);
    if (period === "PM" && h24 !== 12) {
      h24 += 12;
    }
    if (period === "AM" && h24 === 12) {
      h24 = 0;
    }
    const newDate = new Date(date);
    newDate.setHours(h24, parseInt(minute, 10), 0, 0);
    return newDate.toISOString();
  };

  if (!admin) {
    return <div className="container mx-auto p-2 md:p-4">লোড হচ্ছে...</div>;
  }

  const renderExamGrid = (examsToRender: Exam[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {examsToRender.map((exam) => (
        <AdminExamCard
          key={exam.id}
          exam={exam}
          onDelete={() =>
            setExams((prev) => prev.filter((e) => e.id !== exam.id))
          }
        />
      ))}
    </div>
  );

  return (
    <div className="container mx-auto p-2 md:p-4 space-y-6">
      <PageHeader
        title="পরীক্ষা (অ্যাডমিন)"
        description="এখানে পাবলিক ও ব্যাচ-ভিত্তিক পরীক্ষাগুলি দেখুন ও তৈরি করুন"
      />

      <Card>
        <CardHeader>
          <CardTitle>নতুন পরীক্ষা তৈরি করুন</CardTitle>
        </CardHeader>
        <CardContent>
          <Collapsible open={isAddExamOpen} onOpenChange={setIsAddExamOpen}>
            <CollapsibleTrigger asChild>
              <Button size="sm" className="w-full justify-start gap-2">
                <PlusCircle className="h-4 w-4" />
                নতুন পরীক্ষা যোগ করুন
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="py-4">
              <form
                ref={formRef}
                action={async (formData) => {
                  setIsSubmitting(true);
                  const startAtISO = combineDateTime(
                    startDate,
                    startHour,
                    startMinute,
                    startPeriod,
                  );
                  const endAtISO = combineDateTime(
                    endDate,
                    endHour,
                    endMinute,
                    endPeriod,
                  );
                  if (startAtISO) formData.set("start_at", startAtISO);
                  if (endAtISO) formData.set("end_at", endAtISO);

                  const result = await createExam(formData);
                  if (result.success) {
                    toast({ title: "নতুন পরীক্ষা তৈরি হয়েছে" });
                    formRef.current?.reset();
                    setIsAddExamOpen(false);
                    // Optimistically add to state
                    if (result.data) {
                      setExams((prev) => [result.data as Exam, ...prev]);
                    }
                  } else {
                    toast({
                      title: "ত্রুটি",
                      description: "পরীক্ষা তৈরি করতে ব্যর্থ",
                      variant: "destructive",
                    });
                  }
                  setIsSubmitting(false);
                }}
                className="space-y-3 border p-4 rounded-md"
              >
                <div className="flex items-center gap-3">
                  <Label htmlFor="mode">পরীক্ষার মোড</Label>
                  <Select
                    value={mode}
                    onValueChange={(value) =>
                      setMode(value as "live" | "practice")
                    }
                  >
                    <SelectTrigger id="mode" className="w-[220px]">
                      <SelectValue placeholder="পরীক্ষার মোড নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="live">লাইভ (Time-limited)</SelectItem>
                      <SelectItem value="practice">
                        প্রাকটিস (আনলিমিটেড)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="exam-name">পরীক্ষার নাম</Label>
                    <Input
                      id="exam-name"
                      name="name"
                      placeholder="পরীক্ষার নাম"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batch_id">ব্যাচ (ঐচ্ছিক)</Label>
                    <Select name="batch_id" defaultValue="public">
                      <SelectTrigger>
                        <SelectValue placeholder="একটি ব্যাচ নির্বাচন করুন" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">পাবলিক পরীক্ষা</SelectItem>
                        {initialBatches.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">সময় (মিনিট)</Label>
                    <Input
                      id="duration"
                      name="duration_minutes"
                      defaultValue="40"
                      placeholder="সময় (মিনিট)"
                      type="number"
                      onInput={handleNumberInput}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="marks_per_question">
                      প্রশ্ন প্রতি মার্ক
                    </Label>
                    <Input
                      id="marks_per_question"
                      name="marks_per_question"
                      type="number"
                      step="0.1"
                      defaultValue="1"
                      placeholder="প্রশ্ন প্রতি মার্ক"
                      onInput={handleNumberInput}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="negative_marks">নেগেটিভ মার্ক</Label>
                    <Input
                      id="negative_marks"
                      name="negative_marks_per_wrong"
                      defaultValue="0.25"
                      placeholder="নেগেটিভ মার্ক"
                      type="number"
                      step="0.01"
                      onInput={handleNumberInput}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 items-center">
                  {mode === "live" && (
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label>শুরুর সময়</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !startDate && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {startDate ? (
                                startDate.toLocaleDateString("bn-BD")
                              ) : (
                                <span>তারিখ বাছুন</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto p-0"
                            align="start"
                          >
                            <Calendar
                              mode="single"
                              selected={startDate}
                              onSelect={setStartDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <div className="flex gap-2">
                          <Select
                            value={startHour}
                            onValueChange={setStartHour}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="ঘন্টা" />
                            </SelectTrigger>
                            <SelectContent>
                              {hours12.map((h) => (
                                <SelectItem key={h} value={h}>
                                  {h}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={startMinute}
                            onValueChange={setStartMinute}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="মিনিট" />
                            </SelectTrigger>
                            <SelectContent>
                              {minutes.map((m) => (
                                <SelectItem key={m} value={m}>
                                  {m}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={startPeriod}
                            onValueChange={(v) =>
                              setStartPeriod(v as "AM" | "PM")
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="AM/PM" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AM">AM</SelectItem>
                              <SelectItem value="PM">PM</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>শেষ হওয়ার সময়</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !endDate && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {endDate ? (
                                endDate.toLocaleDateString("bn-BD")
                              ) : (
                                <span>তারিখ বাছুন</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto p-0"
                            align="start"
                          >
                            <Calendar
                              mode="single"
                              selected={endDate}
                              onSelect={setEndDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <div className="flex gap-2">
                          <Select value={endHour} onValueChange={setEndHour}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="ঘন্টা" />
                            </SelectTrigger>
                            <SelectContent>
                              {hours12.map((h) => (
                                <SelectItem key={h} value={h}>
                                  {h}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={endMinute}
                            onValueChange={setEndMinute}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="মিনিট" />
                            </SelectTrigger>
                            <SelectContent>
                              {minutes.map((m) => (
                                <SelectItem key={m} value={m}>
                                  {m}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={endPeriod}
                            onValueChange={(v) =>
                              setEndPeriod(v as "AM" | "PM")
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="AM/PM" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AM">AM</SelectItem>
                              <SelectItem value="PM">PM</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                  <input
                    name="is_practice"
                    type="hidden"
                    value={mode === "practice" ? "true" : "false"}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="file_id">Question file_id (optional)</Label>
                    <Input
                      id="file_id"
                      name="file_id"
                      placeholder="Question file_id (optional)"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-4 pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="shuffle-questions-toggle-public"
                      name="shuffle_questions"
                      value="true"
                    />
                    <Label htmlFor="shuffle-questions-toggle-public">
                      প্রশ্নগুলো এলোমেলো করুন
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="shuffle_sections_only_public"
                      name="shuffle_sections_only"
                      value="true"
                    />
                    <Label htmlFor="shuffle_sections_only_public">
                      সেকশন অনুসারে এলোমেলো করুন
                    </Label>
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="custom-exam-toggle-public"
                    checked={isCustomExam}
                    onCheckedChange={(checked) =>
                      setIsCustomExam(checked as boolean)
                    }
                  />
                  <Label htmlFor="custom-exam-toggle-public">
                    কাস্টম এক্সাম
                  </Label>
                </div>

                {isCustomExam && (
                  <div className="space-y-4 p-4 border rounded-md">
                    <div className="space-y-2">
                      <Label htmlFor="total_subjects">মোট বিষয়</Label>
                      <Input
                        id="total_subjects"
                        name="total_subjects"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="e.g., 4"
                        onInput={handleNumberInput}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>দাগানো বাধ্যতামূলক</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {subjects.map((subject) => (
                          <div
                            key={`mandatory-public-${subject.id}`}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`mandatory-public-${subject.id}`}
                              name="mandatory_subjects"
                              value={subject.id}
                            />
                            <Label htmlFor={`mandatory-public-${subject.id}`}>
                              {subject.name} ({subject.id})
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>অন্যান্য বিষয়</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {subjects.map((subject) => (
                          <div
                            key={`optional-public-${subject.id}`}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`optional-public-${subject.id}`}
                              name="optional_subjects"
                              value={subject.id}
                            />
                            <Label htmlFor={`optional-public-${subject.id}`}>
                              {subject.name} ({subject.id})
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        তৈরি হচ্ছে...
                      </>
                    ) : (
                      "তৈরি করুন"
                    )}
                  </Button>
                </div>
              </form>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Collapsible className="rounded-lg border">
          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 font-semibold">
            <span>পাবলিক পরীক্ষা ({publicExams.length})</span>
            <ChevronDown className="h-5 w-5 transition-transform duration-300 [&[data-state=open]]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4 pt-0">
            {publicExams.length > 0 ? (
              renderExamGrid(publicExams)
            ) : (
              <p className="text-muted-foreground text-sm">
                কোনো পাবলিক পরীক্ষা নেই।
              </p>
            )}
          </CollapsibleContent>
        </Collapsible>

        {batchedExams.map((batch) => (
          <Collapsible key={batch.id} className="rounded-lg border">
            <CollapsibleTrigger className="flex w-full items-center justify-between p-4 font-semibold">
              <span>
                {batch.name} ({batch.exams.length})
              </span>
              <ChevronDown className="h-5 w-5 transition-transform duration-300 [&[data-state=open]]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 pt-0">
              {renderExamGrid(batch.exams)}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
      <hr className="h-16 border-transparent" />
    </div>
  );
}
