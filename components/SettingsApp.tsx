/// <reference types="../preload/index" />
import React from "react";

import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import CssBaseline from "@mui/material/CssBaseline";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import SettingsIcon from "@mui/icons-material/Settings";
import PaletteIcon from "@mui/icons-material/Palette";
import InfoIcon from "@mui/icons-material/Info";
import { Apperance } from "./Settings/Apperance";

const drawerWidth = 200;

type Pages = "General" | "Apperance" | "About";

export const SettingsApp: React.FC<{}> = ({}) => {
  const [selectedPage, setSelectedPage] = React.useState<Pages>("General");

  const selectGeneral = React.useCallback(() => {
    setSelectedPage("General");
  }, [setSelectedPage]);

  const selectApperance = React.useCallback(() => {
    setSelectedPage("Apperance");
  }, [setSelectedPage]);

  const selectAbout = React.useCallback(() => {
    setSelectedPage("About");
  }, [setSelectedPage]);

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px` }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            {selectedPage}
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Toolbar>
          <Box
            sx={{
              margin: "24px 0 10px",
              display: "flex",
              flexDirection: "column",
              width: "100%",
              alignItems: "center",
            }}
          >
            <img src="../assets/logo/128x128.png" alt="logo" width={50} height={50} />
            <Typography variant="h6" noWrap component="div">
              wAIter
            </Typography>
          </Box>
        </Toolbar>
        <Divider />
        <List>
          <ListItem key={"General"} disablePadding>
            <ListItemButton selected={selectedPage === "General"} onClick={selectGeneral}>
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary={"General"} />
            </ListItemButton>
          </ListItem>
          <ListItem key={"Apperance"} disablePadding>
            <ListItemButton selected={selectedPage === "Apperance"} onClick={selectApperance}>
              <ListItemIcon>
                <PaletteIcon />
              </ListItemIcon>
              <ListItemText primary={"Apperance"} />
            </ListItemButton>
          </ListItem>
        </List>
        <Divider />
        <List>
          <ListItem key={"About"} disablePadding>
            <ListItemButton selected={selectedPage === "About"} onClick={selectAbout}>
              <ListItemIcon>
                <InfoIcon />
              </ListItemIcon>
              <ListItemText primary={"About"} />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}>
        <Toolbar /> {/* To prevent the content from going under the AppBar */}
        {/* General */}
        {selectedPage === "General" && <Typography paragraph>General settings</Typography>}
        {/* Apperance */}
        {selectedPage === "Apperance" && <Apperance />}
        {/* About */}
        {selectedPage === "About" && (
          <>
            <Typography paragraph>About settings</Typography>
          </>
        )}
      </Box>
    </Box>
  );
};
