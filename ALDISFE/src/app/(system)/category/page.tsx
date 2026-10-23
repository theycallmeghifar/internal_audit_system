import type { Metadata } from "next";
import CategoryClient from "./categoryClient";

export const metadata: Metadata = {
  title: "Category",
};

export default function UserPage() {
  return <CategoryClient />;
}
