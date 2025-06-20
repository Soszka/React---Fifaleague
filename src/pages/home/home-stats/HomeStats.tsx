import React, { useEffect } from "react";
import { Box, Typography, Paper, Skeleton, useTheme } from "@mui/material";
import SportsScoreIcon from "@mui/icons-material/SportsScore";
import EventNoteIcon from "@mui/icons-material/EventNote";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { usePlayerStats } from "../../../common/hooks/usePlayerStats";
import { ResultOption } from "../../matches/types";
import styles from "./home-stats.module.scss";
import { useTranslation } from "react-i18next";

interface HighlightItemProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
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
  const textColor = theme.palette.mode === "dark" ? "#ffffff" : "#000000";
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
            component="div"
            className={styles.valueText}
            sx={{ color: textColor }}
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
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { stats, loading } = usePlayerStats(player, dbPath);

  useEffect(() => {
    if (!loading) onLoaded();
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

  const iconSizes = { xs: "2.8rem", sm: "4rem", md: "5rem", lg: "6rem" };
  const lastOutcome = (stats.lastOutcome || "DRAW") as ResultOption;

  const resultColor = (r: ResultOption) => {
    if (theme.palette.mode === "dark") {
      if (r === "WIN") return theme.palette.success.light;
      if (r === "LOSS") return theme.palette.error.light;
      return theme.palette.warning.light;
    }
    if (r === "WIN") return theme.palette.success.main;
    if (r === "LOSS") return theme.palette.error.main;
    return theme.palette.warning.main;
  };

  const letterMap: Record<"pl" | "en", Record<ResultOption, string>> = {
    pl: { WIN: "Z", DRAW: "R", LOSS: "P" },
    en: { WIN: "W", DRAW: "D", LOSS: "L" },
  };
  const currentLang = i18n.language.startsWith("pl") ? "pl" : "en";
  const lastLetter = letterMap[currentLang][lastOutcome];
  const lastBg = resultColor(lastOutcome);
  const lastFg = theme.palette.getContrastText(lastBg);

  const lastResultValue = (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Box component="span">{stats.lastResult.replace(/\s*:\s*/, ":")}</Box>
      <Box
        component="span"
        sx={{
          px: "0.30em",
          py: "0.05em",
          borderRadius: "0.25em",
          backgroundColor: lastBg,
          color: lastFg,
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
          fontSize: "calc(1em - 10px)",
        }}
      >
        {lastLetter}
      </Box>
    </Box>
  );

  const highlightData: HighlightItemProps[] = [
    {
      icon: <SportsScoreIcon sx={{ fontSize: iconSizes, color: iconColor }} />,
      label: t("homeStats.lastResult"),
      value: lastResultValue,
      gradient: gradients[0],
      onClick: () => navigate("/app/matches"),
    },
    {
      icon: <EventNoteIcon sx={{ fontSize: iconSizes, color: iconColor }} />,
      label: t("homeStats.weekMatches"),
      value: <>{stats.weekMatches}</>,
      gradient: gradients[1],
      onClick: () => navigate("/app/matches"),
    },
    {
      icon: <EmojiEventsIcon sx={{ fontSize: iconSizes, color: iconColor }} />,
      label: t("homeStats.winPercent"),
      value: <>{`${stats.winPercent}%`}</>,
      gradient: gradients[2],
      onClick: () => navigate("/app/stats"),
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: iconSizes, color: iconColor }} />,
      label: t("homeStats.avgGoals"),
      value: <>{stats.avgGoals.toString().replace(".", ",")}</>,
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
