import { ReactNode } from "react";
import Box from "@mui/material/Box";

interface Props {
  width: number;
  children: ReactNode;
}

export default function Ema({ width, children }: Props) {
  return (
    <div style={{
      filter: "drop-shadow(3px 3px 2px #aaa)"
    }}>
      <Box sx={{
        boxShadow: 3,
        clipPath: "polygon(0% 25%, 0% 100%, 100% 100%, 100% 25%, 50% 0%)",
        backgroundColor: "#F4CE93",
        width: `${width}rem`,
        height: "auto",
        aspectRatio: "11 / 7",
        paddingTop: `calc(${width}rem * 0.16)`,
        paddingLeft: '0.75rem',
        paddingRight: '0.75rem',
        paddingBottom: '0.75rem',
      }}>
        {children}
      </Box>
    </div>
  );
}
