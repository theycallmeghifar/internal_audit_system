import type { Metadata } from "next";
import FillAuditClient from "./filAuditClient";

export const metadata: Metadata = {
  title: "Fill Audit",
};

export default function UserPage() {
  return <FillAuditClient />;
}
