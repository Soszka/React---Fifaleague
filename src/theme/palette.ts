import { PaletteOptions } from "@mui/material/styles";

export const neutralLight: PaletteOptions = {
  mode: "light",
  primary: { main: "#000000", contrastText: "#ffffff" },
  secondary: { main: "#9e9e9e" },
  background: { default: "#ffffff", paper: "#fafafa" },
  text: { primary: "#000000", secondary: "#4f4f4f" },
};

export const neutralDark: PaletteOptions = {
  mode: "dark",
  primary: { main: "#ffffff", contrastText: "#000000" },
  secondary: { main: "#9e9e9e" },
  background: { default: "#121212", paper: "#1e1e1e" },
  text: { primary: "#ffffff", secondary: "#bdbdbd" },
};
