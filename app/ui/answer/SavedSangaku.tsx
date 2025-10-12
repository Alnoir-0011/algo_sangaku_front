import { Sangaku } from "@/app/lib/definitions";
import Ema from "@/app/ui/Ema";
import Grid from "@mui/material/Grid2";
import { Box, Button, Typography } from "@mui/material";
import { difficultyTranslation } from "../utility";
import Link from "next/link";

interface Props {
  sangaku: Sangaku;
  answerd?: boolean;
}

export default function SavedSangaku({ sangaku, answerd }: Props) {
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
              justifyContent: "space-between",
              marginTop: "auto",
            }}
          >
            <Typography
              sx={{
                textAlign: "center",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                textOverflow: "ellipsis",
                whiteSpace: "pre-line",
                alignContent: "center",
              }}
            >
              {sangaku.attributes.author_name}
            </Typography>
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
        {answerd || (
          <Button
            variant="contained"
            href={`/saved_sangakus/${sangaku.id}/answer/create`}
            LinkComponent={Link}
          >
            算額を解く
          </Button>
        )}
        {answerd && (
          <Button
            variant="contained"
            href={`/saved_sangakus/${sangaku.id}/answer`}
            LinkComponent={Link}
          >
            結果を見る
          </Button>
        )}
      </Box>
    </Grid>
  );
}
