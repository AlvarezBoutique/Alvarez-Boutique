"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminIndex() {
  const router = useRouter();
  // Client-side redirect: /admin is behind the auth gate in layout.jsx, which is
  // a client component, so a server redirect() would run before the gate.
  useEffect(() => {
    router.replace("/admin/inventario");
  }, [router]);
  return null;
}
