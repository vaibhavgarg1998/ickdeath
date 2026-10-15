import type { Metadata } from "next";
import { AdminApp } from "@/components/admin/AdminApp";
import { AdminAuthProvider } from "@/components/admin/AdminAuthProvider";

export const metadata: Metadata = {
  title: "Admin — ICK DEATH",
  description: "Manage ICK DEATH orders, fulfillment, and product analytics.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <AdminAuthProvider>
      <AdminApp />
    </AdminAuthProvider>
  );
}
