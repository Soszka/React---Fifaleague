import { createTheme } from "@mui/material/styles";
import { neutralLight, neutralDark } from "./palette";
import { componentOverrides } from "./overrides";

export const getTheme = (mode: "light" | "dark" = "light") =>
  createTheme({
    palette: mode === "light" ? neutralLight : neutralDark,
    components: componentOverrides,
  });
