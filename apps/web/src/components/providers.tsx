"use client";

import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";

import { TRPCReactProvider } from "@/trpc/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TRPCReactProvider>
        {children}
      </TRPCReactProvider>
      <Toaster richColors />
    </ThemeProvider>
  );
}
