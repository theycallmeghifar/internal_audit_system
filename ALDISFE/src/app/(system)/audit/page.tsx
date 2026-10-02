import type { Metadata } from "next";
import AuditClient from "./auditClient";

export const metadata: Metadata = {
  title: "Audit",
};

export default function AuditPage() {
  return <AuditClient />;
}
