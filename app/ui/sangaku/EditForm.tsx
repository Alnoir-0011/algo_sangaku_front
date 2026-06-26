"use client";

import { updateSangaku } from "@/app/lib/actions/sangaku";
import type { Sangaku, GenerateSourceUsage } from "@/app/lib/definitions";
import SangakuForm from "./SangakuForm";

interface Props {
  sangaku: Sangaku;
  initialUsage: GenerateSourceUsage | undefined;
}

export default function EditSangakuForm({ sangaku, initialUsage }: Props) {
  return (
    <SangakuForm
      action={(prevState, formData, source, difficulty, fixedInputs, description) =>
        updateSangaku(sangaku.id, prevState, formData, source, difficulty, fixedInputs, description)
      }
      initialState={{
        values: {
          title: sangaku.attributes.title,
          description: sangaku.attributes.description,
        },
      }}
      initialSource={sangaku.attributes.source ?? ""}
      initialDescription={sangaku.attributes.description}
      initialFixedInputs={sangaku.attributes.inputs.map((i) => i.content)}
      initialDifficulty={sangaku.attributes.difficulty}
      initialUsage={initialUsage}
    />
  );
}
