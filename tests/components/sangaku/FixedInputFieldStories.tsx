import { useState } from "react";
import FixedInputField from "@/app/ui/sangaku/FixedInputField";

export function FixedInputFieldWrapper({ initial }: { initial: string[] }) {
  const [fixedInputs, setFixedInputs] = useState(initial);
  return (
    <FixedInputField
      fixedInputs={fixedInputs}
      setFixedInputs={setFixedInputs}
    />
  );
}
