import React from "react";
import { Box, Container, Typography } from "@mui/material";

const Footer: React.FC = () => (
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
        © {new Date().getFullYear()} FIFA League · All rights reserved
      </Typography>
    </Container>
  </Box>
);

export default Footer;
