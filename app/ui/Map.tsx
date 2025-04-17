"use client";

import { Loader } from "@googlemaps/js-api-loader";
import { Button } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { renderToString } from "react-dom/server";
import Infowindow from "@/app/ui/Infowindow";

const initialLatLng = { lat: 35.6809591, lng: 139.7673068 }; // 東京駅
const activedistance = 0.1; //km

interface Props {
  mapApiKey: string;
}

interface locationCircle {
  circle: google.maps.Circle;
  innerDot: google.maps.Circle;
}

export default function Map({ mapApiKey }: Props) {
  const mapRef = useRef<google.maps.Map>(undefined);
  const [markers, setMarkers] = useState<
    google.maps.marker.AdvancedMarkerElement[]
  >([]);
  const [circle, setCircle] = useState<locationCircle | null>(null);

  const loader = new Loader({
    apiKey: mapApiKey,
    version: "weekly",
    libraries: ["marker", "places"],
  });

  const getLocation = async () => {
    return new Promise<google.maps.LatLngLiteral>((resolve, rejects) => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (e) => rejects(e),
        );
      }
    })
      .then((position) => {
        return position;
      })
      .catch((e) => {
        console.log(e);
        alert(`位置情報を取得できませんでした: ${e}`);
        return initialLatLng;
      });
  };

  useEffect(() => {
    (async () => {
      if (!mapRef.current) {
        const { Map } = await loader.importLibrary("maps");
        const center = await getLocation();

        const newMap = new Map(document.getElementById("map")!, {
          center,
          zoom: 16,
          mapId: "shrine_map",
        });
        mapRef.current = newMap;
      }
      const map = mapRef.current!;

      google.maps.event.addListenerOnce(map, "bounds_changed", async () => {
        setShrineMarkers();
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setShrineMarkers = async () => {
    const [
      { AdvancedMarkerElement, PinElement },
      { Place, SearchByTextRankPreference },
    ] = await Promise.all([
      loader.importLibrary("marker"),
      loader.importLibrary("places"),
    ]);

    const map = mapRef.current!;
    const bounds = map.getBounds();
    const boundsNE = bounds!.getNorthEast().toJSON();
    const boundsSW = bounds!.getSouthWest().toJSON();
    const request: google.maps.places.SearchByTextRequest = {
      textQuery: "神社 -寺",
      fields: ["displayName", "location", "formattedAddress", "id", "types"],
      locationRestriction: {
        east: boundsNE.lng,
        north: boundsNE.lat,
        south: boundsSW.lat,
        west: boundsSW.lng,
      },
      language: "ja",
      maxResultCount: 10,
      region: "JP",
      rankPreference: SearchByTextRankPreference.DISTANCE,
    };
    const { places } = await Place.searchByText(request);
    markers.map((marker) => {
      marker.position = null;
    });

    const location = await getLocation();

    if (circle) {
      circle.circle.setMap(null);
      circle.innerDot.setMap(null);
    }

    const newCircle = new google.maps.Circle({
      strokeColor: "#1e90ff",
      strokeOpacity: 0.9,
      strokeWeight: 2,
      fillColor: "#1e90ff",
      fillOpacity: 0.4,
      map,
      center: location,
      radius: activedistance * 1000,
    });

    const newInnerDot = new google.maps.Circle({
      strokeColor: "#4169e1",
      strokeOpacity: 1,
      strokeWeight: 1,
      fillColor: "#4169e1",
      fillOpacity: 1,
      map,
      center: location,
      radius: 8,
    });

    setCircle({ circle: newCircle, innerDot: newInnerDot });

    const newMarkers = places.map((place) => {
      const glyphImg = new Image(18);
      glyphImg.src = "/torii-icon.svg";

      const glyphSvgPinElement = new PinElement({
        glyph: glyphImg,
        background: "white",
        borderColor: "red",
      });

      const marker = new AdvancedMarkerElement({
        map,
        position: place.location,
        content: glyphSvgPinElement.element,
      });

      const infowindow = new google.maps.InfoWindow({
        headerContent: place.displayName,
        content: renderToString(
          <Infowindow
            place={place}
            location={location}
            activeDistance={activedistance}
          />,
        ),
        ariaLabel: place.displayName,
      });

      marker.addListener("gmp-click", () => {
        infowindow.open({
          anchor: marker,
          map,
        });
      });

      return marker;
    });

    setMarkers(newMarkers);
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "end",
          marginBottom: "0.5rem",
        }}
      >
        <Button variant="contained" onClick={setShrineMarkers}>
          このエリアで探す
        </Button>
      </div>
      <div>
        <div id="map" style={{ height: "40rem" }} />
      </div>
    </>
  );
}
