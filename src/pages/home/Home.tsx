import React from "react";
import { useTranslation } from "react-i18next";
import { Box, Typography, useTheme, keyframes } from "@mui/material";
import { motion } from "framer-motion";
import HomeScoreboard from "./home-scoreboard/HomeScoreboard";
import HomeCard from "./home-card/HomeCard";
import HomeStats from "./home-stats/HomeStats";
import Title from "../../common/UI/Title";
import styles from "./home.module.scss";
import aboutImg from "../../assets/cardsPhoto4.png";
import matchesImg from "../../assets/cardsPhoto3.png";
import statsImg from "../../assets/cardsPhoto5.png";
import tableImg from "../../assets/cardsPhoto1.png";
import teamsImg from "../../assets/cardsPhoto2.png";
import rankingImg from "../../assets/auth_photo.jpg";

interface CardItem {
  header: string;
  content: string;
  image: string;
  link: string;
}

const cardsConfig = (t: ReturnType<typeof useTranslation>["t"]): CardItem[] => [
  {
    header: t("home.card.about.title"),
    content: t("home.card.about.description"),
    image: aboutImg,
    link: "/navigation/about",
  },
  {
    header: t("home.card.matches.title"),
    content: t("home.card.matches.description"),
    image: matchesImg,
    link: "/navigation/matches",
  },
  {
    header: t("home.card.table.title"),
    content: t("home.card.table.description"),
    image: tableImg,
    link: "/navigation/table",
  },
  {
    header: t("home.card.stats.title"),
    content: t("home.card.stats.description"),
    image: statsImg,
    link: "/navigation/stats",
  },
  {
    header: t("home.card.teams.title"),
    content: t("home.card.teams.description"),
    image: teamsImg,
    link: "/navigation/teams",
  },
  {
    header: t("home.card.ranking.title"),
    content: t("home.card.ranking.description"),
    image: rankingImg,
    link: "/navigation/ranking",
  },
];

const shine = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const MotionTypography = motion(Typography);

const Home: React.FC = () => {
  const { t } = useTranslation();
  const cards = React.useMemo(() => cardsConfig(t), [t]);
  const theme = useTheme();
  const animatedGradient = `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`;
  const userName = "Bartek";

  return (
    <Box className={styles.container} sx={{ width: "100%" }}>
      <HomeScoreboard />

      <Box sx={{ mt: 4, px: 3, maxWidth: 1800, mx: "auto" }}>
        <MotionTypography
          variant="h3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2.8, ease: [0.25, 1, 0.5, 1] }}
          sx={{
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: -0.5,
            overflow: "hidden",
            background: animatedGradient,
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: `${shine} 6s linear infinite`,
            textShadow:
              theme.palette.mode === "dark"
                ? "0 0 4px rgba(255,255,255,0.2)"
                : "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          {t("home.greeting", `Witaj ${userName}`)}
        </MotionTypography>

        <Typography variant="h6" sx={{ mt: 1 }}>
          {t(
            "home.greeting.desc",
            "Zapraszamy do kolejnej dawki pasjonujących meczów, statystyk i piłkarskich emocji, które już czekają na Twoje odkrycie!"
          )}
        </Typography>
      </Box>

      <HomeStats />

      <Box sx={{ mt: 6, mb: 1, px: 3, maxWidth: 1800, mx: "auto" }}>
        <Title subtitle={t("home.subtitle")} title={t("home.title")} />
      </Box>

      <div className={styles.cards}>
        {cards.map((card) => (
          <HomeCard
            key={card.link}
            header={card.header}
            content={card.content}
            image={card.image}
            link={card.link}
          />
        ))}
      </div>
    </Box>
  );
};

export default Home;
