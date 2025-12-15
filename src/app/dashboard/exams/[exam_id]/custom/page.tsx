
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { fetchQuestions, type RawQuestion } from "@/lib/fetchQuestions";
import type { Exam, Question } from "@/lib/types";
import { LoadingSpinner, PageHeader } from "@/components";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const subjectsMap: { [key: string]: string } = {
  p: "পদার্থবিজ্ঞান",
  c: "রসায়ন",
  m: "উচ্চতর গণিত",
  b: "জীববিজ্ঞান",
  bm: "জীববিজ্ঞান + উচ্চতর গণিত",
  bn: "বাংলা",
  e: "ইংরেজী",
  i: "আইসিটি",
  gk: "জিকে",
  iq: "আইকিউ",
};

const getSubjectName = (id: string) => subjectsMap[id] || id;

export default function CustomExamPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const exam_id = params.exam_id as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [, setAllQuestions] = useState<Question[]>([]);
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [duration, setDuration] = useState<string>("30");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!exam_id) return;

    const loadExamData = async () => {
      setLoading(true);
      try {
        const { data: examData, error: examError } = await supabase
          .from("exams")
          .select("*")
          .eq("id", exam_id)
          .single();

        if (examError || !examData) {
          toast({
            title: "পরীক্ষা খুঁজে পাওয়া যায়নি",
            variant: "destructive",
          });
          router.push("/dashboard/exams");
          return;
        }
        setExam(examData);

        const fetched = await fetchQuestions(examData.file_id);
        if (Array.isArray(fetched) && fetched.length > 0) {
          const convertedQuestions: Question[] = fetched.map(
            (q: RawQuestion) => ({
              id: q.id,
              question: q.question || q.question_text || "",
              options: q.options || [],
              answer: -1,
              section: q.section,
            }),
          );
          setAllQuestions(convertedQuestions);
          const sections = Array.from(
            new Set(
              convertedQuestions
                .map((q) => q.section?.toLowerCase())
                .filter(Boolean) as string[],
            ),
          );
          setAvailableSections(sections);
          setSelectedSections([]); // Uncheck all by default
        } else {
          toast({
            title: "এই পরীক্ষার জন্য কোনো প্রশ্ন পাওয়া যায়নি",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error(err);
        toast({
          title: "তথ্য লোড করতে সমস্যা হয়েছে",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadExamData();
  }, [exam_id, router, toast]);

  const handleSectionSelect = (sectionId: string) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((s) => s !== sectionId)
        : [...prev, sectionId],
    );
  };

  const handleStartExam = () => {
    if (selectedSections.length === 0) {
      toast({
        title: "অনুগ্রহ করে কমপক্ষে একটি বিষয় নির্বাচন করুন",
        variant: "destructive",
      });
      return;
    }
    const durationMinutes = parseInt(duration, 10);
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      toast({
        title: "অনুগ্রহ করে একটি সঠিক সময় দিন",
        variant: "destructive",
      });
      return;
    }

    const query = new URLSearchParams({
      start_custom: "true",
      sections: selectedSections.join(","),
      duration: duration,
    }).toString();

    router.push(`/dashboard/exams/${exam_id}?${query}`);
  };

  if (loading) {
    return <LoadingSpinner message="কাস্টম পরীক্ষার তথ্য লোড হচ্ছে..." />;
  }

  return (
    <div className="container mx-auto p-4">
      <PageHeader
        title="কাস্টম পরীক্ষা তৈরি করুন"
        description={exam?.name || ""}
      />
      <Card>
        <CardHeader>
          <CardTitle>আপনার পরীক্ষা সাজিয়ে নিন</CardTitle>
          <CardDescription>
            পছন্দমতো বিষয় এবং সময় নির্ধারণ করে পরীক্ষা শুরু করুন।
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">বিষয় নির্বাচন করুন</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {availableSections.map((section) => (
                <div
                  key={section}
                  className="flex items-center space-x-2 p-3 rounded-md border"
                >
                  <Checkbox
                    id={section}
                    checked={selectedSections.includes(section)}
                    onCheckedChange={() => handleSectionSelect(section)}
                  />
                  <Label htmlFor={section} className="flex-1 cursor-pointer">
                    {getSubjectName(section)}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">পরীক্ষার সময় (মিনিট)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g., 30"
              min="1"
            />
          </div>
          <Button onClick={handleStartExam} className="w-full">
            পরীক্ষা শুরু করুন
          </Button>
        </CardContent>
      </Card>
      <hr className="h-16 border-transparent" />
    </div>
  );
}
