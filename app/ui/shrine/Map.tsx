"use client";

import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { useLayoutEffect, useState } from "react";
import { Box, Button } from "@mui/material";
import type { Shrine } from "@/app/lib/definitions";
import ShrineMarker from "./ShrineMarker";
import { fetchShrines } from "../../lib/data/shrine";
import { MapSkeleton } from "../skeletons";

export const activeDistance = 0.1;
const initialLatLng = { lat: 35.6809591, lng: 139.7673068 }; // 東京駅

interface Props {
  mapApiKey: string;
}

interface locationCircle {
  circle: google.maps.Circle;
  innerDot: google.maps.Circle;
}

export default function MapProvider({ mapApiKey }: Props) {
  return (
    <APIProvider apiKey={mapApiKey}>
      <MapComponent />
    </APIProvider>
  );
}

function MapComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [center, setCenter] = useState(initialLatLng);
  const [completeLoadEvent, setCompleteLoadEvent] = useState(false);
  const [shrines, setShrines] = useState<Shrine[]>([]);
  const [circle, setCircle] = useState<locationCircle | null>(null);

  const map = useMap();

  useLayoutEffect(() => {
    (async () => {
      setIsLoading(true);
      const new_center = await getLocation();
      setCenter(new_center);
      setIsLoading(false);
    })();
  }, []);

  const loadShrines = async () => {
    const bounds = map?.getBounds();
    const boundsSW = bounds!.getSouthWest().toJSON();
    const boundsNE = bounds!.getNorthEast().toJSON();
    const newShrines = await fetchShrines(
      boundsSW.lat.toString(),
      boundsNE.lat.toString(),
      boundsSW.lng.toString(),
      boundsNE.lng.toString(),
    );
    setShrines(newShrines);

    const location = await getLocation();

    if (circle) {
      circle.circle.setMap(null);
      circle.innerDot.setMap(null);
    }

    const newCircle = new google.maps.Circle({
      clickable: false,
      strokeColor: "#1e90ff",
      strokeOpacity: 0.9,
      strokeWeight: 2,
      fillColor: "#1e90ff",
      fillOpacity: 0.4,
      map,
      center: location,
      radius: activeDistance * 1000,
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
  };

  if (isLoading) {
    return <MapSkeleton />;
  }

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "end", mb: "0.5rem" }}>
        <Button
          variant="contained"
          onClick={() => {
            loadShrines();
          }}
        >
          このエリアで探す
        </Button>
      </Box>
      <Map
        defaultCenter={center}
        defaultZoom={16}
        onTilesLoaded={() => {
          if (!completeLoadEvent) {
            loadShrines();
            setCompleteLoadEvent(true);
          }
        }}
        mapId="SHRINE_MAP"
        style={{ height: "40rem" }}
      >
        {shrines.map((shrine) => (
          <ShrineMarker
            key={shrine.id}
            shrine={shrine}
            currentPosition={center}
          />
        ))}
      </Map>
    </>
  );
}

async function getLocation() {
  return new Promise<{ lat: number; lng: number }>((resolve, rejects) => {
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
  }).then((position) => {
    return position;
  });
}
