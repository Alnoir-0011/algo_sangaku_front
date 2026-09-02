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
import { distance } from "@/app/lib/distance";

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
/* v8 ignore stop */
