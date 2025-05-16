import React from "react";
import { Box, Typography, Paper, useTheme } from "@mui/material";
import SportsScoreIcon from "@mui/icons-material/SportsScore";
import EventNoteIcon from "@mui/icons-material/EventNote";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { motion } from "framer-motion";
import styles from "./home-stats.module.scss";

interface HighlightItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  gradient: string;
  ariaLabel?: string;
}

const MotionDiv = motion.div;

const HighlightItem: React.FC<HighlightItemProps> = ({
  icon,
  label,
  value,
  gradient,
  ariaLabel,
}) => {
  const theme = useTheme();
  const accent = `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`;

  return (
    <Paper
      className={styles.highlightCard}
      elevation={8}
      sx={{ background: gradient, borderRadius: "32px", overflow: "hidden" }}
      aria-label={ariaLabel || label}
    >
      <Box className={styles.textContainer}>
        <MotionDiv
          initial={{ opacity: 0, y: 24, scale: 0.8, rotate: -10 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 120,
            damping: 12,
            mass: 0.6,
          }}
          whileHover={{ scale: 1.06, rotate: 2 }}
        >
          <Typography
            variant="h3"
            component="p"
            className={styles.valueText}
            sx={{
              background: accent,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {value}
          </Typography>
        </MotionDiv>

        <Typography
          variant="subtitle1"
          component="p"
          className={styles.labelText}
        >
          {label}
        </Typography>
      </Box>
      <Box className={styles.iconContainer}>{icon}</Box>
    </Paper>
  );
};

const HomeStats: React.FC = () => {
  const theme = useTheme();

  const lightGradients = [
    "linear-gradient(135deg,#ffffff 0%,#e1e1e1 100%)",
    "linear-gradient(135deg,#f5f5f5 0%,#d7d7d7 100%)",
    "linear-gradient(135deg,#ededed 0%,#cfcfcf 100%)",
    "linear-gradient(135deg,#fafafa 0%,#d9d9d9 100%)",
  ];
  const darkGradients = [
    "linear-gradient(135deg,#5f5f5f 0%,#000000 100%)",
    "linear-gradient(135deg,#565656 0%,#000000 100%)",
    "linear-gradient(135deg,#717171 0%,#000000 100%)",
    "linear-gradient(135deg,#646464 0%,#000000 100%)",
  ];
  const gradients =
    theme.palette.mode === "dark" ? darkGradients : lightGradients;
  const iconColor = theme.palette.mode === "dark" ? "#ffffff" : "#000000";

  const highlightData: HighlightItemProps[] = [
    {
      icon: <SportsScoreIcon sx={{ fontSize: 96, color: iconColor }} />,
      label: "Wynik ostatniego rozegranego meczu",
      value: "3 : 1",
      gradient: gradients[0],
    },
    {
      icon: <EventNoteIcon sx={{ fontSize: 96, color: iconColor }} />,
      label: "Mecze rozegrane w tym tygodniu",
      value: "7",
      gradient: gradients[1],
    },
    {
      icon: <EmojiEventsIcon sx={{ fontSize: 96, color: iconColor }} />,
      label: "Procent wygranych spotkań",
      value: "72 %",
      gradient: gradients[2],
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 96, color: iconColor }} />,
      label: "Średnia zdobytych goli na mecz",
      value: "2,3",
      gradient: gradients[3],
    },
  ];

  return (
    <Box className={styles.highlightsContainer} sx={{ mt: 6 }}>
      {highlightData.map((item, idx) => (
        <HighlightItem key={idx} {...item} />
      ))}
    </Box>
  );
};

export default HomeStats;
