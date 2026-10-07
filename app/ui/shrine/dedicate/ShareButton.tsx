import type { Shrine } from "@/app/lib/definitions";
import XIcon from "@mui/icons-material/X";
import { Button } from "@mui/material";

interface Props {
  shrine: Shrine;
  title: string;
}

export function ShareButton({ shrine, title }: Props) {
  const shareUrl = new URL("/shrines", window.location.origin);
  shareUrl.searchParams.set("lat", String(shrine.attributes.latitude));
  shareUrl.searchParams.set("lng", String(shrine.attributes.longitude));
  const shareUrlString = shareUrl.toString();
  const text = `${shrine.attributes.name}に算額「${title}」を奉納しました\n#アルゴ算額\n`;

  return (
    <Button
      variant="contained"
      href={`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrlString)}`}
      target="_blank"
      rel="noopener noreferrer"
      sx={{ color: "black" }}
    >
      <XIcon />
      でシェア
    </Button>
  );
}
