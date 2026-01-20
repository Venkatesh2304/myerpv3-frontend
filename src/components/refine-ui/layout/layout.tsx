"use client";

import { Header } from "@/components/refine-ui/layout/header";
import { ThemeProvider } from "@/components/refine-ui/theme/theme-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { PropsWithChildren } from "react";
import { Sidebar } from "./sidebar";
import { useHotkeys } from "react-hotkeys-hook";
import { useBack } from "@refinedev/core";

export function Layout({ children }: PropsWithChildren) {
  const back = useBack();
  useHotkeys("backspace", (e) => {
    e.preventDefault();
    back();
  }, {
    enableOnFormTags: false,
  })

  return (
    <ThemeProvider defaultTheme="light">
      <SidebarProvider defaultOpen={false}>
        <Sidebar />
        <SidebarInset>
          <Header />
          <main
            className={cn(
              "@container/main",
              // "container",
              // "mx-auto",
              // "relative",
              "w-full",
              "max-w-full",
              "flex",
              "flex-col",
              "flex-1",
              "px-8",
              "pt-4",
              "md:p-4",
              "lg:px-6",
              "lg:pt-6"
            )}
          >
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}

Layout.displayName = "Layout";
