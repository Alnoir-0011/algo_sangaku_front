import { Button, Card, Typography } from "@mui/material";
import Image from "next/image";

interface Props {
  place: google.maps.places.Place;
}

export default function ShrineCard({ place }: Props) {
  return (
    <Card sx={{ mb: 2, p: 1, bgcolor: "#F4CE93" }}>
      <div style={{ display: "flex", alignItems: "start" }}>
        <Image
          src="/torii-icon.svg"
          alt="torii-icon"
          width={48}
          height={48}
          style={{ marginRight: "1rem" }}
        />
        <Typography variant="h5">{place.displayName}</Typography>
      </div>
      <Typography sx={{ mb: 1 }}>算額の数:</Typography>
      <div style={{ display: "flex", justifyContent: "space-around" }}>
        <Button variant="contained" color="secondary" sx={{ color: "white" }}>
          算額を見る
        </Button>
        <Button variant="contained" color="secondary" sx={{ color: "white" }}>
          算額を奉納する
        </Button>
      </div>
    </Card>
  );
}
