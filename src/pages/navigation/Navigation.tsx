// src/pages/navigation/Navigation.tsx
import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Box,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import InfoIcon from "@mui/icons-material/Info";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import BarChartIcon from "@mui/icons-material/BarChart";
import TableChartIcon from "@mui/icons-material/TableChart";
import GroupIcon from "@mui/icons-material/Group";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import NavigationActions from "./navigation-actions/NavigationActions";
import { useTranslation } from "react-i18next";
import LogoDefault from "../../assets/Logo.png";
import LogoLight from "../../assets/LogoDark.png";

const navItems = [
  { key: "nav.menu.home", icon: <HomeIcon />, path: "home" },
  { key: "nav.menu.about", icon: <InfoIcon />, path: "about" },
  { key: "nav.menu.matches", icon: <SportsSoccerIcon />, path: "matches" },
  { key: "nav.menu.stats", icon: <BarChartIcon />, path: "stats" },
  { key: "nav.menu.table", icon: <TableChartIcon />, path: "table" },
  { key: "nav.menu.teams", icon: <GroupIcon />, path: "teams" },
  { key: "nav.menu.ranking", icon: <EmojiEventsIcon />, path: "ranking" },
];

interface Props {
  toggleTheme: () => void;
}

export default function Navigation({ toggleTheme }: Props) {
  const { t } = useTranslation();
  const location = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const drawerWidth = 240;

  const [drawerOpen, setDrawerOpen] = useState(isDesktop);
  const toggleDrawer = () => setDrawerOpen((o) => !o);

  const isActive = (path: string) =>
    location.pathname === `/app/${path}` ||
    location.pathname === `/app/${path}/`;

  const drawer = (
    <Box sx={{ width: drawerWidth }}>
      <Typography variant="h6" sx={{ my: 2, textAlign: "center" }}>
        FIFA League
      </Typography>

      <List sx={{ pt: 0 }}>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={NavLink}
              to={`/app/${item.path}`}
              onClick={() => !isDesktop && setDrawerOpen(false)}
              selected={isActive(item.path)}
              sx={{
                "&.Mui-selected": {
                  bgcolor: "action.selected",
                  borderLeft: 4,
                  borderColor: "primary.main",
                  "& .MuiListItemIcon-root": { color: "primary.main" },
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText
                primary={t(item.key, item.key)}
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const logoSrc = theme.palette.mode === "dark" ? LogoDefault : LogoLight;

  return (
    <Box sx={{ display: "flex", overflowX: "hidden" }}>
      {/* ---------- GÓRNY PASEK ---------- */}
      <AppBar
        position="fixed"
        color="default"
        enableColorOnDark
        elevation={0}
        sx={{
          zIndex: (th) => th.zIndex.drawer + 1,
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Box
            component="img"
            src={logoSrc}
            alt="Logo"
            sx={{ height: 42, mr: 2, display: { xs: "none", sm: "block" } }}
          />

          {/* nazwa + podtytuł */}
          <Typography
            sx={{
              flexGrow: 1,
              display: "flex",
              gap: 1,
              alignItems: "baseline",
            }}
          >
            <Box
              component="span"
              sx={{
                fontWeight: 700,
                fontSize: "1.6rem",
                mr: 2,
                "@media (max-width:500px)": { display: "none" },
              }}
            >
              FIFA League
            </Box>
            <Box
              component="span"
              sx={{
                fontWeight: 500,
                fontStyle: "italic",
                fontSize: "1.4rem",
                "@media (max-width:800px)": { display: "none" },
              }}
            >
              {t(navItems.find((i) => isActive(i.path))?.key ?? "", "")}
            </Box>
          </Typography>

          <NavigationActions toggleTheme={toggleTheme} />
        </Toolbar>
      </AppBar>

      {/* ---------- SZUFLADA ---------- */}
      <Box
        component="nav"
        sx={{
          width: { md: drawerOpen ? drawerWidth : 0 },
          flexShrink: { md: 0 },
          transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: drawerOpen
              ? theme.transitions.duration.enteringScreen
              : theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {/* mobile */}
        <Drawer
          variant="temporary"
          open={drawerOpen && !isDesktop}
          onClose={toggleDrawer}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* desktop */}
        <Drawer
          variant="persistent"
          open={drawerOpen && isDesktop}
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* ---------- GŁÓWNA ZAWARTOŚĆ ---------- */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0, // ② POZWÓL flex-childowi się kurczyć
          pt: { xs: 7, sm: 8 },
          px: 0,
          pb: 3,
          transition: (th) =>
            th.transitions.create(["margin", "width"], {
              easing: th.transitions.easing.sharp,
              duration: th.transitions.duration.shortest,
            }),
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
