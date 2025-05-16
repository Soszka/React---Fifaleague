import React from "react";
import { Box, Typography, useTheme, keyframes } from "@mui/material";
import { motion } from "framer-motion";

export interface TitleProps {
  title: string;
  subtitle: string;
}

const expand = keyframes`
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
`;

const shine = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const MotionBox = motion(Box);

const Title: React.FC<TitleProps> = ({ title, subtitle }) => {
  const theme = useTheme();
  const accent =
    theme.palette.mode === "dark"
      ? theme.palette.primary.light
      : theme.palette.primary.main;

  return (
    <Box sx={{ width: "100%", mb: { xs: 2, md: 3 } }}>
      <MotionBox
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
      >
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ fontWeight: 600, letterSpacing: 1, mb: 0.5 }}
        >
          {subtitle}
        </Typography>
      </MotionBox>

      <MotionBox
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
        sx={{ display: "flex", alignItems: "flex-end" }}
      >
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            lineHeight: 1.1,
            mr: 2,
            background: `linear-gradient(90deg, ${accent} 0%, ${theme.palette.secondary.main} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: -0.5,
          }}
        >
          {title}
        </Typography>

        <Box
          sx={{
            flexGrow: 1,
            height: 4,
            mb: 0.8,
            bgcolor: accent,
            borderRadius: 2,
            transformOrigin: "left",
            animation: `${expand} 1.2s cubic-bezier(0.25,1,0.5,1) forwards`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
              animation: `${shine} 2.4s infinite`,
            }}
          />
        </Box>
      </MotionBox>
    </Box>
  );
};

export default Title;
