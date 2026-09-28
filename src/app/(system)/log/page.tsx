import type { Metadata } from "next";
import LogClient from "./logClient";

export const metadata: Metadata = {
  title: "User",
};

export default function LogPage() {
  return <LogClient />;
}
