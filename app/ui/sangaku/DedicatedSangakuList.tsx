"use client";

import type { Sangaku } from "@/app/lib/definitions";
import { useEffect, useState } from "react";
import Ema from "@/app/ui/Ema";
import { Box, ButtonBase, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import Pagination from "@/app/ui/Pagination";
import Modal from "./Modal";
import { difficultyTranslation } from "../utility";
import { fetchUserSangakus } from "@/app/lib/data/sangaku";
import { SangakuListSkeleton } from "../skeletons";

interface Props {
  page: string;
  query: string;
}

const initialState = { sangakus: [], totalPage: 0 };

export default function SangakuList({ page, query }: Props) {
  const [sangakusData, setSangakusData] = useState<{
    sangakus: Sangaku[];
    totalPage: number;
    message?: string;
  }>(initialState);
  const [modalData, setModalData] = useState<Sangaku | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const data = await fetchUserSangakus(page, query, "any");
      setSangakusData(data);
      setIsLoading(false);
    })();
  }, [page, query]);

  const handleClick = (sangaku: Sangaku) => {
    setModalData(sangaku);
  };

  const handleClose = () => {
    setModalData(null);
  };

  if (isLoading) {
    return <SangakuListSkeleton />;
  }

  return (
    <Box>
      {sangakusData.message && (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Typography sx={{ color: "red", mt: 2 }}>
            {sangakusData.message}
          </Typography>
        </Box>
      )}
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
        {sangakusData.sangakus.map((sangaku) => (
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
        <Modal data={modalData} handleClose={handleClose} />
      </Grid>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Pagination totalPage={sangakusData.totalPage} />
      </Box>
    </Box>
  );
}
