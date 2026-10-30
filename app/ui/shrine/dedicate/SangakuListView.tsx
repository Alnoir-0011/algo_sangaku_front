"use client";

import type { Sangaku, Shrine } from "@/app/lib/definitions";
import { useState } from "react";
import Ema from "@/app/ui/Ema";
import { Box, ButtonBase, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import Pagination from "@/app/ui/Pagination";
import ConfirmModal from "./ConfirmModal";
import { fetchUserSangaku } from "@/app/lib/data/sangaku";
import { difficultyTranslation } from "../../utility";

interface Props {
  sangakus: Sangaku[];
  totalPage: number;
  shrine: Shrine;
}

type ReorderDetail = Promise<Sangaku | null | undefined>;

// use() は reject を ErrorBoundary に伝播し、ページ全体がエラー画面になる。
// 取得失敗はモーダル内の再試行 UI で扱いたいので null として扱う。
const fetchReorderDetail = (id: string): ReorderDetail =>
  fetchUserSangaku(id).catch(() => null);

export default function SangakuListView({
  sangakus,
  totalPage,
  shrine,
}: Props) {
  const [selected, setSelected] = useState<{
    sangaku: Sangaku;
    reorderDetail: ReorderDetail | null;
  } | null>(null);

  // Promise は render 中ではなくクリックで生成する。Suspense 内の子で生成すると、
  // 初回 mount で suspend した際に state が破棄され、毎回作り直されてしまう。
  const handleClick = (sangaku: Sangaku) => {
    setSelected({
      sangaku,
      reorderDetail:
        sangaku.attributes.kind === "reorder"
          ? fetchReorderDetail(sangaku.id)
          : null,
    });
  };

  const handleRetryReorder = () => {
    if (selected) {
      setSelected({
        ...selected,
        reorderDetail: fetchReorderDetail(selected.sangaku.id),
      });
    }
  };

  const handleClose = () => {
    setSelected(null);
  };

  return (
    <>
      <Grid
        container
        direction="row"
        spacing={3}
        sx={{
          justifyContent: "center",
          alignItems: "flex-start",
          mt: 3,
          mb: 2,
        }}
      >
        {sangakus.map((sangaku) => (
          <div
            key={sangaku.id}
            style={{
              filter: "drop-shadow(3px 3px 2px #aaa)",
            }}
          >
            <ButtonBase
              key={sangaku.id}
              onClick={() => {
                handleClick(sangaku);
              }}
              sx={{
                clipPath:
                  "polygon(0% 25%, 0% 100%, 100% 100%, 100% 25%, 50% 0%)",
                boxShadow: 3,
              }}
            >
              <Ema width={18}>
                <Box
                  sx={{
                    display: "flex",
                    height: "100%",
                    flexDirection: "column",
                    justifyContent: "start",
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      mb: 1,
                      textAlign: "center",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: "vertical",
                      textOverflow: "ellipsis",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {sangaku.attributes.title}
                  </Typography>
                  <Typography
                    variant="inherit"
                    sx={{
                      mb: 1,
                      textAlign: "center",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      textOverflow: "ellipsis",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {sangaku.attributes.description}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "end",
                      marginTop: "auto",
                    }}
                  >
                    <Typography
                      component="p"
                      sx={{
                        px: 1,
                        py: 0.5,
                        border: 1,
                        borderRadius: 2,
                        textAlign: "right",
                      }}
                    >
                      {difficultyTranslation(sangaku.attributes.difficulty)}
                    </Typography>
                  </Box>
                </Box>
              </Ema>
            </ButtonBase>
          </div>
        ))}
        <ConfirmModal
          data={selected?.sangaku ?? null}
          reorderDetail={selected?.reorderDetail}
          onRetryReorder={handleRetryReorder}
          handleClose={handleClose}
          shrine={shrine}
        />
      </Grid>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Pagination totalPage={totalPage} />
      </Box>
    </>
  );
}
