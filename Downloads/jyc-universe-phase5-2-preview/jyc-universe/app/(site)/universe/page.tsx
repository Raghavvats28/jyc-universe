import type { Metadata } from "next";
import UniverseScene from "@/components/universe/UniverseScene";

export const metadata: Metadata = { title: "The universe | JYC" };

export default function UniversePage() {
  return <UniverseScene />;
}
