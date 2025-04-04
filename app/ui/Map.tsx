"use client";

import { Loader } from "@googlemaps/js-api-loader";
import { Button } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { renderToString } from "react-dom/server";
import Infowindow from "@/app/ui/Infowindow";

const initialLatLng = { lat: 35.6809591, lng: 139.7673068 }; // 東京駅

interface Props {
  mapApiKey: string;
}

export default function Map({ mapApiKey }: Props) {
  const mapRef = useRef<google.maps.Map>(undefined);
  const [markers, setMarkers] = useState<
    google.maps.marker.AdvancedMarkerElement[]
  >([]);

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

        console.log(center);
        const newMap = new Map(document.getElementById("map")!, {
          center,
          zoom: 16,
          mapId: "shrine_map",
        });
        mapRef.current = newMap;
      }
      const map = mapRef.current!;

      google.maps.event.addListenerOnce(map, "bounds_changed", async () => {
        console.log("boundsEvent");
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
    console.log("boundsNE", bounds?.getNorthEast().toJSON());
    const boundsNE = bounds!.getNorthEast().toJSON();
    const boundsSW = bounds!.getSouthWest().toJSON();
    const request: google.maps.places.SearchByTextRequest = {
      textQuery: "神社 -寺",
      fields: ["displayName", "location", "formattedAddress", "id"],
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
    console.log(places);
    markers.map((marker) => {
      marker.position = null;
    });
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
        content: renderToString(<Infowindow place={place} />),
        ariaLabel: place.displayName,
      });

      marker.addListener("gmp-click", () => {
        infowindow.open({
          anchor: marker,
          map,
        });
        // map.setCenter(marker.position!);
      });

      return marker;
    });
    setMarkers(newMarkers);
  };

  return (
    <div style={{ position: "relative" }}>
      <div id="map" style={{ height: "40rem" }} />
      <Button
        variant="contained"
        sx={{ position: "absolute", left: "50%", top: 0, zIndex: 2, m: 1 }}
        onClick={setShrineMarkers}
      >
        このエリアで探す
      </Button>
    </div>
  );
}
