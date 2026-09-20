import type { Metadata } from "next";
import AboutScene from "@/components/pages/AboutScene";
import { getAbout } from "@/lib/data";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "About | JYC",
  description: "The story of Jaypee Youth Club, told as a timeline.",
};

export default async function AboutPage() {
  const { intro, story } = await getAbout();
  return <AboutScene intro={intro} story={story} />;
}
