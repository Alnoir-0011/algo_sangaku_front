import {
  AdvancedMarker,
  Pin,
  InfoWindow,
  useAdvancedMarkerRef,
} from "@vis.gl/react-google-maps";
import { useCallback, useState } from "react";
import type { Shrine } from "../../lib/definitions";
import NextLink from "next/link";
import { Box, Typography, Button } from "@mui/material";
import { activeDistance } from "./Map";

interface Props {
  shrine: Shrine;
  currentPosition: { lat: number; lng: number };
}

/* v8 ignore start */
export default function ShrineMarker({ shrine, currentPosition }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [markerRef, marker] = useAdvancedMarkerRef();

  const glyphImg = new Image(18);
  glyphImg.src = "/torii-icon.svg";

  const handleMarkerClick = useCallback(() => setIsOpen(true), []);
  const handleClose = useCallback(() => setIsOpen(false), []);

  const dist = distance(
    shrine.attributes.latitude,
    shrine.attributes.longitude,
    currentPosition,
  );

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{
          lat: shrine.attributes.latitude,
          lng: shrine.attributes.longitude,
        }}
        onClick={handleMarkerClick}
      >
        <Pin glyph={glyphImg} background="white" borderColor="red" />
      </AdvancedMarker>
      {isOpen && (
        <InfoWindow
          anchor={marker}
          onClose={handleClose}
          headerContent={<Typography>{shrine.attributes.name}</Typography>}
        >
          {dist < activeDistance && (
            <>
              <Typography variant="inherit" sx={{ mb: 1 }}>
                算額の数: {shrine.attributes.sangaku_count ?? 0}
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Button
                  variant="contained"
                  LinkComponent={NextLink}
                  href={`shrines/${shrine.id}/sangakus`}
                  sx={{ marginRight: "0.5rem" }}
                >
                  算額を見る
                </Button>
                <Button
                  variant="contained"
                  LinkComponent={NextLink}
                  href={`/shrines/${shrine.id}/dedicate`}
                >
                  算額を奉納する
                </Button>
              </Box>
            </>
          )}
          {dist >= activeDistance && (
            <Typography variant="inherit">神社から離れています</Typography>
          )}
        </InfoWindow>
      )}
    </>
  );
}

const R = Math.PI / 180;

function distance(
  pos1lat: number,
  pos1lng: number,
  currentPosition: { lat: number; lng: number },
) {
  const lat1 = pos1lat * R;
  const lng1 = pos1lng * R;
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
/* v8 ignore stop */
