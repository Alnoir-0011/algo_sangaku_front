"use client";

import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
} from "@mui/material";
import { useDebouncedCallback } from "use-debounce";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import SearchIcon from "@mui/icons-material/Search";
import { useState } from "react";

interface Props {
  placeholder: string;
  difficulty?: boolean;
}

export default function Search({ placeholder, difficulty }: Props) {
  const searchParams = useSearchParams();
  const initialState = searchParams.get("difficulty")?.toString() || "";
  const [selectedDifficulty, setSelectedDifficulty] = useState(initialState);
  const pathname = usePathname();
  const { replace } = useRouter();
  const handleTextField = useDebouncedCallback((term) => {
    const params = new URLSearchParams(searchParams);
    params.delete("page");
    if (term) {
      params.set("query", term);
    } else {
      params.delete("query");
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  const handleSelect = (e: SelectChangeEvent) => {
    const value = e.target.value;
    setSelectedDifficulty(value);
    const params = new URLSearchParams(searchParams);
    params.delete("page");
    if (value != "") {
      params.set("difficulty", value);
    } else {
      params.delete("difficulty");
    }
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <FormControl sx={{ position: "relative", flexGrow: 1 }}>
        <TextField
          fullWidth={!difficulty}
          variant="outlined"
          onChange={(e) => {
            handleTextField(e.target.value);
          }}
          defaultValue={searchParams.get("query")?.toString()}
          placeholder={placeholder}
        />
        <SearchIcon sx={{ position: "absolute", top: 17, right: 7 }} />
      </FormControl>
      {difficulty && (
        <FormControl>
          <InputLabel id="search-difficulty">難易度</InputLabel>
          <Select
            labelId="search-difficulty"
            label="難易度"
            // defaultValue={searchParams.get("difficulty")?.toString() || ""}
            value={selectedDifficulty}
            onChange={handleSelect}
            sx={{ minWidth: "9rem" }}
          >
            <MenuItem value="">全て</MenuItem>
            <MenuItem value="easy">簡単</MenuItem>
            <MenuItem value="nomal">普通</MenuItem>
            <MenuItem value="difficult">難しい</MenuItem>
            <MenuItem value="very_difficult">とても難しい</MenuItem>
          </Select>
        </FormControl>
      )}
    </Box>
  );
}
