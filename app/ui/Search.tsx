"use client";

import { Box, TextField } from "@mui/material";
import { useDebouncedCallback } from "use-debounce";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import SearchIcon from "@mui/icons-material/Search";

interface Props {
  placeholder: string;
}

export default function Search({ placeholder }: Props) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const handleSearch = useDebouncedCallback((term) => {
    const params = new URLSearchParams(searchParams);
    params.delete("page");
    if (term) {
      params.set("query", term);
    } else {
      params.delete("query");
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);
  return (
    <Box sx={{ position: "relative" }}>
      <TextField
        fullWidth
        variant="outlined"
        onChange={(e) => {
          handleSearch(e.target.value);
        }}
        defaultValue={searchParams.get("query")?.toString()}
        placeholder={placeholder}
      />
      <SearchIcon sx={{ position: "absolute", right: 7, top: 17 }} />
    </Box>
  );
}
