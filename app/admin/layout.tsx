"use client";

import {
  AppBar,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";

const adminDrawerWidth = 200;

const navItems = [
  { label: "ダッシュボード", href: "/admin" },
  { label: "ユーザー管理", href: "/admin/users" },
  { label: "算額管理", href: "/admin/sangakus" },
  { label: "神社管理", href: "/admin/shrines" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: "grey.800" }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            管理画面
          </Typography>
          <Link href="/" style={{ color: "white", textDecoration: "none" }}>
            メインサイトへ
          </Link>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: adminDrawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: adminDrawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        <Toolbar />
        <List>
          {navItems.map(({ label, href }) => (
            <ListItem key={href} disablePadding>
              <ListItemButton
                component={Link}
                href={href}
                selected={pathname === href}
              >
                <ListItemText primary={label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        {children}
      </Box>
    </Box>
  );
}
