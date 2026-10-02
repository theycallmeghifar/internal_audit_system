import type { Metadata } from "next";
import UserClient from "./UserClient";

export const metadata: Metadata = {
  title: "User",
};

export default function UserPage() {
  return <UserClient />;
}
