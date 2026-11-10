import { Box, Button, Typography, type SxProps } from "@mui/material";
import { SESSION_EXPIRED_MESSAGE } from "@/app/lib/constants";
import { SessionExpiredError } from "@/app/lib/sangaku/sangaku-detail";

interface Props {
  error: unknown;
  failedMessage: string;
  onRetry: () => void;
  variant?: "body1" | "body2";
  sx?: SxProps;
}

export default function DetailFetchError({
  error,
  failedMessage,
  onRetry,
  variant,
  sx,
}: Props) {
  if (error instanceof SessionExpiredError) {
    return (
      <Box role="alert" sx={sx}>
        <Typography variant={variant} color="error">
          {SESSION_EXPIRED_MESSAGE}
        </Typography>
      </Box>
    );
  }

  return (
    <Box role="alert" sx={sx}>
      <Typography variant={variant} color="error" sx={{ mb: 1 }}>
        {failedMessage}
      </Typography>
      <Button variant="outlined" size="small" type="button" onClick={onRetry}>
        再試行
      </Button>
    </Box>
  );
}
