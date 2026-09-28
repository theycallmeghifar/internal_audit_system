import type { Metadata } from "next";
import StandardClient from "./StandardClient";

export const metadata: Metadata = {
  title: "Standard",
};

export default function StandardPage() {
  return <StandardClient />;
}
