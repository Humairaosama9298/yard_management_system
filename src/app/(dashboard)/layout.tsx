import DashboardLayoutClient from "@/components/modules/dashboard-layout-client";

export const metadata = {
  title: "Dashboard",
  description: "Yard System Dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
