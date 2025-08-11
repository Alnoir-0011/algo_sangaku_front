import { Box, Grid2, Skeleton } from "@mui/material";

export function UserSangakuListSkeleton() {
  return (
    <Grid2
      container
      direction="row"
      spacing={3}
      sx={{
        justifyContent: "center",
        alignItems: "flex-start",
        mt: 3,
        mb: 2,
      }}
    >
      {[...Array(9)].map((_, i: number) => (
        <Grid2 key={i}>
          <Skeleton
            variant="rectangular"
            width={288}
            height={183.27}
            sx={{
              boxShadow: 3,
              clipPath: "polygon(0% 25%, 0% 100%, 100% 100%, 100% 25%, 50% 0%)",
              // backgroundColor: "#F4CE93",
              // width: `${width}rem`,
              height: "auto",
              aspectRatio: "11 / 7",
              // paddingTop: `calc(${width}rem * 0.16)`,
              // paddingLeft: "0.75rem",
              // paddingRight: "0.75rem",
              // paddingBottom: "0.75rem",
            }}
          />
        </Grid2>
      ))}
    </Grid2>
  );
}

export function MapSkeleton() {
  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "end", mb: "0.5rem" }}>
        <Skeleton variant="rounded" width="9rem" height="36.5px" />
      </Box>
      <Skeleton variant="rectangular" height="40rem" />
    </>
  );
}
