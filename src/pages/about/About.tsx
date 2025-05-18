// src/pages/About/About.tsx
import React from "react";
import {
  Box,
  Typography,
  useTheme,
  styled,
  Accordion as MuiAccordion,
  AccordionSummary as MuiAccordionSummary,
  AccordionDetails as MuiAccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTranslation } from "react-i18next";
import Title from "../../common/UI/Title";

const Accordion = styled(MuiAccordion)(({ theme }) => ({
  marginBottom: theme.spacing(2.5),
  borderRadius: theme.spacing(1.5),
  overflow: "hidden",
  position: "relative",
  boxShadow: theme.shadows[4],
  background:
    theme.palette.mode === "light"
      ? "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(245,245,245,0.85) 100%)"
      : "linear-gradient(135deg, rgba(38,38,38,0.85) 0%, rgba(33,33,33,0.85) 100%)",
  backdropFilter: "blur(6px)",
  transition: "transform .35s ease, box-shadow .35s ease",
  "&:hover": {
    transform: "translateY(-3px) scale(1.015)",
    boxShadow: theme.shadows[8],
  },
  "&:before": { display: "none" }, // usuwa standardową linię MUI
}));

const AccordionSummary = styled((props: any) => (
  <MuiAccordionSummary
    expandIcon={<ExpandMoreIcon sx={{ fontSize: "1.8rem" }} />}
    {...props}
  />
))(({ theme }) => ({
  padding: theme.spacing(0, 2),
  minHeight: 68,
  "& .MuiAccordionSummary-content": {
    alignItems: "center",
    margin: 0,
  },
  "& .MuiAccordionSummary-expandIconWrapper": {
    transition: "transform .35s ease",
  },
  "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
    transform: "rotate(180deg)",
  },
  "& .MuiTypography-root": {
    fontWeight: 600,
    fontSize: "clamp(1rem, 1.2vw + .6rem, 1.25rem)",
  },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  backgroundColor:
    theme.palette.mode === "light"
      ? "rgba(0,0,0,0.03)"
      : "rgba(255,255,255,0.04)",
  "& .MuiTypography-root": {
    fontSize: "0.95rem",
    lineHeight: 1.6,
    color: theme.palette.text.secondary,
  },
}));

const About: React.FC = () => {
  const { t } = useTranslation();
  const faqItems = t("about.faq.questions", {
    returnObjects: true,
  }) as { question: string; answer: string }[];

  return (
    <Box
      sx={{
        mx: "auto",
        maxWidth: 1800,
        px: { xs: 2, sm: 4 },
        mt: 4,
      }}
    >
      <Title title={t("about.title")} subtitle={t("about.subtitle")} />

      {faqItems.map((qa, index) => (
        <Accordion key={index} disableGutters>
          <AccordionSummary>
            <Typography>{qa.question}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>{qa.answer}</Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default About;
