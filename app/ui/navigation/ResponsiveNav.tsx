'use client'

import { useState } from "react";
import { CssBaseline } from "@mui/material";
import Header from '@/app/ui/navigation/Header';
import Drawer from '@/app/ui/navigation/Drawer';

interface Props {
  drawerWidth: number;
}

export default function ResponsiveNav({ drawerWidth }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (!isClosing) {
      setMobileOpen(!mobileOpen);
    }
  };

  return (
    <>
      <CssBaseline />
      <Header
        drawerWidth={drawerWidth}
        handleDrawerToggle={handleDrawerToggle}
      />
      <Drawer
        drawerWidth={drawerWidth}
        mobileOpen={mobileOpen}
        handleDrawerTransitionEnd={handleDrawerTransitionEnd}
        handleDrawerClose={handleDrawerClose}
      />
    </>
  );
}
