"use client";

import { Tab, Tabs } from "@mui/material";
import { SyntheticEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Map from "./Map";
import ShrineSearch from "./ShrineSearch";

interface Props {
  mapApiKey: string;
}

export default function ShrinesTabs({ mapApiKey }: Props) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "search" ? "/shrines?tab=search" : "/shrines";

  const [value, setValue] = useState(tab);
  const router = useRouter();

  const handleChange = (_e: SyntheticEvent, newValue: string) => {
    setValue(newValue);
    router.push(newValue);
  };

  return (
    <>
      <Tabs centered value={value} onChange={handleChange} sx={{ mb: 3 }}>
        <Tab value="/shrines" label="地図から探す" />
        <Tab value="/shrines?tab=search" label="検索" />
      </Tabs>
      {value === "/shrines?tab=search" ? (
        <ShrineSearch />
      ) : (
        <Map mapApiKey={mapApiKey} />
      )}
    </>
  );
}
