import { ThemeProvider, CssBaseline, Box } from "@mui/material";
import { getTheme } from "./theme";
import { AppRoutes } from "./AppRoutes";
import { useState, useMemo } from "react";
import { BrowserRouter } from "react-router-dom";
import Footer from "./common/UI/Footer";

export default function App() {
  const [mode, setMode] = useState<"light" | "dark">("light");
  const toggleTheme = () =>
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        {/* GŁÓWNY flex‑kontener SPA */}
        <Box
          sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
        >
          {/* cały “środek” aplikacji */}
          <AppRoutes toggleTheme={toggleTheme} />
          {/* stopka przyklejona na dole */}
          <Footer />
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}
