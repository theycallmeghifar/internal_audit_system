import type { Metadata } from "next";
import FillImprovementClient from "./filImprovementClient";

export const metadata: Metadata = {
  title: "Fill Improvement",
};

export default function UserPage() {
  return <FillImprovementClient />;
}
