import { Header } from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/server";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  let isLoggedIn = false;
  try {
    const { data } = await supabase.auth.getUser();
    isLoggedIn = !!data.user;
  } catch {
    // isLoggedIn stays false
  }

  return (
    <>
      <Header isLoggedIn={isLoggedIn} />
      {children}
    </>
  );
}
