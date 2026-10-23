import type { Metadata } from "next";
import LogClient from "./logClient";

export const metadata: Metadata = {
  title: "Activity Log",
};

export default function LogPage() {
  return <LogClient />;
}
