import type { Metadata } from "next";
import { RegistrationAdmin } from "@/components/admin/registration-admin";
import "./admin.css";

export const metadata: Metadata = {
  title: "Registration Admin",
  description: "Manage Crack The Code team registrations.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <RegistrationAdmin />;
}
