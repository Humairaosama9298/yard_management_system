"use client";

import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Route,
  Settings2,
  ArrowRightLeft,
  Boxes,
  FileBarChart2,
  Image as ImageIcon,
  Truck,
  CalendarCheck,
  Send,
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useUiStore } from "@/store/ui.store";

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  // ✅ single source of truth
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUiStore();

  const pageTitle =
    pathname.split("/").filter(Boolean).slice(-1)[0] || "dashboard";

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tracking", label: "Tracking", icon: Route },
    { href: "/loading-program", label: "Loading Program", icon: Settings2 },
    { href: "/gate-in", label: "Gate-In", icon: ArrowRightLeft },
    { href: "/gate-out", label: "Gate-Out", icon: ArrowRightLeft },
    { href: "/block-container", label: "Block Container", icon: Boxes },
    { href: "/survey", label: "Survey", icon: FileBarChart2 },
    { href: "/pictures", label: "Pictures", icon: ImageIcon },
    { href: "/reports/stock", label: "Stock Reports", icon: Truck },
    { href: "/reports/daily", label: "Daily Reports", icon: CalendarCheck },
    { href: "/edi", label: "EDI", icon: Send },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* ================= SIDEBAR (DESKTOP) ================= */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden md:flex w-60 flex-col bg-slate-900 text-white">
        <div className="flex items-center gap-2 p-4 border-b border-slate-700">
          <span className="font-bold text-xl">🚢 YMS</span>
          <span className="font-semibold">Yard System</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);

            return (
              <Button
                key={item.href}
                variant={active ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start px-4 py-2",
                  active
                    ? "bg-slate-700 text-white"
                    : "text-white hover:bg-slate-700"
                )}
                asChild
              >
                <Link href={item.href} className="flex items-center gap-3">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              </Button>
            );
          })}
        </nav>

        {/* USER CARD */}
        <Card className="m-4 bg-slate-800 text-white border-slate-700">
          <CardHeader className="flex flex-row items-center gap-3 p-4">
            <Avatar className="h-9 w-9">
              <AvatarImage src="/avatar.png" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <CardTitle className="text-sm">John Doe</CardTitle>
              <p className="text-xs text-slate-300">Operator</p>
            </div>

            <Button variant="ghost" size="icon" onClick={() => signOut()}>
              <LogOut size={16} />
            </Button>
          </CardHeader>
        </Card>
      </aside>

      {/* ================= MAIN AREA ================= */}
      <div className="flex flex-col flex-1 md:ml-60 min-h-screen">
        {/* ================= TOPBAR ================= */}
        <header className="h-16 flex items-center justify-between px-6 border-b bg-background">
          <div className="flex items-center gap-3">
            {/* MOBILE MENU BUTTON */}
            <Sheet
              open={mobileSidebarOpen}
              onOpenChange={setMobileSidebarOpen}
            >
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileSidebarOpen(true)}
              >
                <svg
                  viewBox="0 0 20 20"
                  className="h-5 w-5"
                  fill="currentColor"
                >
                  <path d="M2 4h16M2 10h16M2 16h16" />
                </svg>
              </Button>

              <SheetContent side="left" className="p-0 flex flex-col">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>

                <nav className="flex-1 overflow-y-auto py-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = pathname.startsWith(item.href);

                    return (
                      <Button
                        key={item.href}
                        variant={active ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start px-4 py-2",
                          active
                            ? "bg-slate-700 text-white"
                            : "text-white hover:bg-slate-700"
                        )}
                        asChild
                        onClick={() => setMobileSidebarOpen(false)}
                      >
                        <Link
                          href={item.href}
                          className="flex items-center gap-3"
                        >
                          <Icon size={18} />
                          <span>{item.label}</span>
                        </Link>
                      </Button>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>

            <h1 className="text-lg font-semibold capitalize">
              {pageTitle}
            </h1>
          </div>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-2 top-2 text-muted-foreground" size={16} />
              <Input placeholder="Search…" className="pl-8 w-48" />
            </div>

            <Badge variant="secondary">
              {new Date().toLocaleDateString()}
            </Badge>

            <Button variant="ghost" size="icon">
              <Bell size={18} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setTheme(theme === "dark" ? "light" : "dark")
              }
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
          </div>
        </header>

        {/* ================= PAGE CONTENT ================= */}
        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            className="flex-1 p-6 overflow-auto"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}