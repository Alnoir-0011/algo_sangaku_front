"use client";

import { useState, MouseEvent } from "react";
import type { Sangaku } from "@/app/lib/definitions";
import { deleteSangaku } from "@/app/lib/actions/sangaku";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import NextLink from "next/link";

interface Props {
  sangaku: Sangaku;
}

export default function MenuButton({ sangaku }: Props) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget.parentElement);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const deleteSangakuWithId = () => {
    if (window.confirm("本当に削除しますか?")) {
      deleteSangaku(sangaku.id);
    }
  };

  return (
    <Box sx={{ position: "relative", pl: 3 }}>
      <IconButton
        id={`menu-button-${sangaku.id}`}
        aria-controls={open ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: {
            "aria-labelledby": `menu-button-${sangaku.id}`,
          },
          paper: {
            sx: { position: "absolute" },
          },
        }}
      >
        <MenuItem
          component={NextLink}
          href={`/user/sangakus/${sangaku.id}/edit`}
        >
          編集
        </MenuItem>
        <MenuItem component="button" onClick={deleteSangakuWithId}>
          削除
        </MenuItem>

        {/* NOTE: 下記の実装ではメニューを閉じた際にactionが実行されてしまうため、onClickを利用 */}

        {/* <MenuItem component={"form"} action={deleteSangakuWithId} sx={{ p: 0 }}> */}
        {/*   <ListItemButton>削除</ListItemButton> */}
        {/* </MenuItem> */}
      </Menu>
    </Box>
  );
}
