import { StatCard } from "@/components";
import { supabase } from "@/lib/supabase";
import { Users, BookOpen, FileQuestion } from "lucide-react";

async function getStats() {
  const { count: usersCount, error: usersError } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  const { count: examsCount, error: examsError } = await supabase
    .from("exams")
    .select("*", { count: "exact", head: true });

  // This is a placeholder for total questions.
  // A real implementation might involve a separate table or a more complex query.
  const questionsCount = 10000;

  if (usersError || examsError) {
    console.error(
      "Error fetching stats:",
      usersError?.message,
      examsError?.message,
    );
  }

  return {
    usersCount: usersCount || 0,
    examsCount: examsCount || 0,
    questionsCount,
  };
}

export default async function AdminDashboard() {
  const { usersCount, examsCount, questionsCount } = await getStats();
  const cards = [
    {
      title: "মোট ব্যবহারকারী",
      value: usersCount.toLocaleString("bn-BD"),
      description: "নিবন্ধিত মোট ছাত্রছাত্রীর সংখ্যা",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "মোট পরীক্ষা",
      value: examsCount.toLocaleString("bn-BD"),
      description: "সিস্টেমে থাকা মোট পরীক্ষার সংখ্যা",
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      title: "মোট প্রশ্ন",
      value: `${(questionsCount / 1000).toLocaleString("bn-BD")}K+`,
      description: "প্রশ্নব্যাংকে থাকা মোট প্রশ্ন",
      icon: <FileQuestion className="h-5 w-5" />,
    },
  ];

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-500">
        {cards.map((card, idx) => (
          <div key={idx} style={{ animationDelay: `${idx * 150}ms` }}>
            <StatCard
              title={card.title}
              value={card.value}
              description={card.description}
              icon={card.icon}
            />
          </div>
        ))}
      </div>
      <hr className="h-8 border-transparent" />
    </>
  );
}
