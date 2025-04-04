import Map from "@/app/ui/Map";

export default function Page() {
  const mapApiKey = process.env.GOOGLE_MAP_API_KEY!;
  return (
    <>
      <Map mapApiKey={mapApiKey} />
    </>
  );
}
