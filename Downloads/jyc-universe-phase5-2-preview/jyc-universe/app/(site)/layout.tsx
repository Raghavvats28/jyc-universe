import Hud from "@/components/Hud";
import SceneFrame from "@/components/SceneFrame";
import SiteProvider from "@/components/SiteProvider";
import StarField from "@/components/StarField";
import TravelProvider from "@/components/TravelProvider";
import { getSiteIndex } from "@/lib/data";

/** Content comes from Supabase (or the local sample); refresh at most every 5 minutes. */
export const revalidate = 300;

/**
 * The universe: everything a visitor sees. The star field, the HUD, the menu and the travelling
 * camera wrap every public page, exactly as they did when this lived in the root layout.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const site = await getSiteIndex();
  return (
    <SiteProvider value={site}>
      <TravelProvider>
        <StarField />
        <div className="vignette" aria-hidden />
        <div className="grain" aria-hidden />
        <Hud />
        <SceneFrame>{children}</SceneFrame>
      </TravelProvider>
    </SiteProvider>
  );
}
