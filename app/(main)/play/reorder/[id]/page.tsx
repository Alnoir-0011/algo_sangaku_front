import type { Metadata, ResolvingMetadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/auth";
import { signinPath } from "@/routes";
import { fetchPublicReorderSangaku } from "@/app/lib/data/sangaku";
import GuestReorderPuzzle from "@/app/ui/play/GuestReorderPuzzle";
import { toPuzzleBlocks } from "@/app/ui/sangaku/reorder/toPuzzleBlocks";

const MAX_DESCRIPTION_LENGTH = 120;

const getSangaku = cache((id: string) => fetchPublicReorderSangaku(id));

function toMetaDescription(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  // slice は UTF-16 単位でサロゲートペアの途中を切りうるため、コードポイント単位で数える
  const codePoints = Array.from(normalized);
  if (codePoints.length <= MAX_DESCRIPTION_LENGTH) return normalized;
  return `${codePoints.slice(0, MAX_DESCRIPTION_LENGTH).join("")}…`;
}

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { id } = await params;
  const sangaku = await getSangaku(id);
  if (!sangaku) return {};

  const title = `${sangaku.attributes.title}を解く`;
  const description = toMetaDescription(sangaku.attributes.description ?? "");
  // 子で openGraph を定義すると親の openGraph（ルートの opengraph-image.png を含む）が
  // 丸ごと置き換わり og:image が消えるため、親の画像を引き継ぐ
  const parentImages = (await parent).openGraph?.images;
  return {
    title,
    description,
    openGraph: { title, description, images: parentImages },
  };
}

export default async function Page(props: Props) {
  const { id } = await props.params;
  const sangaku = await getSangaku(id);
  const session = await auth();

  if (!sangaku) {
    if (!session) {
      redirect(signinPath);
    }
    notFound();
  }

  return (
    <GuestReorderPuzzle
      sangakuId={sangaku.id}
      blocks={toPuzzleBlocks(sangaku.attributes.code_blocks ?? [])}
      title={sangaku.attributes.title}
      description={sangaku.attributes.description}
      isLoggedIn={!!session}
    />
  );
}
