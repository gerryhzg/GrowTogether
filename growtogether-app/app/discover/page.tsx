"use client";

import { useAuth } from "@/components/providers/auth-context";
import { DiscoverPage } from "@/components/screens/discover-page";
import { ParentDiscoverPage } from "@/components/screens/parent-discover-page";

export default function DiscoverRoute() {
  const { user } = useAuth();

  if (user?.role === "parent") {
    return <ParentDiscoverPage />;
  }

  return <DiscoverPage />;
}
