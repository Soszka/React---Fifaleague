// src/App.tsx
import { ThemeProvider, CssBaseline, Box } from "@mui/material";
import { getTheme } from "./theme";
import { AppRoutes } from "./AppRoutes";
import { useState, useMemo } from "react";
import { BrowserRouter } from "react-router-dom";
import Footer from "./common/UI/Footer";
import { AuthProvider } from "./common/context/AuthContext";

export default function App() {
  const [mode, setMode] = useState<"light" | "dark">("light");
  const toggleTheme = () =>
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              minHeight: "100vh",
            }}
          >
            <AppRoutes toggleTheme={toggleTheme} />
            <Footer />
          </Box>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
