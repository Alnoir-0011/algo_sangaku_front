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
import { Kind, isKind } from "@/app/lib/definitions";

interface Props {
  placeholder: string;
  difficulty?: boolean;
  kind?: boolean;
}

export default function Search({ placeholder, difficulty, kind }: Props) {
  const searchParams = useSearchParams();
  const initialState = searchParams.get("difficulty")?.toString() || "";
  const [selectedDifficulty, setSelectedDifficulty] = useState(initialState);
  const kindParam = searchParams.get("kind");
  const initialKindState: Kind | "" =
    kindParam && isKind(kindParam) ? kindParam : "";
  const [selectedKind, setSelectedKind] = useState<Kind | "">(
    initialKindState,
  );
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

  // difficulty・kind 共通: page をリセットしつつ、指定キーのクエリパラメータを
  // 値の有無に応じて set/delete した URLSearchParams を組み立てて画面遷移する
  const applyFilterParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    params.delete("page");
    if (value != "") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    replace(`${pathname}?${params.toString()}`);
  };

  const handleSelect = (e: SelectChangeEvent) => {
    const value = e.target.value;
    setSelectedDifficulty(value);
    applyFilterParam("difficulty", value);
  };

  const handleKindSelect = (e: SelectChangeEvent<Kind | "">) => {
    // SelectChangeEvent<Value> は Event | React.ChangeEvent<HTMLInputElement> の
    // 合併型で、後者の target.value は常に string のため、e.target.value の型は
    // ここでは Kind | "" ではなく string に広がる。isKind で狭めてから状態に入れる
    const value = e.target.value;
    const nextKind: Kind | "" = isKind(value) ? value : "";
    setSelectedKind(nextKind);
    applyFilterParam("kind", nextKind);
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
            <MenuItem value="normal">普通</MenuItem>
            <MenuItem value="difficult">難しい</MenuItem>
            <MenuItem value="very_difficult">とても難しい</MenuItem>
          </Select>
        </FormControl>
      )}
      {kind && (
        <FormControl>
          <InputLabel id="search-kind">形式</InputLabel>
          <Select
            labelId="search-kind"
            label="形式"
            value={selectedKind}
            onChange={handleKindSelect}
            sx={{ minWidth: "9rem" }}
          >
            <MenuItem value="">全て</MenuItem>
            <MenuItem value="code">コード記述</MenuItem>
            <MenuItem value="reorder">並べ替え</MenuItem>
          </Select>
        </FormControl>
      )}
    </Box>
  );
}
