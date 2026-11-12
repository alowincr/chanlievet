"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/hooks/use-auth";
import { CartProvider } from "@/lib/hooks/use-cart";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  );
}
