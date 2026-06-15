// src/app/(dashboard)/dashboard/page.tsx

"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import CountUp from "react-countup";

// Fetch helpers
const fetchStats = async () => {
  const res = await fetch("/api/dashboard/stats", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
};

const fetchActivity = async () => {
  const res = await fetch("/api/dashboard/activity", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch activity");
  return res.json();
};

// Placeholder 7‑day data – in a real app this would come from an API
const generateWeekData = (stats: any) => {
  const today = new Date();
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const label = d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    // Use total counts as rough seeds for demo purposes
    const gateIn = Math.max(
      0,
      Math.floor((stats?.todayGateIn ?? 0) * Math.random()),
    );
    const gateOut = Math.max(
      0,
      Math.floor((stats?.todayGateOut ?? 0) * Math.random()),
    );
    data.push({ date: label, "Gate‑In": gateIn, "Gate‑Out": gateOut });
  }
  return data;
};

export default function DashboardPage() {
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: fetchStats,
    refetchInterval: 30_000,
  });

  const {
    data: activity,
    isLoading: activityLoading,
    error: activityError,
  } = useQuery({
    queryKey: ["dashboardActivity"],
    queryFn: fetchActivity,
    refetchInterval: 30_000,
  });

  const weekData = React.useMemo(() => {
    if (!stats) return [];
    return generateWeekData(stats);
  }, [stats]);

  // Framer Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const feedItemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
  };

  if (statsLoading || activityLoading)
    return (
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    );
  if (statsError) return <div>Error loading stats.</div>;
  if (activityError) return <div>Error loading activity.</div>;

  return (
    <motion.div
      className="space-y-6 p-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Quick actions panel */}
      <motion.div variants={cardVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Link href="/gate-in" className="underline">
              Gate‑In
            </Link>
            <Link href="/gate-out" className="underline">
              Gate‑Out
            </Link>
            <Link href="/loading-program" className="underline">
              Loading Program
            </Link>
            <Link href="/tracking" className="underline">
              Tracking
            </Link>
          </CardContent>
        </Card>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4"
        variants={containerVariants}
      >
        {[
          { label: "Total Stock", value: stats?.totalStock ?? 0 },
          { label: "Today Gate‑In", value: stats?.todayGateIn ?? 0 },
          { label: "Today Gate‑Out", value: stats?.todayGateOut ?? 0 },
          { label: "Blocked", value: stats?.blocked ?? 0 },
          { label: "Today Bookings", value: stats?.todayBookings ?? 0 },
          { label: "Damage", value: stats?.damage ?? 0 },
        ].map((kpi) => (
          <motion.div key={kpi.label} variants={cardVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">
                  {kpi.label}
                </CardTitle>
                <CardDescription className="text-2xl font-bold">
                  <CountUp end={kpi.value ?? 0} duration={1.5} separator="," />
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Stock Summary Card */}
      <motion.div variants={cardVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Stock Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {/* The summary could include additional metrics – placeholder for now */}
            <p>Total containers: {stats?.totalStock ?? 0}</p>
            <p>Damaged containers: {stats?.damage ?? 0}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bar Chart */}
      <motion.div variants={cardVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Gate‑In vs Gate‑Out (Last 7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={weekData}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Gate‑In" fill="#8884d8" />
                <Bar dataKey="Gate‑Out" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Activity Feed */}
      <motion.div variants={cardVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(activity ?? []).map((item: any, idx: number) => (
              <motion.div key={item.id ?? idx} variants={feedItemVariants}>
                <Badge variant="secondary" className="mr-2">
                  {item.type}
                </Badge>
                {item.message}
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
