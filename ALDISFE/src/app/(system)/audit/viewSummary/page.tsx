import type { Metadata } from "next";
import ViewSummaryClient from "./viewSummaryClient";

export const metadata: Metadata = {
  title: "Fill Audit",
};

export default function UserPage() {
  return <ViewSummaryClient />;
}
