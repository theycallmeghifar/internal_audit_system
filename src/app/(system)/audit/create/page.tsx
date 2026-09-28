import type { Metadata } from "next";
import CreateAuditClient from "./CreateAuditClient";

export const metadata: Metadata = {
  title: "User",
};

export default function UserPage() {
  return <CreateAuditClient />;
}
