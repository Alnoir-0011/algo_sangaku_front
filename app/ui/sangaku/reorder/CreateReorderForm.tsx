"use client";

import { createReorderSangaku } from "@/app/lib/actions/sangaku";
import ReorderSangakuForm from "./ReorderSangakuForm";

export default function CreateReorderForm() {
  return (
    <ReorderSangakuForm
      action={createReorderSangaku}
      initialState={{ errors: {} }}
      initialDescription=""
      initialDifficulty="normal"
      initialBlocks={[]}
    />
  );
}
