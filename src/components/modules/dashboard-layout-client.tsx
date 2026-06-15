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
  Image,
  Truck,
  CalendarCheck,
  Send,
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useUiStore } from "@/store/ui.store";

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUiStore();
  const { theme, setTheme } = useTheme();

  const pageTitle = pathname.split("/")[1] || "dashboard";

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { href: "/tracking", label: "Tracking", icon: <Route size={18} /> },
    { href: "/loading-program", label: "Loading Program", icon: <Settings2 size={18} /> },
    { href: "/gate-in", label: "Gate‑In", icon: <ArrowRightLeft size={18} /> },
    { href: "/gate-out", label: "Gate‑Out", icon: <ArrowRightLeft size={18} /> },
    { href: "/block-container", label: "Block Container", icon: <Boxes size={18} /> },
    { href: "/survey", label: "Survey", icon: <FileBarChart2 size={18} /> },
    { href: "/pictures", label: "Pictures", icon: <Image size={18} /> },
    { href: "/reports/stock", label: "Stock Reports", icon: <Truck size={18} /> },
    { href: "/reports/daily", label: "Daily Reports", icon: <CalendarCheck size={18} /> },
    { href: "/edi", label: "EDI", icon: <Send size={18} /> },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -240 }}
        animate={{ x: sidebarOpen ? 0 : -240 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-y-0 left-0 z-20 w-60 bg-card shadow-md flex flex-col"
      >
        <div className="flex items-center gap-2 p-4 border-b">
          <img src="/logo.svg" alt="Logo" className="h-8 w-8" />
          <span className="font-bold">Yard System</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant={pathname.startsWith(item.href) ? "secondary" : "ghost"}
              className="w-full justify-start px-4 py-2 text-left"
              asChild
            >
              <a href={item.href} className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </a>
            </Button>
          ))}
        </nav>
        {/* User Card */}
        <Card className="m-4">
          <CardHeader className="flex flex-row items-center gap-3 p-4">
            <Avatar className="h-9 w-9">
              <AvatarImage src="/avatar.png" alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-sm">John Doe</CardTitle>
              <p className="text-xs text-muted-foreground">Operator</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => signOut()}>
              <LogOut size={16} />
            </Button>
          </CardHeader>
        </Card>
      </motion.aside>

      {/* Main content area */}
      <div className="flex flex-col flex-1 ml-60 transition-margin duration-300">
        {/* Topbar */}
        <header className="flex items-center justify-between h-16 px-6 border-b">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor">
                <path d="M2 4h16M2 10h16M2 16h16" />
              </svg>
            </Button>
            <h1 className="text-xl font-semibold capitalize">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search…" className="pl-8 w-48" />
            </div>
            <Badge variant="secondary">{new Date().toLocaleDateString()}</Badge>
            <Button variant="ghost" size="icon">
              <Bell size={18} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
          </div>
        </header>

        {/* Page content with fade transition */}
        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            className="flex-1 p-6 overflow-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
