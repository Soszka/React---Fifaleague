import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@mui/material";
import styles from "./home-card.module.scss";

export interface HomeCardProps {
  header: string;
  content: string;
  image: string;
  link: string;
  ready: boolean;
  onLoaded: () => void;
}

const HomeCard: React.FC<HomeCardProps> = ({
  header,
  content,
  image,
  link,
  ready,
  onLoaded,
}) => {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) {
      onLoaded();
    }
  }, [loaded, onLoaded]);

  const showContent = loaded && ready;

  return (
    <div className={styles.cardWrap} onClick={() => navigate(link)}>
      {!showContent && (
        <Skeleton
          variant="rectangular"
          animation="wave"
          className={styles.cardSkeleton}
          sx={{ width: "100%", height: "100%" }}
        />
      )}

      <div
        className={styles.card}
        style={{ visibility: showContent ? "visible" : "hidden" }}
      >
        <div
          className={styles.cardBg}
          style={{ backgroundImage: `url(${image})` }}
        />
        <div className={styles.cardInfo}>
          <h2 className={styles.header}>{header}</h2>
          <p>{content}</p>
        </div>
      </div>

      <img
        src={image}
        alt=""
        className={styles.imgPreload}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
};

export default HomeCard;
