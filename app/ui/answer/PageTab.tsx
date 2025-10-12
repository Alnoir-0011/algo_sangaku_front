"use client";

import { Tab, Tabs } from "@mui/material";
import { SyntheticEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PageTab() {
  const searchParams = useSearchParams();
  const tab =
    searchParams.get("tab") === "answered"
      ? "/saved_sangakus?tab=answered"
      : "/saved_sangakus";

  const [value, setValue] = useState(tab);
  const router = useRouter();

  const handleChange = (_e: SyntheticEvent, newValue: string) => {
    setValue(newValue);
    router.push(newValue);
  };

  return (
    <Tabs
      centered
      variant="fullWidth"
      value={value}
      onChange={handleChange}
      sx={{ mb: 3 }}
    >
      <Tab value="/saved_sangakus" label="未解答" />
      <Tab value="/saved_sangakus?tab=answered" label="解答済み" />
    </Tabs>
  );
}
