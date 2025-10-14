import Form from "@/app/ui/sangaku/create-form";
import { Box } from "@mui/material";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "算額を作る",
};

export default function Page() {
  return (
    <Box>
      <h2 style={{ marginTop: 0 }}>算額を作る</h2>
      <Form />
    </Box>
  );
}
