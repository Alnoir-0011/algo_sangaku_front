import Form from "@/app/ui/sangaku/create-form";
import { Box } from "@mui/material";
import { Metadata } from "next";
import { fetchGenerateSourceUsage } from "@/app/lib/data/sangaku";

export const metadata: Metadata = {
  title: "算額を作る",
};

export default async function Page() {
  const initialUsage = await fetchGenerateSourceUsage();

  return (
    <Box>
      <h2 style={{ marginTop: 0 }}>算額を作る</h2>
      <Form initialUsage={initialUsage} />
    </Box>
  );
}
