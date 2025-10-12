import { Box, CircularProgress } from "@mui/material";

export function SourceResultLoading() {
  return (
    <Box display="flex" justifyContent="center" alignItems="center">
      <CircularProgress size={240} sx={{ m: 3 }} />
    </Box>
  );
}

export function ResultLoading({ index }: { index: number }) {
  return (
    <Box
      sx={{
        display: "flex",
        borderBottom: "1px solid gray",
      }}
    >
      <Box
        sx={{
          borderRight: "1px solid gray",
          width: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
        }}
      >
        {index + 1}
      </Box>
      <Box
        display="flex"
        justifyContent="center"
        sx={{ flexGrow: 1, p: 1, borderRight: "1px solid gray" }}
      >
        <CircularProgress size={24} />
      </Box>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        sx={{ p: 1, width: 50 }}
      >
        <CircularProgress size={24} />
      </Box>
    </Box>
  );
}
