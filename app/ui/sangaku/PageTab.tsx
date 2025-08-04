"use client";

import { Tab, Tabs } from "@mui/material";
import { SyntheticEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PageTab() {
  const searchParams = useSearchParams();
  const tab =
    searchParams.get("tab") === "already_dedicate"
      ? "/user/sangakus?tab=already_dedicate"
      : "/user/sangakus";

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
      <Tab value="/user/sangakus" label="手持ちの算額" />
      <Tab value="/user/sangakus?tab=already_dedicate" label="奉納した算額" />
    </Tabs>
  );
}
