"use client";

import { useSession } from "next-auth/react";
import { TopRightNavigation } from "./top-right-navigation";

export function TopRightNavigationWrapper() {
  const { data: session, status } = useSession();

  return (
    <TopRightNavigation
      user={session?.user || null}
      isLoading={status === "loading"}
    />
  );
}
