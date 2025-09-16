import React, { useMemo } from "react";
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Cancel";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import Title from "../../common/UI/Title";
import { useMatchActivity } from "../../common/context/MatchActivityContext";
import { MatchActivityLog } from "../../common/types/matchActivity";

const formatScore = (score: string) =>
  score.includes(":") ? score : score.replace(/-/g, " : ");

const NewsPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { activities, loading, error } = useMatchActivity();

  const visuals = useMemo(
    () => ({
      create: {
        icon: AddCircleIcon,
        color: theme.palette.success.main,
        background: alpha(theme.palette.success.main, 0.12),
      },
      update: {
        icon: EditIcon,
        color: theme.palette.warning.main,
        background: alpha(theme.palette.warning.main, 0.16),
      },
      delete: {
        icon: CancelIcon,
        color: theme.palette.error.main,
        background: alpha(theme.palette.error.main, 0.16),
      },
    }),
    [theme]
  );

  const renderSkeletons = () => (
    <Stack spacing={2}>
      {Array.from({ length: 3 }).map((_, idx) => (
        <Card
          key={idx}
          variant="outlined"
          sx={{ borderRadius: 3, borderColor: "divider" }}
        >
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Skeleton variant="circular" width={48} height={48} />
              <Stack spacing={1} flex={1}>
                <Skeleton variant="text" width="35%" height={16} />
                <Skeleton variant="text" width="60%" height={22} />
                <Skeleton variant="text" width="90%" height={16} />
                <Skeleton
                  variant="rectangular"
                  height={72}
                  sx={{ borderRadius: 2 }}
                />
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );

  const renderActivityCard = (activity: MatchActivityLog) => {
    const config = visuals[activity.type];
    const Icon = config.icon;
    const actorName =
      activity.actor.displayName === "Unknown"
        ? t("news.unknownUser")
        : activity.actor.displayName;

    const eventDate = dayjs(activity.timestamp).format("DD.MM.YYYY HH:mm");
    const matchDate = dayjs(activity.matchSnapshot.date).format("DD.MM.YYYY");

    const teamA = `${activity.matchSnapshot.player1} & ${activity.matchSnapshot.player2}`;
    const teamB = `${activity.matchSnapshot.rival1} & ${activity.matchSnapshot.rival2}`;
    const score = formatScore(activity.matchSnapshot.result);

    return (
      <Card
        key={activity.id}
        variant="outlined"
        sx={{
          borderRadius: 3,
          borderColor: "divider",
          bgcolor:
            theme.palette.mode === "dark"
              ? alpha(theme.palette.background.paper, 0.9)
              : theme.palette.background.paper,
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Avatar
              sx={{
                bgcolor: config.background,
                color: config.color,
                width: 48,
                height: 48,
              }}
            >
              <Icon fontSize="medium" />
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {t("news.eventTime", { date: eventDate })}
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 700 }}>
                {t(`news.actions.${activity.type}`, { user: actorName })}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {t("news.matchSummary", { teamA, teamB, score })}
              </Typography>

              <Box
                sx={{
                  mt: 2,
                  p: { xs: 2, md: 2.5 },
                  borderRadius: 2,
                  border: 1,
                  borderColor: "divider",
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? alpha(theme.palette.primary.main, 0.08)
                      : alpha(theme.palette.primary.main, 0.04),
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: { xs: "flex-start", sm: "center" },
                    justifyContent: "space-between",
                    gap: { xs: 1, sm: 2 },
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600}>
                    {teamA}
                  </Typography>
                  <Typography
                    variant="h4"
                    fontWeight={800}
                    sx={{
                      minWidth: { sm: 120 },
                      textAlign: { xs: "left", sm: "center" },
                      letterSpacing: -0.5,
                    }}
                  >
                    {score}
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{ textAlign: { xs: "left", sm: "right" } }}
                  >
                    {teamB}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1.5 }} />
                <Typography variant="body2" color="text.secondary">
                  {t("news.matchDate", { date: matchDate })}
                </Typography>
              </Box>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  const renderContent = () => {
    if (loading) return renderSkeletons();
    if (error) {
      return (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {t("news.error")}
        </Alert>
      );
    }
    if (!activities.length) {
      return (
        <Box
          sx={{
            py: 6,
            textAlign: "center",
            color: "text.secondary",
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            {t("news.empty")}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {t("news.emptyHint")}
          </Typography>
        </Box>
      );
    }

    return (
      <Stack spacing={2.5}>
        {activities.map((activity) => renderActivityCard(activity))}
      </Stack>
    );
  };

  return (
    <Box
      sx={{
        mx: "auto",
        maxWidth: 1600,
        px: { xs: 2, md: 4 },
        mt: { xs: 1.875, md: 4 },
      }}
    >
      <Title
        title={t("news.title") as string}
        subtitle={t("news.subtitle") as string}
      />
      <Paper elevation={4} sx={{ p: { xs: 2, md: 3 }, mt: 2, borderRadius: 3 }}>
        {renderContent()}
      </Paper>
    </Box>
  );
};

export default NewsPage;
