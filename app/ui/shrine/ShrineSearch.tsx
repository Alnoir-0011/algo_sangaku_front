"use client";

import { useEffect, useState } from "react";
import { Alert, Box, Typography } from "@mui/material";
import type { Shrine } from "@/app/lib/definitions";
import { fetchShrinesByLocation } from "../../lib/data/shrine";
import { distance } from "@/app/lib/distance";
import { getCurrentPosition } from "@/app/lib/geolocation";
import { activeDistance } from "./Map";
import ShrineListCard from "./ShrineListCard";
import { ShrineSearchSkeleton } from "../skeletons";

export default function ShrineSearch() {
  const [isLoading, setIsLoading] = useState(true);
  const [locationError, setLocationError] = useState(false);
  const [shrines, setShrines] = useState<Shrine[]>([]);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const currentLocation = await getCurrentPosition();
      if (!currentLocation) {
        setLocationError(true);
        setIsLoading(false);
        return;
      }
      setLocation(currentLocation);
      const newShrines = await fetchShrinesByLocation(
        currentLocation.lat.toString(),
        currentLocation.lng.toString(),
      );
      setShrines(newShrines);
      setIsLoading(false);
    })();
  }, []);

  if (isLoading) {
    return <ShrineSearchSkeleton />;
  }

  if (locationError || !location) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        位置情報を取得できませんでした。位置情報の利用を許可してください。
      </Alert>
    );
  }

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
