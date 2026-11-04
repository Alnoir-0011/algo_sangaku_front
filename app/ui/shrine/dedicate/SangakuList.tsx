"use client";

import type { Shrine, UserSangakusResult } from "@/app/lib/definitions";
import { use } from "react";
import Ema from "@/app/ui/Ema";
import { Box, ButtonBase, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import Pagination from "@/app/ui/Pagination";
import ConfirmModal from "./ConfirmModal";
import { difficultyTranslation } from "../../utility";
import { fetchReorderDetail } from "@/app/lib/sangaku-detail";
import { useSelectedSangaku } from "@/app/ui/sangaku/useSelectedSangaku";

interface Props {
  sangakusPromise: Promise<UserSangakusResult>;
  shrine: Shrine;
}

export default function SangakuList({ sangakusPromise, shrine }: Props) {
  const { sangakus, totalPage, message } = use(sangakusPromise);
  const { selected, select, retry, close } = useSelectedSangaku((sangaku) =>
    sangaku.attributes.kind === "reorder"
      ? fetchReorderDetail(sangaku.id)
      : null,
  );

  return (
    <>
      {message && (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Typography sx={{ color: "red", mt: 2 }}>{message}</Typography>
        </Box>
      )}
      <Grid container spacing={2} sx={{ justifyContent: "center", mb: 2 }}>
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
                select(sangaku);
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
          reorderDetail={selected?.detail ?? null}
          onRetryReorder={retry}
          handleClose={close}
          shrine={shrine}
        />
      </Grid>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Pagination totalPage={totalPage} />
      </Box>
    </>
  );
}
