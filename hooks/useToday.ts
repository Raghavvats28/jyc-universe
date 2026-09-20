"use client";

import { useEffect, useState } from "react";
import { localToday } from "@/lib/dates";

/**
 * The server passes the date it rendered with; after mount we switch to the visitor's
 * real date. This keeps "upcoming" and "past" correct on a statically built page
 * without a hydration mismatch.
 */
export function useToday(initial: string): string {
  const [today, setToday] = useState(initial);
  useEffect(() => setToday(localToday()), []);
  return today;
}
