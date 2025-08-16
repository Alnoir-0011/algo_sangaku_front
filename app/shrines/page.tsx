import Map from "@/app/ui/shrine/Map";

export default function Page() {
  const mapApiKey = process.env.GOOGLE_MAP_API_KEY!;
  return (
    <>
      <Map mapApiKey={mapApiKey} />
    </>
  );
}
