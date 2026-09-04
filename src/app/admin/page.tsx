import type { Metadata } from "next";
import { AdminAuthProvider } from "@/components/admin/AdminAuthProvider";
import { AdminOrdersPanel } from "@/components/admin/AdminOrdersPanel";

export const metadata: Metadata = {
  title: "Admin — ICK DEATH Orders",
  description: "Manage ICK DEATH website orders and fulfillment status.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <AdminAuthProvider>
      <AdminOrdersPanel />
    </AdminAuthProvider>
  );
}
