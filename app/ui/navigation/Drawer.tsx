import React from "react";
import { useSession } from "next-auth/react";
import {
  Box,
  Drawer,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Link,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { signOut } from "next-auth/react";

const drawerContent = [
  { text: "神社を探す", href: "#" },
  { text: "算額を作る", href: "#" },
  { text: "算額を解く", href: "#" },
  { text: "自分の算額を見る", href: "#" },
];

interface Props {
  drawerWidth: number;
  mobileOpen: boolean;
  handleDrawerTransitionEnd: () => void;
  handleDrawerClose: () => void;
}

export default function ResponsiveDrawer({
  drawerWidth,
  mobileOpen,
  handleDrawerTransitionEnd,
  handleDrawerClose,
}: Props) {
  const { data: session } = useSession();

  const beforeSignIn = (
    <Grid
      container
      direction="column"
      sx={{
        justifyContent: "flex-start",
        alignItems: "flex-start",
        height: "100vh",
      }}
    >
      <div>
        <Toolbar>
          <Link
            href="/"
            color="inherit"
            variant="h4"
            sx={{
              display: "block",
              fontFamily: "Noto Serif JP Variable",
              textDecoration: "none",
            }}
          >
            アルゴ算額
          </Link>
        </Toolbar>
        <List>
          <ListItem disablePadding>
            <ListItemButton href="#" sx={{ pl: "1.5rem" }}>
              <ListItemText slotProps={{ primary: { fontSize: "1.3rem" } }}>
                神社を探す
              </ListItemText>
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton href="/sign-in" sx={{ pl: "1.5rem" }}>
              <ListItemText slotProps={{ primary: { fontSize: "1.3rem" } }}>
                サインイン
              </ListItemText>
            </ListItemButton>
          </ListItem>
        </List>
      </div>
      <div style={{ marginTop: "auto" }}>
        <List>
          <ListItem disablePadding>
            <ListItemButton href="#" sx={{ pl: "1.5rem" }}>
              <ListItemText primary="利用規約" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton href="#" sx={{ pl: "1.5rem" }}>
              <ListItemText primary="プライバシーポリシー" />
            </ListItemButton>
          </ListItem>
        </List>
      </div>
    </Grid>
  );

  const afterSignin = (
    <Grid
      container
      direction="column"
      sx={{
        justifyContent: "flex-start",
        alignItems: "flex-start",
        height: "100vh",
      }}
    >
      <div>
        <Toolbar>
          <Link
            href="/"
            color="inherit"
            variant="h4"
            sx={{
              display: "block",
              fontFamily: "Noto Serif JP Variable",
              textDecoration: "none",
            }}
          >
            アルゴ算額
          </Link>
        </Toolbar>
        <List>
          {drawerContent.map(({ text, href }) => (
            <ListItem key={text} disablePadding>
              <ListItemButton href={href} sx={{ pl: "1.5rem" }}>
                <ListItemText
                  primary={text}
                  slotProps={{ primary: { fontSize: "1.3rem" } }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </div>
      <div style={{ marginTop: "auto" }}>
        <List>
          <ListItem disablePadding>
            <ListItemButton href="#" sx={{ pl: "1.5rem" }}>
              <ListItemText primary="利用規約" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton href="#" sx={{ pl: "1.5rem" }}>
              <ListItemText primary="プライバシーポリシー" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                signOut();
              }}
              sx={{ pl: "1.5rem" }}
            >
              <ListItemText primary="ログアウト" />
            </ListItemButton>
          </ListItem>
        </List>
      </div>
    </Grid>
  );

  const drawerInnerElement = session ? afterSignin : beforeSignIn;

  return (
    <>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onTransitionEnd={handleDrawerTransitionEnd}
          onClose={handleDrawerClose}
          ModalProps={{
            keepMounted: true,
          }}
          data-testid="mobileDrawer"
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              bgcolor: "#F4CE93",
            },
          }}
        >
          {drawerInnerElement}
        </Drawer>
        <Drawer
          variant="permanent"
          data-testid="desktopDrawer"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              bgcolor: "#F4CE93",
            },
          }}
          open
        >
          {drawerInnerElement}
        </Drawer>
      </Box>
    </>
  );
}
