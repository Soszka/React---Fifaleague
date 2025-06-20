// src/App.tsx
import { ThemeProvider, CssBaseline, Box } from "@mui/material";
import { getTheme } from "./theme";
import { AppRoutes } from "./AppRoutes";
import { useState, useMemo, useEffect } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import Footer from "./common/UI/Footer";
import { AuthProvider, useAuth } from "./common/context/AuthContext";

export default function App() {
  const [mode, setMode] = useState<"light" | "dark">("light");
  const toggleTheme = () =>
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  const theme = useMemo(() => getTheme(mode), [mode]);

  const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const location = useLocation();
    useEffect(() => {
      window.scrollTo(0, 0);
    }, [location.pathname]);
    const isAuth = location.pathname.startsWith("/auth");
    return (
      <Box
        sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        {children}
        {user && !isAuth && <Footer />}
      </Box>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Layout>
            <AppRoutes toggleTheme={toggleTheme} />
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
