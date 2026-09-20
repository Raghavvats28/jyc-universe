import type { Metadata } from "next";
import GalleryScene from "@/components/pages/GalleryScene";
import { archiveTiles, archiveWorlds } from "@/lib/archive";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Gallery | JYC",
  description: "A visual archive of Jaypee Youth Club: frames from every club, filterable by world.",
};

export default async function GalleryPage() {
  const tiles = await archiveTiles();
  return <GalleryScene tiles={tiles} worlds={await archiveWorlds(tiles)} />;
}
