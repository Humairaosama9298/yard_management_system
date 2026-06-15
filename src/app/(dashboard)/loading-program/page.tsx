
"use client";

import React, { useState } from "react";
import { Control, useForm, useFieldArray, Controller, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper
} from "@tanstack/react-table";
import { motion } from "framer-motion";

// shadcn UI components
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { DatePicker } from "@/components/ui/date-picker";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

// -----------------------------------------------------------------------------



// Validation schema (react-hook-form + Zod)
// -----------------------------------------------------------------------------
const loadingProgramSchema = z.object({
  line: z.string().min(1, "Line is required"),
  terminal: z.string().min(1, "Terminal is required"),
  yard: z.string().min(1, "Yard is required"),
  lpNo: z.string().min(1, "LP No. is required"),
  vessel: z.string().min(1, "Vessel is required"),
  voy: z.string().min(1, "Voyage is required"),
  arrivalDate: z.string().optional(),
  loadingPort: z.string().min(1, "Loading port is required"),
  loadingPortCode: z.string().min(1, "LoadingPort code required"),
  dischargePort: z.string().min(1, "Discharge port is required"),
  dischargePortCode: z.string().min(1, "DischargePort code required"),
  finalDest: z.string().min(1, "Final destination is required"),
  finalDestCode: z.string().min(1, "FinalDest code required"),
  shipper: z.string().min(1, "Shipper is required"),
  clearingAgent: z.string().optional(),
  transporter: z.string().optional(),
  chalanNo: z.string().optional(),
  cancel: z.boolean().default(false),
  sizes: z.array(
    z.object({
      size: z.enum(["20GP", "40HQ", "40GP", "40FR"]),
      totalQty: z.number().default(0),
      pickedQty: z.number().default(0),
      readonly: z.boolean().default(false),
      cancel: z.boolean().default(false),
    })
  ).min(1, "At least one size is required"),
});

type LoadingProgramForm = z.infer<typeof loadingProgramSchema>;

// -----------------------------------------------------------------------------
// Mock API (replace with real endpoints in production)
// -----------------------------------------------------------------------------
interface LPRecord {
  id: string;
  lpNo: string;
  vessel: string;
  voy: string;
  line: string;
  terminal: string;
  yard: string;
  arrivalDate: string;
  loadingPort: string;
  dischargePort: string;
  finalDest: string;
  shipper: string;
  status: "Active" | "Cancelled" | "Completed";
  totalQty: number;
  pickedQty: number;
}

const mockRecords: LPRecord[] = [
  {
    id: "1",
    lpNo: "LP-2024-001",
    vessel: "MSC OSCAR",
    voy: "024E",
    line: "MSC",
    terminal: "KICT",
    yard: "Y-01",
    arrivalDate: "2024-03-15",
    loadingPort: "Karachi",
    dischargePort: "Rotterdam",
    finalDest: "Hamburg",
    shipper: "Kohinoor Textile",
    status: "Active",
    totalQty: 1200,
    pickedQty: 850,
  },
  // …other mock records omitted for brevity
];

const fetchLPRecords = async (): Promise<LPRecord[]> => {
  await new Promise((r) => setTimeout(r, 600));
  return mockRecords;
};

const createLPRecord = async (data: LoadingProgramForm): Promise<LPRecord> => {
  await new Promise((r) => setTimeout(r, 800));
  return {
    id: String(Date.now()),
    lpNo: data.lpNo,
    vessel: data.vessel,
    voy: data.voy,
    line: data.line,
    terminal: data.terminal,
    yard: data.yard,
    arrivalDate: data.arrivalDate ?? "",
    loadingPort: data.loadingPort,
    dischargePort: data.dischargePort,
    finalDest: data.finalDest,
    shipper: data.shipper,
    status: data.cancel ? "Cancelled" : "Active",
    totalQty: data.sizes.reduce((sum, s) => sum + s.totalQty, 0),
    pickedQty: data.sizes.reduce((sum, s) => sum + s.pickedQty, 0),
  };
};

// -----------------------------------------------------------------------------
// Table column definitions for the records table
// -----------------------------------------------------------------------------
const columnHelper = createColumnHelper<LPRecord>();
const recordColumns = [
  columnHelper.accessor("lpNo", { header: "LP No." }),
  columnHelper.accessor("line", { header: "Line" }),
  columnHelper.accessor("vessel", { header: "Vessel" }),
  columnHelper.accessor("voy", { header: "Voy" }),
  columnHelper.accessor("arrivalDate", { header: "Arrival" }),
  columnHelper.accessor("shipper", { header: "Shipper" }),
  columnHelper.accessor("status", { header: "Status" }),
];

// -----------------------------------------------------------------------------
// Size Grid component – uses Select for size choices
// -----------------------------------------------------------------------------
function SizeGrid({ control }: { control: Control<LoadingProgramForm>; }) {
  const { fields, append, remove } = useFieldArray<
  LoadingProgramForm,
  "sizes"
>({
  control,
  name: "sizes",
});
  const sizeOptions = ["20GP", "40HQ", "40GP", "40FR"];
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Size Grid</h3>
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            append({ size: "20GP", totalQty: 0, pickedQty: 0, readonly: false, cancel: false })
          }
        >
          Add Row
        </Button>
      </div>
      <Table>
        <thead>
          <tr>
            <th>Size</th>
            <th>Total Qty</th>
            <th>Picked Qty</th>
            <th>Read_Only</th>
            <th>Cancel</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field, i) => (
            <tr key={field.id} className="border-t">
              <td>
                <Controller
        control={control}
       name={`sizes.${i}.size` as const}
        render={({ field }) => (
          <Select
            value={field.value}
            onValueChange={field.onChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Size" />
            </SelectTrigger>

            <SelectContent>
              {sizeOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
              </td>
               <td>{field.totalQty}</td>
                <td>{field.pickedQty}</td>
                <td>{field.readonly ? "Yes" : "No"}</td>
              <td>
      <Controller
        control={control}
        name={`sizes.${i}.cancel` as const}
        render={({ field }) => (
          <Checkbox
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        )}
      />
    </td>
              <td>
                <Button variant="destructive" type="button" onClick={() => remove(i)}>
                  ✕
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// Search Section component
// -----------------------------------------------------------------------------
function SearchSection({ onSearch }: { onSearch: (from: Date | undefined, to: Date | undefined) => void }) {
  const [from, setFrom] = useState<Date>();
const [to, setTo] = useState<Date>();
  return (
    <Card className="p-4 mb-4 flex items-center gap-2">
      <DatePicker value={from} onChange={setFrom} placeholder="Date From" />
      <DatePicker value={to} onChange={setTo} placeholder="Date To" />
      <Button
  onClick={() =>
    onSearch(from, to)
  }
>Search</Button>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// Main page component
// -----------------------------------------------------------------------------
export default function LoadingProgramPage() {
  const [queryClient] = useState(
    () => new QueryClient()
  );
  return (
    <QueryClientProvider client={queryClient}>
      <LoadingProgramPageInner />
    </QueryClientProvider>
  );
}

function LoadingProgramPageInner() {
  const [activeTab, setActiveTab] = useState<"LP" | "Repo-Out" | "UpCountry">("LP");
  const [showTable, setShowTable] = useState(true);

  // ----- Form handling -----
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoadingProgramForm>({
    resolver: zodResolver(loadingProgramSchema as any),
    defaultValues: {
      line: "",
      terminal: "",
      yard: "",
      lpNo: "",
      vessel: "",
      voy: "",
      arrivalDate: "",
      loadingPort: "",
      loadingPortCode: "",
      dischargePort: "",
      dischargePortCode: "",
      finalDest: "",
      finalDestCode: "",
      shipper: "",
      clearingAgent: "",
      transporter: "",
      chalanNo: "",
      cancel: false,
      sizes: [{ size: "20GP", totalQty: 0, pickedQty: 0, readonly: false, cancel: false }],
    },
  });

 const { data: programData, isLoading: progLoading } = useQuery({
  queryKey: ["loading-program"],
  queryFn: async (): Promise<LoadingProgramForm> => {
      const res = await fetch("/api/loading-program");
      if (!res.ok) throw new Error("Failed to fetch loading program");
      return res.json();
    }
  });

  const queryClient = useQueryClient();

 const createMutation = useMutation({
  mutationFn: async (payload: LoadingProgramForm) =>
    fetch("/api/loading-program", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => r.json()),

  onSuccess: () =>
    queryClient.invalidateQueries({
      queryKey: ["loading-program"],
    }),
}); 

 const amendMutation = useMutation({
  mutationFn: async (payload: LoadingProgramForm) =>
    fetch(`/api/loading-program/${payload.lpNo}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => r.json()),

  onSuccess: async () => {
  await queryClient.invalidateQueries({
    queryKey: ["loading-program"],
  });
},
});

 const onSubmit: SubmitHandler<LoadingProgramForm> = (data) => {
    if (programData?.lpNo && data.lpNo === programData.lpNo) {
      amendMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  // ----- Records table -----
  const { data: records = [], isLoading: recLoading } = useQuery({
    queryKey: ["lp-records"],
    queryFn: fetchLPRecords,
  });

  const recordsTable = useReactTable({
    data: records,
    columns: recordColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // ----- Search handler -----
  const [searchFrom, setSearchFrom] = React.useState<Date>();
  const [searchTo, setSearchTo] = React.useState<Date>();

  const {
    data: searchResults = [],
    isLoading: searchLoading,
    refetch: refetchSearch,
  } = useQuery({
    queryKey: ["lp-search", searchFrom, searchTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchFrom) params.append("from", searchFrom.toISOString().split('T')[0]);
      if (searchTo) params.append("to", searchTo.toISOString().split('T')[0]);
      const res = await fetch(`/api/loading-program?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch loading programs");
      return res.json();
    },
    enabled: false, // manual trigger via Search button
  });

  const handleSearch = (from: Date | undefined, to: Date | undefined) => {
    setSearchFrom(from);
    setSearchTo(to);
    void refetchSearch();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4">
     <Tabs
  value={activeTab}
  onValueChange={(value) =>
    setActiveTab(value as "LP" | "Repo-Out" | "UpCountry")
  } className="w-full mb-4">
        <TabsList>
          <TabsTrigger value="LP">LP</TabsTrigger>
          <TabsTrigger value="Repo-Out">Repo-Out</TabsTrigger>
          <TabsTrigger value="UpCountry">UpCountry</TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === "LP" && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input {...register("line")} placeholder="Line" />
            <Input {...register("terminal")} placeholder="Terminal" />
            {/* Render all required form fields */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              {/* Yard */}
              <Input {...register("yard")} placeholder="Yard" />
              {/* LP No */}
              <Input {...register("lpNo")} placeholder="LP No" />
              {/* Vessel */}
              <Input {...register("vessel")} placeholder="Vessel" />
              {/* Voy */}
              <Input {...register("voy")} placeholder="Voy" />
              {/* Arrival Date */}
              <Controller
                name="arrivalDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
  value={
    field.value
      ? new Date(field.value)
      : undefined
  }
  onChange={(date) =>
    field.onChange(
      date
        ? date.toISOString().split("T")[0]
        : ""
    )
  }
  placeholder="Arrival Date"
/>
                )}
              />
              {/* Loading Port */}
              <Input {...register("loadingPort")} placeholder="Loading Port" />
              {/* Loading Code */}
              <Input {...register("loadingPortCode")} placeholder="Loading Code" />
              {/* Discharge Port */}
              <Input {...register("dischargePort")} placeholder="Discharge Port" />
              {/* Discharge Code */}
              <Input {...register("dischargePortCode")} placeholder="Discharge Code" />
              {/* Final Destination */}
              <Input {...register("finalDest")} placeholder="Final Destination" />
              {/* Final Code */}
              <Input {...register("finalDestCode")} placeholder="Final Code" />
              {/* Shipper */}
              <Input {...register("shipper")} placeholder="Shipper" />
              {/* Clearing Agent */}
              <Input {...register("clearingAgent")} placeholder="Clearing Agent" />
              {/* Transporter */}
              <Input {...register("transporter")} placeholder="Transporter" />
              {/* Chalan No */}
              <Input {...register("chalanNo")} placeholder="Chalan No" />
            </div>
          </div>

          <SizeGrid control={control} />

          <div className="flex space-x-2 mt-4">
            <Button type="submit" disabled={isSubmitting}>
              {programData?.lpNo ? "Amend" : "Create"}
            </Button>
            <Button type="button" onClick={() => reset()} variant="ghost">
              Ignore
            </Button>
            <Button type="button" onClick={() => setActiveTab("LP")} variant="secondary">
              ChangeLPNo
            </Button>
          </div>
        </form>
      )}

      {activeTab === "Repo-Out" && <div>Repo‑Out content (coming soon)</div>}
      {activeTab === "UpCountry" && <div>UpCountry content (coming soon)</div>}

      {/* Search Section */}
      <SearchSection onSearch={handleSearch} />

      {/* Records Table */}
      {showTable && (
        <Card className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Loading Program Records</h3>
            <Button variant="ghost" onClick={() => setShowTable(!showTable)}>
              {showTable ? "Hide" : "Show"}
            </Button>
          </div>
          <Table>
            <thead>
              {recordsTable.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} onClick={header.column.getToggleSortingHandler()} className="cursor-pointer p-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === "asc" ? " ↑" : header.column.getIsSorted() === "desc" ? " ↓" : null}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {recLoading
                ? [1, 2, 3].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={recordColumns.length} className="p-2 text-center">
                        Loading…
                      </td>
                    </tr>
                  ))
                : recordsTable.getRowModel().rows.map((row) => (
                    <motion.tr key={row.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-t">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="p-2">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
            </tbody>
          </Table>
        </Card>
      )}
    </motion.div>
  );
}
