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

export default function ShrineMarker({ shrine, currentPosition }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [markerRef, marker] = useAdvancedMarkerRef();

  const handleMarkerClick = useCallback(() => setIsOpen(true), []);
  const handleClose = useCallback(() => setIsOpen(false), []);

  const glyphImg = new Image(18);
  glyphImg.src = "/torii-icon.svg";

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{
          lat: Number(shrine.attributes.latitude),
          lng: Number(shrine.attributes.longitude),
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
          {distance(
            shrine.attributes.latitude,
            shrine.attributes.longitude,
            currentPosition,
          ) < activeDistance && (
            <>
              <Typography variant="inherit" sx={{ mb: 1 }}>
                算額の数: {0}
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Button
                  variant="contained"
                  LinkComponent={NextLink}
                  href={"#"}
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
          {distance(
            shrine.attributes.latitude,
            shrine.attributes.longitude,
            currentPosition,
          ) < activeDistance || (
            <Typography variant="inherit">神社から離れています</Typography>
          )}
        </InfoWindow>
      )}
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
