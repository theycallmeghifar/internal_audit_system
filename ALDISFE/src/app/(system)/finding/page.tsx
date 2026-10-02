import type { Metadata } from "next";
import FindingClient from "./findingClient";

export const metadata: Metadata = {
  title: "Finding",
};

export default function FindingPage() {
  return <FindingClient />;
}
