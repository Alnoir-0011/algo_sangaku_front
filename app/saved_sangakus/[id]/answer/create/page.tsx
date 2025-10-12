import { fetchSavedSangaku } from "@/app/lib/data/sangaku";
import { notFound } from "next/navigation";
import Form from "@/app/ui/answer/create-form";

interface Props {
  params: Promise<{ id: string }>;
}
export default async function Page(props: Props) {
  const params = await props.params;
  const id = params.id;
  const sangaku = await fetchSavedSangaku(id, "before_answer");

  if (!sangaku) {
    notFound();
  }

  return <Form sangaku={sangaku} />;
}
