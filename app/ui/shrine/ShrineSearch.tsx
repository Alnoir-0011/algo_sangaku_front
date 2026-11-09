"use client";

import { useEffect, useState } from "react";
import { Alert, Box, Typography } from "@mui/material";
import type { Shrine } from "@/app/lib/definitions";
import { fetchShrinesByLocation } from "../../lib/data/shrine";
import { distance } from "@/app/lib/shrine/distance";
import { getCurrentPosition } from "@/app/lib/shrine/geolocation";
import { activeDistance } from "./Map";
import ShrineListCard from "./ShrineListCard";
import { ShrineSearchSkeleton } from "../skeletons";

type SearchState =
  | { status: "loading" }
  | { status: "locationError" }
  | {
      status: "loaded";
      location: { lat: number; lng: number };
      shrines: Shrine[];
    };

export default function ShrineSearch() {
  // 読み込み中・位置情報エラー・取得済みは同時に成り立たないため、1 つの state で持つ。
  // 別々の state（isLoading・locationError・location・shrines）にすると、食い違う
  // 組み合わせを作れてしまう。
  const [state, setState] = useState<SearchState>({ status: "loading" });

  useEffect(() => {
    let ignore = false;

    (async () => {
      const currentLocation = await getCurrentPosition();
      if (ignore) return;
      if (!currentLocation) {
        setState({ status: "locationError" });
        return;
      }
      const newShrines = await fetchShrinesByLocation(
        currentLocation.lat.toString(),
        currentLocation.lng.toString(),
      );
      if (ignore) return;
      setState({
        status: "loaded",
        location: currentLocation,
        shrines: newShrines,
      });
    })();

    return () => {
      ignore = true;
    };
  }, []);

  if (state.status === "loading") {
    return <ShrineSearchSkeleton />;
  }

  if (state.status === "locationError") {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        位置情報を取得できませんでした。位置情報の利用を許可してください。
      </Alert>
    );
  }

  const { location, shrines } = state;

  const currentShrines = shrines.filter(
    (shrine) =>
      distance(
        shrine.attributes.latitude,
        shrine.attributes.longitude,
        location,
      ) < activeDistance,
  );
  const currentShrineIds = new Set(currentShrines.map((shrine) => shrine.id));
  const otherShrines = shrines.filter(
    (shrine) => !currentShrineIds.has(shrine.id),
  );

  return (
    <Box sx={{ mt: 2 }}>
      {currentShrines.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            現在いる神社
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {currentShrines.map((shrine) => (
              <ShrineListCard key={shrine.id} shrine={shrine} isNearby />
            ))}
          </Box>
        </Box>
      )}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {otherShrines.map((shrine) => (
          <ShrineListCard key={shrine.id} shrine={shrine} isNearby={false} />
        ))}
      </Box>
    </Box>
  );
}
