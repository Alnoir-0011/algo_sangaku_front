/* v8 ignore start */
export async function getCurrentPosition(): Promise<{
  lat: number;
  lng: number;
} | null> {
  if (!("geolocation" in navigator)) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        resolve(null);
      },
    );
  });
}
/* v8 ignore stop */
