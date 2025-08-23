import type { Sangaku } from "@/app/lib/definitions";
import Grid from "@mui/material/Grid2";
import Ema from "@/app/ui/Ema";
import { Box, Button, Typography } from "@mui/material";
import { difficultyTranslation } from "@/app/ui/utility";

interface Props {
  sangaku: Sangaku;
}

export default function Sangaku({ sangaku }: Props) {
  return (
    <Grid key={sangaku.id}>
      <Ema width={18}>
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
      <Box sx={{ display: "flex", justifyContent: "end", mt: 1 }}>
        <Button variant="contained">算額を写す</Button>
      </Box>
    </Grid>
  );
}
