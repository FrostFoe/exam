"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { Admin } from "@/lib/types";

type AdminAuthContextType = {
  admin: Admin | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => void;
  loading: boolean;
};

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined,
);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // This code now runs only on the client
    if (typeof window !== "undefined") {
      try {
        const storedAdmin = localStorage.getItem("admin-user");
        if (storedAdmin) {
          setAdmin(JSON.parse(storedAdmin));
        }
      } catch (error) {
        console.error("Failed to parse admin user from localStorage", error);
        localStorage.removeItem("admin-user");
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (
      !loading &&
      !admin &&
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/admin/dashboard")
    ) {
      router.push("/admin/login");
    }
  }, [admin, loading, router]);

  const signIn = async (username: string, password: string) => {
    const { data, error } = await supabase
      .from("admins")
      .select("uid, username, password, role, created_at")
      .eq("username", username)
      .single();

    if (error) {
      throw new Error("অ্যাডমিন খুঁজে পাওয়া যায়নি।");
    }

    if (data.password !== password) {
      throw new Error("ভুল পাসওয়ার্ড।");
    }

    const { ...adminData } = data;
    setAdmin(adminData as Admin);
    localStorage.setItem("admin-user", JSON.stringify(adminData));
  };

  const signOut = () => {
    setAdmin(null);
    localStorage.removeItem("admin-user");
    router.push("/admin/login");
  };

  const value = {
    admin,
    signIn,
    signOut,
    loading,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};
