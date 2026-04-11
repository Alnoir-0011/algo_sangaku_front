import type { Shrine } from "@/app/lib/definitions";

export const fetchShrines = async (): Promise<Shrine[]> => [];

export const fetchShrine = async (_id: string): Promise<Shrine | null> => ({
  id: "1",
  type: "shrine",
  attributes: {
    name: "テスト神社",
    address: "東京都テスト区1-1-1",
    latitude: "35.6762",
    longitude: "139.6503",
    place_id: "place123",
  },
});
