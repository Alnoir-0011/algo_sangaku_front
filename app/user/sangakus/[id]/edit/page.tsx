import { fetchUserSangaku } from "@/app/lib/data/sangaku";
import { notFound } from "next/navigation";
import Form from "@/app/ui/sangaku/edit-form";
import { Box } from "@mui/material";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "算額を編集する",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page(props: Props) {
  const params = await props.params;
  const id = params.id;

  const sangaku = await fetchUserSangaku(id);

  if (!sangaku) {
    notFound();
  }

  return (
    <Box>
      <h2 style={{ marginTop: 0 }}>算額を編集する</h2>
      <Form sangaku={sangaku} />
    </Box>
  );
}
