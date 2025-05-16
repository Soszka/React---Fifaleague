import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./home-card.module.scss";

export interface HomeCardProps {
  header: string;
  content: string;
  image: string;
  link: string;
}

const HomeCard: React.FC<HomeCardProps> = ({
  header,
  content,
  image,
  link,
}) => {
  const navigate = useNavigate();

  return (
    <div className={styles.cardWrap} onClick={() => navigate(link)}>
      <div className={styles.card}>
        <div
          className={styles.cardBg}
          style={{ backgroundImage: `url(${image})` }}
        />
        <div className={styles.cardInfo}>
          <h2 className={styles.header}>{header}</h2>
          <p>{content}</p>
        </div>
      </div>
    </div>
  );
};

export default HomeCard;
