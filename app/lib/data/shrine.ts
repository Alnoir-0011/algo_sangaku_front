"use server";

import { setFlash } from "../actions/flash";
import { Shrine } from "../definitions";

const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

export async function fetchShrines(
  lowLat: string,
  highLat: string,
  lowLng: string,
  highLng: string,
) {
  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    const params = new URLSearchParams({ searchType: "Map" });
    params.set("lowLat", lowLat);
    params.set("highLat", highLat);
    params.set("lowLng", lowLng);
    params.set("highLng", highLng);

    const res = await fetch(`${apiUrl}/api/v1/shrines?${params}`, { headers });

    if (res.status == 200) {
      const data = await res.json();
      return data.data as Shrine[];
    } else {
      await setFlash({ type: "error", message: "神社を読み込めませんでした" });
      return [] as Shrine[];
    }
  } catch {
    await setFlash({ type: "error", message: "リクエストに失敗しました" });
    return [] as Shrine[];
  }
}

export async function fetchShrine(id: string) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  try {
    const res = await fetch(`${apiUrl}/api/v1/shrines/${id}`, {
      headers,
    });

    if (res.status == 200) {
      const data = await res.json();
      return data.data as Shrine;
    } else {
      return null;
    }
  } catch {
    return null;
  }
}
