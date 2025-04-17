import "@/app/ui/infowindow.css";

interface Props {
  place: google.maps.places.Place;
  location: google.maps.LatLngLiteral | { lat: number; lng: number };
  activeDistance: number;
}

export default function Infowindow({ place, location, activeDistance }: Props) {
  return (
    <>
      <p className="infowindow-content">{place.formattedAddress}</p>
      {distance(place.location!, location) < activeDistance && (
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <a
            href={`/sangakus?shrine=${place.id}`}
            className="infowindow-button"
            style={{ marginRight: "0.5rem" }}
          >
            <span style={{ color: "white" }}>算額を見る</span>
          </a>
          <a
            href={`/sangakus?shrine=${place.id}`}
            className="infowindow-button"
          >
            <span style={{ color: "white" }}>算額を奉納する</span>
          </a>
        </div>
      )}
      {distance(place.location!, location) < activeDistance || (
        <p>神社から離れています</p>
      )}
    </>
  );
}

const R = Math.PI / 180;

function distance(
  position1: google.maps.LatLng,
  currentPosition: { lat: number; lng: number },
) {
  const lat1 = position1.lat() * R;
  const lng1 = position1.lng() * R;
  const lat2 = currentPosition.lat * R;
  const lng2 = currentPosition.lng * R;
  return (
    6371 *
    Math.acos(
      Math.cos(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1) +
        Math.sin(lat1) * Math.sin(lat2),
    )
  );
}
