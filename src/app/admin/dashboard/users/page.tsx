import { supabase } from "@/lib/supabase";
import type { User, Batch } from "@/lib/types";
import { UsersClient } from "./UsersClient";
import { Card, CardFooter } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const USERS_PER_PAGE = 20;

async function getUsers(page: number, searchTerm: string) {
  const from = (page - 1) * USERS_PER_PAGE;
  const to = from + USERS_PER_PAGE - 1;

  let query = supabase.from("users").select("*", { count: "exact" });

  if (searchTerm) {
    query = query.or(`name.ilike.%${searchTerm}%,roll.ilike.%${searchTerm}%`);
  }

  query = query
    .order("roll", { ascending: false, nullsFirst: false })
    .range(from, to);

  const { data, error, count } = await query;

  return { users: data as User[], error, count };
}

async function getBatches() {
  const { data, error } = await supabase.from("batches").select("*");
  return { batches: data as Batch[], error };
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const searchTerm = params.search || "";

  const [usersResult, batchesResult] = await Promise.all([
    getUsers(currentPage, searchTerm),
    getBatches(),
  ]);

  const { users, error: usersError, count: totalUsers } = usersResult;
  const { batches, error: batchesError } = batchesResult;

  if (usersError || batchesError) {
    const errorMessages = [];
    if (usersError) errorMessages.push(usersError.message);
    if (batchesError) errorMessages.push(batchesError.message);
    return <p>তথ্য আনতে সমস্যা হয়েছে: {errorMessages.join(", ")}</p>;
  }

  const totalPages = Math.ceil((totalUsers || 0) / USERS_PER_PAGE);

  const renderPageNumbers = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(
        <Link
          key={i}
          href={`/admin/dashboard/users?page=${i}${searchTerm ? `&search=${searchTerm}` : ""}`}
          className={cn(
            buttonVariants({
              variant: i === currentPage ? "default" : "outline",
              size: "sm",
            }),
          )}
        >
          {i}
        </Link>,
      );
    }
    return pageNumbers;
  };

  return (
    <>
      <UsersClient initialUsers={users} initialBatches={batches} />
      {totalPages > 1 && (
        <>
          <Card className="mt-2">
            <CardFooter className="flex items-center justify-center p-6">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="text-sm text-muted-foreground">
                  পৃষ্ঠা {currentPage} এর {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={
                      currentPage > 1
                        ? `/admin/dashboard/users?page=${currentPage - 1}${searchTerm ? `&search=${searchTerm}` : ""}`
                        : "#"
                    }
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      currentPage <= 1 && "pointer-events-none opacity-50",
                    )}
                    aria-disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    আগের
                  </Link>
                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    {renderPageNumbers()}
                  </div>
                  <Link
                    href={
                      currentPage < totalPages
                        ? `/admin/dashboard/users?page=${currentPage + 1}${searchTerm ? `&search=${searchTerm}` : ""}`
                        : "#"
                    }
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      currentPage >= totalPages &&
                        "pointer-events-none opacity-50",
                    )}
                    aria-disabled={currentPage >= totalPages}
                  >
                    পরবর্তী
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>
            </CardFooter>
          </Card>
          <hr className="h-8 border-transparent" />
        </>
      )}
    </>
  );
}
