import { fetchSavedSangaku } from "@/app/lib/data/sangaku";
import { notFound } from "next/navigation";
import Form from "@/app/ui/answer/CreateForm";
import { Metadata } from "next";
import { cache } from "react";

const getSangaku = cache((id: string) =>
  fetchSavedSangaku(id, "before_answer"),
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const id = (await params).id;
  const sangaku = await getSangaku(id);
  return {
    title: `${sangaku?.attributes.title}を解く`,
  };
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page(props: Props) {
  const params = await props.params;
  const id = params.id;
  const sangaku = await getSangaku(id);

  if (!sangaku) {
    notFound();
  }

  return <Form sangaku={sangaku} />;
}
