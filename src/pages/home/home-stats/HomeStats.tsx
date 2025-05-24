import React, { useEffect } from "react";
import { Box, Typography, Paper, Skeleton, useTheme } from "@mui/material";
import SportsScoreIcon from "@mui/icons-material/SportsScore";
import EventNoteIcon from "@mui/icons-material/EventNote";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { usePlayerStats } from "../../../common/hooks/usePlayerStats";
import styles from "./home-stats.module.scss";
import { useTranslation } from "react-i18next";

interface HighlightItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  gradient: string;
  ariaLabel?: string;
  onClick?: () => void;
}

const MotionDiv = motion.div;

const HighlightItem: React.FC<HighlightItemProps> = ({
  icon,
  label,
  value,
  gradient,
  ariaLabel,
  onClick,
}) => {
  const theme = useTheme();
  const accent = `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`;

  return (
    <Paper
      className={styles.highlightCard}
      elevation={8}
      sx={{
        background: gradient,
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.2s",
        "&:hover": { transform: onClick ? "scale(1.03)" : "none" },
      }}
      aria-label={ariaLabel || label}
      onClick={onClick}
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

const SkeletonHighlightItem: React.FC = () => (
  <Paper className={styles.highlightCard} elevation={8}>
    <Skeleton
      animation="wave"
      variant="rectangular"
      width="100%"
      height="100%"
      sx={{ borderRadius: "2rem" }}
    />
  </Paper>
);

interface HomeStatsProps {
  player: string;
  dbPath?: string;
  ready: boolean;
  onLoaded: () => void;
}

const HomeStats: React.FC<HomeStatsProps> = ({
  player,
  dbPath,
  ready,
  onLoaded,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { stats, loading } = usePlayerStats(player, dbPath);

  useEffect(() => {
    if (!loading) {
      onLoaded();
    }
  }, [loading, onLoaded]);

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

  if (loading || !stats || !ready) {
    return (
      <Box className={styles.highlightsContainer} sx={{ mt: 6 }}>
        {Array.from({ length: 4 }).map((_, idx) => (
          <SkeletonHighlightItem key={idx} />
        ))}
      </Box>
    );
  }

  const highlightData: HighlightItemProps[] = [
    {
      icon: (
        <SportsScoreIcon
          sx={{
            fontSize: { xs: "3.5rem", sm: "5rem", md: "6rem" },
            color: iconColor,
          }}
        />
      ),
      label: t("homeStats.lastResult"),
      value: stats.lastResult,
      gradient: gradients[0],
      onClick: () => navigate("/app/matches"),
    },
    {
      icon: (
        <EventNoteIcon
          sx={{
            fontSize: { xs: "3.5rem", sm: "5rem", md: "6rem" },
            color: iconColor,
          }}
        />
      ),
      label: t("homeStats.weekMatches"),
      value: stats.weekMatches.toString(),
      gradient: gradients[1],
      onClick: () => navigate("/app/matches"),
    },
    {
      icon: (
        <EmojiEventsIcon
          sx={{
            fontSize: { xs: "3.5rem", sm: "5rem", md: "6rem" },
            color: iconColor,
          }}
        />
      ),
      label: t("homeStats.winPercent"),
      value: `${stats.winPercent}%`,
      gradient: gradients[2],
      onClick: () => navigate("/app/stats"),
    },
    {
      icon: (
        <TrendingUpIcon
          sx={{
            fontSize: { xs: "3.5rem", sm: "5rem", md: "6rem" },
            color: iconColor,
          }}
        />
      ),
      label: t("homeStats.avgGoals"),
      value: stats.avgGoals.toString().replace(".", ","),
      gradient: gradients[3],
      onClick: () => navigate("/app/stats"),
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
