import { Box, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import Ema from "@/app/ui/Ema";

interface DedicatedSangaku {
  id: number;
  title: string;
  shrine_name: string;
}

interface Props {
  sangakus: DedicatedSangaku[];
}

export default function DedicatedSangakuList({ sangakus }: Props) {
  return (
    <Box>
      <Typography variant="subtitle1" fontWeight="bold" mb={1}>
        奉納済み算額
      </Typography>
      {sangakus.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          奉納済みの算額はありません
        </Typography>
      ) : (
        <Grid container spacing={2} sx={{ justifyContent: "center", mt: 1 }}>
          {sangakus.map((sangaku) => (
            <Grid key={sangaku.id}>
              <Ema width={12}>
                <Box
                  sx={{
                    display: "flex",
                    height: "100%",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    sx={{
                      textAlign: "center",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {sangaku.title}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ textAlign: "center", mt: 1 }}
                  >
                    {sangaku.shrine_name}
                  </Typography>
                </Box>
              </Ema>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
