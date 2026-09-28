import type { Metadata } from "next";
import CalendarClient from "./calendarClient";

export const metadata: Metadata = {
  title: "User",
};

export default function CalendarPage() {
  return <CalendarClient />;
}
