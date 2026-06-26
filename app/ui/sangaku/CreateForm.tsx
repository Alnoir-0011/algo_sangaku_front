"use client";

import { createSangaku } from "@/app/lib/actions/sangaku";
import type { GenerateSourceUsage } from "@/app/lib/definitions";
import SangakuForm from "./SangakuForm";

const initialSource = "# 対応言語: Ruby\ninput = gets.chomp\nputs input";

interface Props {
  initialUsage: GenerateSourceUsage | undefined;
}

export default function CreateSangakuForm({ initialUsage }: Props) {
  return (
    <SangakuForm
      action={createSangaku}
      initialState={{ errors: {} }}
      initialSource={initialSource}
      initialDescription=""
      initialFixedInputs={[""]}
      initialDifficulty="normal"
      initialUsage={initialUsage}
    />
  );
}
