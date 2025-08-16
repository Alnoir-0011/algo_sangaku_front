import type { Sangaku } from "@/app/lib/definitions";
import Ema from "@/app/ui/Ema";
import { Box, ButtonBase, Typography } from "@mui/material";

interface Props {
  data: Sangaku;
  handleClick: (sangaku: Sangaku) => void;
}
export default function SangakuComponent({ data, handleClick }: Props) {
  const difficultyTranslation = (str: string) => {
    switch (str) {
      case "easy":
        return "簡単";
      case "nomal":
        return "普通";
      default:
        return "難しい";
    }
  };

  return (
    <Ema width={18}>
      <ButtonBase
        onClick={() => {
          handleClick(data);
        }}
      >
        <Box
          sx={{
            display: "flex",
            height: "100%",
            flexDirection: "column",
            justifyContent: "start",
          }}
        >
          <Typography
            variant="h5"
            sx={{
              mb: 1,
              textAlign: "center",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              textOverflow: "ellipsis",
              whiteSpace: "pre-line",
            }}
          >
            {data.attributes.title}
          </Typography>
          <Typography
            variant="inherit"
            sx={{
              mb: 1,
              textAlign: "center",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              textOverflow: "ellipsis",
              whiteSpace: "pre-line",
            }}
          >
            {data.attributes.description}
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "end",
              marginTop: "auto",
            }}
          >
            <Typography
              component="p"
              sx={{
                px: 1,
                py: 0.5,
                border: 1,
                borderRadius: 2,
                textAlign: "right",
              }}
            >
              {difficultyTranslation(data.attributes.difficulty)}
            </Typography>
          </Box>
        </Box>
      </ButtonBase>
    </Ema>
  );
}
