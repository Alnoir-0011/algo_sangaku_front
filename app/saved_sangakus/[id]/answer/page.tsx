import { notFound } from "next/navigation";
import Grid from "@mui/material/Grid2";
import Box from "@mui/material/Box";
import { fetchUserAnswerWithSangakuId } from "@/app/lib/data/answer";
import { fetchSavedSangaku } from "@/app/lib/data/sangaku";
import Results from "@/app/ui/answer/Results";
import SourceResult from "@/app/ui/answer/SourseResult";
import ReadOnlyEditor from "@/app/ui/answer/ReadOnlyEditor";
import { Typography } from "@mui/material";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const id = (await params).id;
  const sangaku = await fetchSavedSangaku(id);
  return {
    title: `${sangaku?.attributes.title}の解答結果`,
  };
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page(props: Props) {
  const params = await props.params;
  const id = params.id;
  const answer = await fetchUserAnswerWithSangakuId(id);
  const sangaku = await fetchSavedSangaku(id);

  if (!answer) {
    notFound();
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" mb={1}>
        {sangaku?.attributes.title}の結果
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <ReadOnlyEditor value={answer.attributes.source} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <SourceResult answer={answer} />
          <Results answer={answer} />
        </Grid>
      </Grid>
    </Box>
  );
}
