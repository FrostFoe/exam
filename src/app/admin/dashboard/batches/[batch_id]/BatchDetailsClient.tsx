
"use client";

import { useState, useRef, type FormEvent, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import ConfirmPasswordDialog from "@/components/ConfirmPasswordDialog";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { verifyAdminPassword } from "@/lib/admin";
import type { Batch, Exam, User } from "@/lib/types";
import { CalendarIcon, Loader2, PlusCircle } from "lucide-react";
import { EditExamModal } from "@/components/EditExamModal";
import {
  createExam,
  deleteExam,
  enrollStudent,
  removeStudentFromBatch,
} from "@/lib/actions";
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

interface BatchDetailsClientProps {
  initialBatch: Batch;
  initialExams: Exam[];
  initialEnrolledStudents: User[];
}

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

export function BatchDetailsClient({
  initialBatch,
  initialExams,
  initialEnrolledStudents,
}: BatchDetailsClientProps) {
  const { toast } = useToast();

  const [batch] = useState<Batch | null>(initialBatch);
  const [exams] = useState<Exam[]>(initialExams);
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);
  const [isAddExamOpen, setIsAddExamOpen] = useState(false);
  const [mode, setMode] = useState<"live" | "practice">("live");
  const [enrolledStudents] = useState<User[]>(initialEnrolledStudents);
  const [newStudentRoll, setNewStudentRoll] = useState("");
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingStudent, setPendingStudent] = useState<User | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    type: "exam" | "student";
    id: string;
    label?: string;
  } | null>(null);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const addExamFormRef = useRef<HTMLFormElement>(null);
  const addStudentFormRef = useRef<HTMLFormElement>(null);
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

  const batch_id = batch?.id;

  const { admin } = useAdminAuth();

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

  const requestDeleteExam = (examId: string, examName?: string) => {
    setPendingDelete({ type: "exam", id: examId, label: examName });
    setIsPasswordOpen(true);
  };

  const requestDeleteStudent = (studentId: string, studentName?: string) => {
    setPendingDelete({ type: "student", id: studentId, label: studentName });
    setIsPasswordOpen(true);
  };

  const handleConfirmDelete = async (password: string) => {
    if (!pendingDelete) return;

    if (!admin) {
      toast({ variant: "destructive", title: "অধিকার নেই" });
      setIsPasswordOpen(false);
      setPendingDelete(null);
      return;
    }

    const ok = await verifyAdminPassword(admin.uid, password);
    if (!ok) {
      toast({ variant: "destructive", title: "ভুল পাসওয়ার্ড" });
      return;
    }

    const formData = new FormData();
    formData.append("id", pendingDelete.id);
    if (batch_id) {
      formData.append("batch_id", batch_id);
    }
    if (pendingDelete.type === "exam") {
      const result = await deleteExam(formData);
      if (result.success) {
        toast({ title: "পরীক্ষা সফলভাবে মুছে ফেলা হয়েছে" });
      } else {
        toast({
          title: "পরীক্ষা মুছে ফেলতে সমস্যা হয়েছে",
          description: result.message,
          variant: "destructive",
        });
      }
    } else if (pendingDelete.type === "student") {
      formData.append("user_id", pendingDelete.id);
      const result = await removeStudentFromBatch(formData);
      if (result.success) {
        toast({ title: "ছাত্রছাত্রী সফলভাবে মুছে ফেলা হয়েছে" });
      } else {
        toast({
          title: "ছাত্রছাত্রী মুছে ফেলতে সমস্যা হয়েছে",
          description: result.message,
          variant: "destructive",
        });
      }
    }

    setPendingDelete(null);
    setIsPasswordOpen(false);
  };

  const handleAddStudent = async (e: FormEvent) => {
    e.preventDefault();
    if (!newStudentRoll.trim() || !batch_id) {
      toast({
        title: "ছাত্রছাত্রীর রোল এবং ব্যাচ আইডি আবশ্যক",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingStudent(true);

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("roll", newStudentRoll.trim())
      .single();

    if (userError || !user) {
      toast({
        title: "ছাত্রছাত্রী খুঁজে পাওয়া যায়নি",
        description: `রোল ${newStudentRoll.trim()} সহ কোনো ছাত্রছাত্রী পাওয়া যায়নি।`,
        variant: "destructive",
      });
      setIsSubmittingStudent(false);
      return;
    }

    if (user.enrolled_batches && user.enrolled_batches.includes(batch_id)) {
      toast({
        title: "ছাত্রছাত্রী ইতিমধ্যে ভর্তি আছে",
        description: `রোল ${newStudentRoll.trim()} সহ ছাত্রছাত্রী এই ব্যাচে ইতিমধ্যে ভর্তি আছে।`,
        variant: "destructive",
      });
      setIsSubmittingStudent(false);
      return;
    }

    // Show confirmation dialog
    setPendingStudent(user);
    setShowConfirmation(true);
    setIsSubmittingStudent(false);
  };

  const handleConfirmAddStudent = async () => {
    if (!pendingStudent || !batch_id) return;

    setIsSubmittingStudent(true);
    setShowConfirmation(false);

    const formData = new FormData();
    formData.append("user_id", pendingStudent.uid);
    formData.append("batch_id", batch_id);

    const result = await enrollStudent(formData);
    if (result.success) {
      toast({
        title: "ছাত্রছাত্রী সফলভাবে যোগ করা হয়েছে",
        description: `${pendingStudent.name} (রোল: ${pendingStudent.roll}) ব্যাচে যুক্ত হয়েছেন।`,
      });
      setNewStudentRoll("");
      addStudentFormRef.current?.reset();
    } else {
      toast({
        title: "ছাত্রছাত্রী যোগ করতে সমস্যা হয়েছে",
        description: result.message,
        variant: "destructive",
      });
    }

    setPendingStudent(null);
    setIsSubmittingStudent(false);
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

  if (!batch) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <span>ব্যাচের বিবরণ লোড হচ্ছে...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-2 md:p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ব্যাচের তথ্য - {batch.name}</CardTitle>
          <CardDescription>ব্যাচের বিবরণ এবং অবস্থা দেখুন।</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">ব্যাচের নাম</p>
              <p className="text-lg font-semibold">{batch.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">অবস্থা</p>
              <span
                className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                  batch.status === "live"
                    ? "bg-green-500/20 text-green-700"
                    : "bg-gray-500/20 text-gray-700"
                }`}
              >
                {batch.status === "live" ? "লাইভ" : "শেষ"}
              </span>
            </div>
            {batch.description && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">বিবরণ</p>
                <p className="text-base">{batch.description}</p>
              </div>
            )}
            {batch.icon_url && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">আইকন</p>
                <img
                  src={batch.icon_url}
                  alt={batch.name}
                  className="h-16 w-16 object-cover rounded"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>পরীক্ষা পরিচালনা</CardTitle>
            <CardDescription>
              এই ব্যাচের জন্য পরীক্ষা তৈরি এবং পরিচালনা করুন।
            </CardDescription>
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
                  ref={addExamFormRef}
                  action={async (formData) => {
                    setIsSubmittingExam(true);
                    if (batch_id) {
                      formData.append("batch_id", batch_id);
                    }
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
                      toast({ title: "পরীক্ষা সফলভাবে যোগ করা হয়েছে" });
                      addExamFormRef.current?.reset();
                      setIsAddExamOpen(false);
                    } else {
                      toast({
                        title: "পরীক্ষা যোগ করতে সমস্যা হয়েছে",
                        description: result.message,
                        variant: "destructive",
                      });
                    }
                    setIsSubmittingExam(false);
                  }}
                  className="space-y-4 p-4 border rounded-md"
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
                        <SelectItem value="live">
                          লাইভ (Time-limited)
                        </SelectItem>
                        <SelectItem value="practice">
                          প্রাকটিস (আনলিমিটেড)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exam-name">নতুন পরীক্ষার নাম</Label>
                    <Input
                      id="exam-name"
                      type="text"
                      name="name"
                      placeholder="নতুন পরীক্ষার নাম"
                      disabled={isSubmittingExam}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">পরীক্ষার সময় (মিনিট)</Label>
                    <Input
                      id="duration"
                      type="number"
                      name="duration_minutes"
                      placeholder=" পরীক্ষার সময় (মিনিট)"
                      defaultValue="40"
                      disabled={isSubmittingExam}
                      required={mode === "live"}
                      onInput={handleNumberInput}
                    />
                  </div>
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
                    <Label htmlFor="marks_per_question">
                      প্রশ্ন প্রতি মার্ক
                    </Label>
                    <Input
                      id="marks_per_question"
                      type="number"
                      step="0.1"
                      name="marks_per_question"
                      placeholder="প্রশ্ন প্রতি মার্ক"
                      defaultValue="1"
                      disabled={isSubmittingExam}
                      required
                      onInput={handleNumberInput}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="negative_marks">নেগেটিভ মার্ক</Label>
                    <Input
                      id="negative_marks"
                      type="number"
                      step="0.01"
                      name="negative_marks_per_wrong"
                      placeholder="ভুল উত্তরের জন্য নেগেটিভ মার্ক"
                      defaultValue="0.25"
                      disabled={isSubmittingExam}
                      required
                      onInput={handleNumberInput}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file_id">প্রশ্নাবলীর ID (ঐচ্ছিক)</Label>
                    <Input
                      id="file_id"
                      type="text"
                      name="file_id"
                      placeholder="প্রশ্নাবলীর ID (ঐচ্ছিক)"
                      disabled={isSubmittingExam}
                    />
                  </div>
                  <div className="flex items-center space-x-4 pt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="shuffle-questions-toggle"
                        name="shuffle_questions"
                        value="true"
                      />
                      <Label htmlFor="shuffle-questions-toggle">
                        প্রশ্নগুলো এলোমেলো করুন
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="shuffle_sections_only"
                        name="shuffle_sections_only"
                        value="true"
                      />
                      <Label htmlFor="shuffle_sections_only">
                        সেকশন অনুসারে এলোমেলো করুন
                      </Label>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="custom-exam-toggle"
                      checked={isCustomExam}
                      onCheckedChange={(checked) =>
                        setIsCustomExam(checked as boolean)
                      }
                    />
                    <Label htmlFor="custom-exam-toggle">কাস্টম এক্সাম</Label>
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
                        <div className="grid grid-cols-2 gap-2">
                          {subjects.map((subject) => (
                            <div
                              key={`mandatory-${subject.id}`}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`mandatory-${subject.id}`}
                                name="mandatory_subjects"
                                value={subject.id}
                              />
                              <Label htmlFor={`mandatory-${subject.id}`}>
                                {subject.name} ({subject.id})
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>অন্যান্য বিষয়</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {subjects.map((subject) => (
                            <div
                              key={`optional-${subject.id}`}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`optional-${subject.id}`}
                                name="optional_subjects"
                                value={subject.id}
                              />
                              <Label htmlFor={`optional-${subject.id}`}>
                                {subject.name} ({subject.id})
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <Button
                    type="submit"
                    disabled={isSubmittingExam}
                    className="w-full"
                  >
                    {isSubmittingExam ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        যোগ করা হচ্ছে...
                      </>
                    ) : (
                      "নতুন পরীক্ষা যোগ করুন"
                    )}
                  </Button>
                </form>
              </CollapsibleContent>
            </Collapsible>
            <div className="relative w-full overflow-auto scrollbar-hide pt-4 mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>পরীক্ষার নাম</TableHead>
                    <TableHead className="text-right">কার্যক্রম</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.name}</TableCell>
                      <TableCell className="flex flex-wrap items-center justify-end gap-2">
                        <Link
                          href={`/admin/dashboard/exams/${exam.id}/questions`}
                        >
                          <Button variant="outline" size="sm">
                            প্রশ্ন
                          </Button>
                        </Link>
                        <Link
                          href={`/admin/dashboard/exams/${exam.id}/results`}
                        >
                          <Button variant="outline" size="sm">
                            ফলাফল
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingExam(exam);
                            setIsEditModalOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => requestDeleteExam(exam.id, exam.name)}
                        >
                          মুছুন
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ছাত্রছাত্রী পরিচালনা</CardTitle>
            <CardDescription>
              এই ব্যাচে ছাত্রছাত্রীদের যোগ করুন বা মুছে ফেলুন।
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              ref={addStudentFormRef}
              onSubmit={handleAddStudent}
              className="space-y-4 mb-6"
            >
              <Input
                type="text"
                placeholder="নতুন ছাত্রছাত্রীর রোল"
                value={newStudentRoll}
                onChange={(e) => setNewStudentRoll(e.target.value)}
                disabled={isSubmittingStudent}
                required
              />
              <Button
                type="submit"
                disabled={isSubmittingStudent}
                className="w-full"
              >
                {isSubmittingStudent ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    যোগ করা হচ্ছে...
                  </>
                ) : (
                  "ছাত্রছাত্রী যোগ করুন"
                )}
              </Button>
            </form>

            <div className="relative w-full overflow-auto scrollbar-hide">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>স্টুডেন্ট রোল</TableHead>
                    <TableHead className="text-right">কার্যক্রম</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrolledStudents.map((student) => (
                    <TableRow key={student.uid}>
                      <TableCell className="font-medium">
                        {student.roll}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            requestDeleteStudent(student.uid, student.roll)
                          }
                        >
                          মুছে ফেলুন
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      <EditExamModal
        exam={editingExam}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ছাত্রছাত্রী যোগ করার নিশ্চয়তা</AlertDialogTitle>
            <AlertDialogDescription>
              আপনি কি নিম্নলিখিত ছাত্রছাত্রীকে ব্যাচে যোগ করতে নিশ্চিত?
            </AlertDialogDescription>
            {pendingStudent && (
              <div className="mt-4 space-y-2 pt-4 text-sm">
                <div>
                  <strong>নাম:</strong> {pendingStudent.name}
                </div>
                <div>
                  <strong>রোল:</strong> {pendingStudent.roll}
                </div>
                <div>
                  <strong>UUID:</strong> {pendingStudent.uid}
                </div>
              </div>
            )}
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>বাতিল করুন</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAddStudent}
              className="bg-primary hover:bg-primary/90"
            >
              যোগ করুন
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      <ConfirmPasswordDialog
        open={isPasswordOpen}
        onOpenChange={(open) => {
          setIsPasswordOpen(open);
          if (!open) setPendingDelete(null);
        }}
        title="মুছে ফেলার নিশ্চিতকরণ"
        description={
          pendingDelete
            ? `আপনি ${pendingDelete.type === "exam" ? "পরীক্ষা" : "ছাত্রছাত্রী"} (${pendingDelete.label || pendingDelete.id}) মুছে ফেলতে যাচ্ছেন — এটি স্থায়ী। অ্যাডমিন পাসওয়ার্ড দিন।`
            : undefined
        }
        confirmLabel="মুছে ফেলুন"
        onConfirm={handleConfirmDelete}
      />
      <hr className="h-8 border-transparent" />
    </div>
  );
}
