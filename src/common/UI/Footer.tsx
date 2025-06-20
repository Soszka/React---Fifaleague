import React from "react";
import { Box, Container, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

const Footer: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Box
      component="footer"
      sx={{
        mt: "auto", // wypycha stopkę na dół flex‑kontenera App.tsx
        py: 2,
        bgcolor: "background.paper",
        borderTop: 1,
        borderColor: "divider",
      }}
    >
      <Container maxWidth="xl" sx={{ textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          {t("footer.copy", { year: new Date().getFullYear() })}
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
