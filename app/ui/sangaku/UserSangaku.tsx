import type { Sangaku } from "@/app/lib/definitions";
import Ema from "@/app/ui/Ema";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import MenuButton from "@/app/ui/sangaku/MenuButton";

interface Props {
  sangaku: Sangaku;
}

export default function UserSangaku({ sangaku }: Props) {
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
    <Grid sx={{ position: "relative" }}>
      <Ema width={19}>
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
            {sangaku.attributes.title}
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
            {sangaku.attributes.description}
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
              {difficultyTranslation(sangaku.attributes.difficulty)}
            </Typography>
          </Box>
        </Box>
      </Ema>
      <Box sx={{ position: "absolute", right: 0, top: 0 }}>
        <MenuButton sangaku={sangaku} />
      </Box>
    </Grid>
  );
}
