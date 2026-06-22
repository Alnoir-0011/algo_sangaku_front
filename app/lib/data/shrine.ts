"use server";

import { setFlash } from "../actions/flash";
import { handleApiError } from "../handle_api_error";
import { Shrine } from "../definitions";
import { buildHeaders } from "@/app/lib/client_headers";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { apiUrl } from "@/app/lib/config";

function isValidLatLng(lat: string, lng: string): boolean {
  const latNum = Number.parseFloat(lat);
  const lngNum = Number.parseFloat(lng);
  return (
    Number.isFinite(latNum) && latNum >= -90 && latNum <= 90 &&
    Number.isFinite(lngNum) && lngNum >= -180 && lngNum <= 180
  );
}

export async function fetchShrines(
  lowLat: string,
  highLat: string,
  lowLng: string,
  highLng: string,
) {
  if (!isValidLatLng(lowLat, lowLng) || !isValidLatLng(highLat, highLng)) {
    return [] as Shrine[];
  }

  try {
    const params = new URLSearchParams({ searchType: "Map" });
    params.set("lowLat", lowLat);
    params.set("highLat", highLat);
    params.set("lowLng", lowLng);
    params.set("highLng", highLng);

    const res = await fetch(`${apiUrl}/api/v1/shrines?${params}`, { headers: buildHeaders() });

    if (res.status === 200) {
      const data = await res.json();
      return data.data as Shrine[];
    } else if (res.status === 429) {
      await handleApiError(res);
      return [] as Shrine[];
    } else {
      await setFlash({ type: "error", message: "神社を読み込めませんでした" });
      return [] as Shrine[];
    }
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[data/shrine] fetchShrines error:", error);
    await setFlash({ type: "error", message: "リクエストに失敗しました" });
    return [] as Shrine[];
  }
}

export async function fetchShrine(id: string) {
  try {
    const res = await fetch(`${apiUrl}/api/v1/shrines/${id}`, {
      headers: buildHeaders(),
    });

    if (res.status === 200) {
      const data = await res.json();
      return data.data as Shrine;
    } else {
      return null;
    }
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[data/shrine] fetchShrine error:", error);
    return null;
  }
}
