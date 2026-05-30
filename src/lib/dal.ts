import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Data Access Layer. `requireUser()` is the single chokepoint every server-side
// data read/mutation funnels through, so the auth check can never be forgotten.
// `cache()` memoizes it for one render pass to avoid duplicate getUser() calls.
export const requireUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
});
