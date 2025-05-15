import "@/app/ui/infowindow.css";

interface Props {
  place: shrine;
  location: google.maps.LatLngLiteral | { lat: number; lng: number };
  activeDistance: number;
}

interface shrine {
  id: string;
  type: "shrine";
  attributes: {
    name: string;
    address: string;
    latitude: string;
    longitude: string;
    place_id: string;
  };
}

export default function Infowindow({ place, location, activeDistance }: Props) {
  return (
    <>
      {/* <p className="infowindow-content">{place.formattedAddress}</p> */}
      {distance(
        place.attributes.latitude,
        place.attributes.longitude,
        location,
      ) < activeDistance && (
        <>
          <p className="infowindow-content">算額の数: {0}</p>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <a
              href={"#"}
              className="infowindow-button"
              style={{ marginRight: "0.5rem" }}
            >
              <span style={{ color: "white" }}>算額を見る</span>
            </a>
            <a href={"#"} className="infowindow-button">
              <span style={{ color: "white" }}>算額を奉納する</span>
            </a>
          </div>
        </>
      )}
      {distance(
        place.attributes.latitude,
        place.attributes.longitude,
        location,
      ) < activeDistance || <p>神社から離れています</p>}
    </>
  );
}

const R = Math.PI / 180;

function distance(
  pos1lat: string,
  pos1lng: string,
  currentPosition: { lat: number; lng: number },
) {
  const lat1 = parseFloat(pos1lat) * R;
  const lng1 = parseFloat(pos1lng) * R;
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
