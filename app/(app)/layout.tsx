import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: projects } = await supabase
    .from("projects")
    .select("id, title")
    .order("created_at", { ascending: false });

  const email = user.email ?? "";

  return (
    <div className="flex min-h-full flex-1">
      <Sidebar projects={projects ?? []} email={email} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar email={email} />
        <main className="flex-1 overflow-y-auto px-5 py-7 sm:px-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
