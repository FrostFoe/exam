import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "MNR Exam — আপনার চূড়ান্ত পরীক্ষার প্রস্তুতি সঙ্গী",
  description: "আপনার চূড়ান্ত পরীক্ষার প্রস্তুতি সঙ্গী",
  keywords:
    "mnr,mnr world,mnrfrom2020,frostfoe,mnr study,study platform,admission calendar,admission news 2025,admission 2025,university admission,question bank,bangladesh university,public university,private university,college admission,ভর্তি তথ্য,বিশ্ববিদ্যালয় ভর্তি,প্রশ্নব্যাংক,অ্যাডমিশন ক্যালেন্ডার,ভর্তি পরীক্ষা,মডেল টেস্ট,বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <link
          href="https://banglawebfonts.pages.dev/css/solaiman-lipi.min.css"
          rel="stylesheet"
        />
      </head>
      <body
        suppressHydrationWarning
        className={cn("min-h-screen bg-background antialiased")}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
