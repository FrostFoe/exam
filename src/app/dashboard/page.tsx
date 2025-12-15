
"use client";
import { useEffect, useState } from "react";
import { StatCard } from "@/components";
import { FileText, BadgePercent, BarChart, BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ExamResult {
  score: number;
  submitted_at: string;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    enrolledBatches: 0,
    examsTaken: 0,
    averageScore: 0,
    bestScore: 0,
  });
  const [recentResults, setRecentResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user?.uid) {
      fetchDashboardData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchDashboardData = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      // Fetch enrolled batches count
      const { data: userData } = await supabase
        .from("users")
        .select("enrolled_batches")
        .eq("uid", user.uid)
        .single();

      const enrolledBatches = userData?.enrolled_batches?.length || 0;

      // Fetch exam results
      const { data: results } = await supabase
        .from("student_exams")
        .select("score, submitted_at")
        .eq("student_id", user.uid)
        .order("submitted_at", { ascending: false })
        .limit(10);

      const examsTaken = results?.length || 0;
      const averageScore =
        examsTaken > 0
          ? results!.reduce((sum, r) => sum + r.score, 0) / examsTaken
          : 0;
      const bestScore =
        examsTaken > 0 ? Math.max(...results!.map((r) => r.score)) : 0;

      setStats({
        enrolledBatches,
        examsTaken,
        averageScore,
        bestScore,
      });

      setRecentResults(results || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "কেনা কোর্স",
      value: stats.enrolledBatches.toString(),
      description: "ভর্তি হওয়া ব্যাচের সংখ্যা",
      icon: <BookOpen className="h-5 w-5 text-muted-foreground" />,
    },
    {
      title: "দেওয়া পরীক্ষা",
      value: stats.examsTaken.toString(),
      description: "এখন পর্যন্ত দিয়েছেন",
      icon: <FileText className="h-5 w-5 text-muted-foreground" />,
    },
    {
      title: "গড় নম্বর",
      value: `${stats.averageScore.toFixed(2)}`,
      description: "সকল পরীক্ষার গড়",
      icon: <BadgePercent className="h-5 w-5 text-muted-foreground" />,
    },
    {
      title: "সেরা ফলাফল",
      value: `${stats.bestScore.toFixed(2)}`,
      description: "সর্বোচ্চ প্রাপ্ত নম্বর",
      icon: <BarChart className="h-5 w-5 text-muted-foreground" />,
    },
  ];

  if (loading || authLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded"></div>
                <div className="h-8 bg-muted animate-pulse rounded"></div>
                <div className="h-3 bg-muted animate-pulse rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
          />
        ))}
      </div>

      {recentResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>সাম্প্রতিক ফলাফল</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentResults.slice(0, 5).map((result, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      {new Date(result.submitted_at).toLocaleDateString(
                        "bn-BD",
                        { timeZone: "Asia/Dhaka" },
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={
                        (result.score /
                          Math.max(...recentResults.map((r) => r.score), 100)) *
                        100
                      }
                      className="w-20 h-2"
                    />
                    <span className="text-sm font-medium">
                      {result.score.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <hr className="h-20 border-transparent" />
    </div>
  );
}
