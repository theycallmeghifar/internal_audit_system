import type { Metadata } from "next";
import ReviewImprovementClient from "./reviewImprovementClient";

export const metadata: Metadata = {
  title: "Review Improvement",
};

export default function UserPage() {
  return <ReviewImprovementClient />;
}
