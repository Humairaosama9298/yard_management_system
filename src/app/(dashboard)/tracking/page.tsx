// src/app/(dashboard)/tracking/page.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Types – adjust to match your Prisma schema if needed
interface EirRecord {
  id: string;
  eirNo: string;
  mode: string;
  container: string;
  size: string;
  line: string;
  hold: string;
  date: string; // ISO string
  bookingNo: string;
  tare: string;
  depot: string;
  status: string;
  remarks: string;
  terminal: string;
}

// Helper to fetch tracking data based on active tab and query string
const fetchTracking = async (type: string, q: string): Promise<EirRecord[]> => {
  const params = new URLSearchParams();
  params.append("type", type);
  params.append("q", q);
  const res = await fetch(`/api/tracking?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch tracking data");
  return res.json();
};

export default function TrackingPage() {
  const tabs = ["container", "booking", "truck", "eir"] as const;
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState(""); // submitted query

  // TanStack Query – disabled until a search is submitted
  const { data: results, isFetching, error } = useQuery({
  queryKey: ["tracking", activeTab, query],
  queryFn: () => fetchTracking(activeTab, query),
  enabled: !!query,
  staleTime: Infinity,
  gcTime: 0,
});

  // Submit handler
 const handleSearch = (e: React.FormEvent) => {
  e.preventDefault()
  setQuery(search)
 }

  // Ctrl+K shortcut to focus the search box
  const inputRef = React.useRef<HTMLInputElement>(null);
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === "k") {
      e.preventDefault();
      inputRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  // Framer Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };
  const rowVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };
  const tabIndicator = {
    hidden: { x: 0 },
    visible: { x: 0 }, // placeholder – shadcn tabs already animate the indicator
  };

  return (
    <div className="p-4 space-y-6">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="relative">
          {tabs.map((t) => (
            <TabsTrigger key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </TabsTrigger>
          ))}
          {/* Indicator animation – using motion for a simple fade */}
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 bg-primary transition-transform duration-200"
            layout
          />
        </TabsList>
      </Tabs>

      {/* Search input */}
      <form onSubmit={handleSearch} className="flex gap-2 items-center">
        <Input
          ref={inputRef}
          placeholder={`Search ${activeTab}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={isFetching}>
          Search
        </Button>
        <span className="text-sm text-muted-foreground">Ctrl+K</span>
      </form>

      {/* Results Table */}
      {error && <div className="text-red-500">Error loading data</div>}
      {results && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>EIR No</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Container</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Line</TableHead>
                <TableHead>Hold</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Booking#</TableHead>
                <TableHead>Tare</TableHead>
                <TableHead>Depot</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Terminal</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((row) => (
                <motion.tr key={row.id} variants={rowVariants} className="border-b">
                  <TableCell>{row.eirNo}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      {row.mode}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.container}</TableCell>
                  <TableCell>{row.size}</TableCell>
                  <TableCell>{row.line}</TableCell>
                  <TableCell>{row.hold}</TableCell>
                  <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                  <TableCell>{row.bookingNo}</TableCell>
                  <TableCell>{row.tare}</TableCell>
                  <TableCell>{row.depot}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.remarks}</TableCell>
                  <TableCell>{row.terminal}</TableCell>
                  <TableCell className="space-x-2">
                    {/* Change Status Dialog */}
                    <Dialog>
                      <DialogTrigger>
                        <Button variant="outline" size="sm">
                          Change Status
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Change Status</DialogTitle>
                          <DialogDescription>
                            Update the status for EIR {row.eirNo}.
                          </DialogDescription>
                        </DialogHeader>
                        {/* Placeholder – real implementation would include a form */}
                        <Button>Save</Button>
                        <DialogClose>
                          <Button variant="ghost">Cancel</Button>
                        </DialogClose>
                      </DialogContent>
                    </Dialog>
                    {/* Change Booking# Dialog */}
                    <Dialog>
                      <DialogTrigger>
                        <Button variant="outline" size="sm">
                          Change Booking#
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Change Booking#</DialogTitle>
                          <DialogDescription>
                            Update the booking number for EIR {row.eirNo}.
                          </DialogDescription>
                        </DialogHeader>
                        {/* Placeholder form */}
                        <Button>Save</Button>
                        <DialogClose>
                          <Button variant="ghost">Cancel</Button>
                        </DialogClose>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      )}
    </div>
  );
}
