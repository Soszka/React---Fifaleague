import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import styles from "./home-scoreboard.module.scss";
import { useLastMatches } from "../../../common/hooks/useLastMatches";

const HomeScoreboard: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const { matches } = useLastMatches(10); // ← ostatnie 10 meczów
  // generujemy tylko przy zmianie danych
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

  if (!renderedMatches.length) return null; // prosty „loader”

  return (
    <section className={styles.scoreboard}>
      <div className={styles.title}>{`${t("home.last.matches")}:`}</div>

      {/* 3 kopie – każda ≈ 33 % szerokości → brak „dziury” */}
      <div className={styles.marquee}>
        <div className={styles.track}>
          {renderedMatches}
          {renderedMatches}
          {renderedMatches}
        </div>
      </div>
    </section>
  );
});

export default HomeScoreboard;
