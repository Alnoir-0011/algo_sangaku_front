import Map from "@/app/ui/Map";

export default function Page() {
  const mapApiKey = process.env.GOOGLE_MAP_API_KEY!;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
  return (
    <>
      <Map mapApiKey={mapApiKey} apiUrl={apiUrl} />
    </>
  );
}
