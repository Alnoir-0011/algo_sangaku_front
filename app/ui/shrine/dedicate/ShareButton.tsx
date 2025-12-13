import type { Shrine } from "@/app/lib/definitions";
import XIcon from "@mui/icons-material/X";
import { Button } from "@mui/material";

interface Props {
  shrine: Shrine;
  title: string;
}

export function ShareButton({ shrine, title }: Props) {
  const hostname = window.location.origin;
  const uri = `${hostname}shrines?lat=${shrine.attributes.latitude}&lng=${shrine.attributes.longitude}`;
  const text = `${shrine.attributes.name}に算額「${title}」を奉納しました\n#アルゴ算額\n`;

  return (
    <Button
      variant="contained"
      href={`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(uri)}`}
      target="_blank"
      rel="noopener noreferrer"
      sx={{ color: "black" }}
    >
      <XIcon />
      でシェア
    </Button>
  );
}
