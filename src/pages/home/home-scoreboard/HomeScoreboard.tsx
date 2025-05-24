import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import styles from "./home-scoreboard.module.scss";
import { useLastMatches } from "../../../common/hooks/useLastMatches";
import { Skeleton } from "@mui/material";

interface HomeScoreboardProps {
  ready: boolean;
  onLoaded: () => void;
}

const HomeScoreboard: React.FC<HomeScoreboardProps> = ({ ready, onLoaded }) => {
  const { t } = useTranslation();
  const { matches, loading } = useLastMatches(10);

  useEffect(() => {
    if (!loading) {
      onLoaded();
    }
  }, [loading, onLoaded]);

  const renderedMatches = useMemo(
    () =>
      matches.map((m, idx) => (
        <span key={idx} className={styles.matchItem}>
          {m.team1}
          <span className={styles.result}>{m.score}</span>
          {m.team2}
        </span>
      )),
    [matches]
  );

  if (loading || !ready) {
    return (
      <Skeleton
        variant="rectangular"
        width="100%"
        height="2.75rem"
        animation="wave"
      />
    );
  }

  if (!renderedMatches.length) return null;

  return (
    <section className={styles.scoreboard}>
      <div className={styles.title}>{`${t("home.last.matches")}:`}</div>
      <div className={styles.marquee}>
        <div className={styles.track}>
          {renderedMatches}
          {renderedMatches}
          {renderedMatches}
        </div>
      </div>
    </section>
  );
};

export default React.memo(HomeScoreboard);
