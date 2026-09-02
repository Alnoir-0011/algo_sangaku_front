import ShrinesTabs from "@/app/ui/shrine/ShrinesTabs";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "神社を探す",
};

export default function Page() {
  const mapApiKey = process.env.GOOGLE_MAP_API_KEY!;
  return (
    <>
      <ShrinesTabs mapApiKey={mapApiKey} />
    </>
  );
}
