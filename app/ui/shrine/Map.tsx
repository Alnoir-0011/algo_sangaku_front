"use client";

import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useState, useTransition } from "react";
import { Box, Button } from "@mui/material";
import type { Shrine } from "@/app/lib/definitions";
import ShrineMarker from "./ShrineMarker";
import { fetchShrines } from "../../lib/data/shrine";
import { MapSkeleton } from "../skeletons";
import { useSearchParams } from "next/navigation";
import { getCurrentPosition } from "@/app/lib/geolocation";

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
  // 現在地（ブラウザの位置情報）。決まるまでは null で、地図の代わりにスケルトンを出す
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [completeLoadEvent, setCompleteLoadEvent] = useState(false);
  const [shrines, setShrines] = useState<Shrine[]>([]);
  const [circle, setCircle] = useState<locationCircle | null>(null);
  const [isSearching, startSearching] = useTransition();
  const searchParams = useSearchParams();

  const map = useMap();

  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const hasQueryCenter = Boolean(lat && lng);
  const zoom = hasQueryCenter ? 18 : 16;

  useEffect(() => {
    let ignore = false;

    (async () => {
      const newLocation = (await getCurrentPosition()) ?? initialLatLng;
      if (!ignore) {
        setLocation(newLocation);
      }
    })();

    return () => {
      ignore = true;
    };
  }, []);

  const loadShrines = async () => {
    const bounds = map?.getBounds();
    if (!bounds) return;
    const boundsSW = bounds.getSouthWest().toJSON();
    const boundsNE = bounds.getNorthEast().toJSON();
    const newShrines = await fetchShrines(
      boundsSW.lat.toString(),
      boundsNE.lat.toString(),
      boundsSW.lng.toString(),
      boundsNE.lng.toString(),
    );
    setShrines(newShrines);

    const location = (await getCurrentPosition()) ?? initialLatLng;

    /* v8 ignore start */
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
    /* v8 ignore stop */
  };

  // Server Function（fetchShrines）は Transition 内で呼ぶ（React のドキュメントの注意事項）。
  // await の後の state 更新は Transition にならないが、検索結果の反映なので緊急の更新でよい。
  // Transition 内の例外は Error Boundary に伝わり、ページ全体がエラー画面になる。検索の失敗で
  // 地図を壊さないよう、ここで握る（以前は未処理の reject でログに出るだけだった）。
  const searchShrines = () => {
    startSearching(async () => {
      try {
        await loadShrines();
      } catch (error) {
        console.error("[Map] loadShrines error:", error);
      }
    });
  };

  if (location === null) {
    return <MapSkeleton />;
  }

  const center = hasQueryCenter ? { lat, lng } : location;

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "end", mb: "0.5rem" }}>
        <Button
          variant="contained"
          disabled={isSearching}
          onClick={searchShrines}
        >
          このエリアで探す
        </Button>
      </Box>
      {/* defaultCenter と defaultZoom は初回のマウント時にしか効かないため、
          lat/lng が変わったら key で作り直して、中心を合わせ直す */}
      <Map
        key={`${center.lat},${center.lng},${zoom}`}
        defaultCenter={center}
        defaultZoom={zoom}
        onTilesLoaded={() => {
          /* v8 ignore next */
          if (!completeLoadEvent) {
            searchShrines();
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
            currentPosition={location}
          />
        ))}
      </Map>
    </>
  );
}
