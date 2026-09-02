import { describe, test, expect } from "vitest";
import { distance } from "@/app/lib/distance";

describe("distance", () => {
  test("should return 0 when both positions are identical", () => {
    const pos = { lat: 35.6809591, lng: 139.7673068 };
    expect(distance(pos.lat, pos.lng, pos)).toBeCloseTo(0, 5);
  });

  test("should return a positive distance in kilometers for two different points", () => {
    // 東京駅と新宿駅（直線距離約6.4km）
    const tokyoStation = { lat: 35.6809591, lng: 139.7673068 };
    const shinjukuStation = { lat: 35.6896067, lng: 139.7005713 };

    const result = distance(
      tokyoStation.lat,
      tokyoStation.lng,
      shinjukuStation,
    );

    expect(result).toBeGreaterThan(6);
    expect(result).toBeLessThan(7);
  });

  test("should return a small distance for points within 100m of each other", () => {
    const base = { lat: 35.6809591, lng: 139.7673068 };
    // 緯度方向に約80m移動
    const nearby = { lat: 35.6816865, lng: 139.7673068 };

    const result = distance(base.lat, base.lng, nearby);

    expect(result).toBeLessThan(0.1);
  });
});
