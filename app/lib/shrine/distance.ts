const EARTH_RADIUS_KM = 6371;
const DEG_TO_RAD = Math.PI / 180;

export function distance(
  pos1lat: number,
  pos1lng: number,
  currentPosition: { lat: number; lng: number },
): number {
  const lat1 = pos1lat * DEG_TO_RAD;
  const lng1 = pos1lng * DEG_TO_RAD;
  const lat2 = currentPosition.lat * DEG_TO_RAD;
  const lng2 = currentPosition.lng * DEG_TO_RAD;
  return (
    EARTH_RADIUS_KM *
    Math.acos(
      Math.cos(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1) +
        Math.sin(lat1) * Math.sin(lat2),
    )
  );
}
