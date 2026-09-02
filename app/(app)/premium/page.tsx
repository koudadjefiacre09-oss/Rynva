import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PremiumScreen } from "@/components/premium/premium-screen";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "RYNVA Pro" };

export default async function PremiumPage() {
  if (!isSupabaseConfigured) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <PremiumScreen />;
}
