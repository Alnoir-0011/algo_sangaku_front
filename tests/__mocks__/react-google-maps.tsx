import type { CSSProperties, ReactNode } from "react";

/**
 * E2E テスト用の `@vis.gl/react-google-maps` モック。
 *
 * 実際の Google Maps JS API をロードせず、地図に依存しない最小限のスタブを提供する。
 * CI には Google Maps の API キーが無く、実地図は AuthFailure で描画されないため、
 * `useMap().getBounds()` を固定値で返して loadShrines（fetchShrines）を安定して
 * 呼び出せるようにする。差し替えは next.config.ts の webpack alias（E2E_MOCK_MAPS=true）で行う。
 */

export function APIProvider({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

export function Map({
  children,
  style,
}: { children?: ReactNode; style?: CSSProperties } & Record<string, unknown>) {
  return (
    <div
      data-testid="map-mock"
      style={{
        ...style,
        backgroundColor: "#cccccc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#555555",
        fontWeight: "bold",
      }}
    >
      モックマップ（E2E テスト用・実際の地図は表示されません）
      {children}
    </div>
  );
}

// loadShrines は map.getBounds().getSouthWest()/getNorthEast() を使うため、固定 bounds を返す
export function useMap() {
  return {
    getBounds: () => ({
      getSouthWest: () => ({ toJSON: () => ({ lat: 35.68, lng: 139.76 }) }),
      getNorthEast: () => ({ toJSON: () => ({ lat: 35.69, lng: 139.77 }) }),
    }),
  };
}

export function AdvancedMarker({
  children,
  onClick,
}: { children?: ReactNode; onClick?: () => void } & Record<
  string,
  unknown
>) {
  return (
    <div data-testid="advanced-marker-mock" onClick={onClick}>
      {children}
    </div>
  );
}

export function Pin() {
  return null;
}

export function InfoWindow({ children }: { children?: ReactNode } & Record<string, unknown>) {
  return <>{children}</>;
}

export function useAdvancedMarkerRef() {
  return [() => {}, null] as const;
}
