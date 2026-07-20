import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

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

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Navbar email={user.email ?? ""} />
      <div className="flex flex-1">
        <Sidebar projects={projects ?? []} />
        <main className="flex-1 overflow-y-auto px-5 py-8 sm:px-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
