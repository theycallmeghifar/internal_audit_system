import type { Metadata } from "next";
import CategoryClient from "./categoryClient";

export const metadata: Metadata = {
  title: "User",
};

export default function UserPage() {
  return <CategoryClient />;
}
