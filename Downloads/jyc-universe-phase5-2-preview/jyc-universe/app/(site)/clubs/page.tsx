import type { Metadata } from "next";
import ClubsScene from "@/components/pages/ClubsScene";
import { clubsByWorld } from "@/lib/archive";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Clubs | JYC",
  description: "Every Jaypee Youth Club club, grouped by world.",
};

export default async function ClubsPage() {
  return <ClubsScene worlds={await clubsByWorld()} />;
}
