import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Skeleton,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { SelectChangeEvent } from "@mui/material/Select";
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
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(6);

  const pageSizeOptions = useMemo(() => [6, 10, 15, 20], []);

  const totalPages = useMemo(
    () =>
      Math.max(
        1,
        activities.length ? Math.ceil(activities.length / rowsPerPage) : 1
      ),
    [activities.length, rowsPerPage]
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedActivities = useMemo(() => {
    if (!activities.length) return [];
    const start = (page - 1) * rowsPerPage;
    return activities.slice(start, start + rowsPerPage);
  }, [activities, page, rowsPerPage]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleRowsPerPageChange = (event: SelectChangeEvent) => {
    const value = Number(event.target.value);
    setRowsPerPage(value);
    setPage(1);
  };

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
    <Stack spacing={2.5}>
      {Array.from({ length: 3 }).map((_, idx) => (
        <Card
          key={idx}
          variant="outlined"
          sx={{ borderRadius: 3, borderColor: "divider" }}
        >
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Stack spacing={1} flex={1}>
                  <Skeleton variant="text" width="45%" height={18} />
                  <Skeleton variant="text" width="70%" height={26} />
                  <Skeleton variant="rounded" width={96} height={22} />
                </Stack>
                <Skeleton variant="circular" width={56} height={56} />
              </Stack>
              <Skeleton
                variant="rectangular"
                height={70}
                sx={{ borderRadius: 2 }}
              />
              <Skeleton variant="text" width="30%" height={16} />
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
    const typeLabel = t(`news.labels.${activity.type}`);

    return (
      <Card
        key={activity.id}
        variant="outlined"
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 3,
          border: "1px solid",
          borderColor: alpha(
            config.color,
            theme.palette.mode === "dark" ? 0.45 : 0.18
          ),
          background:
            theme.palette.mode === "dark"
              ? `linear-gradient(140deg, ${alpha(
                  config.color,
                  0.18
                )} 0%, ${alpha(theme.palette.background.paper, 0.92)} 40%, ${alpha(
                  theme.palette.background.default,
                  0.95
                )} 100%)`
              : `linear-gradient(140deg, ${alpha(
                  config.color,
                  0.12
                )} 0%, ${theme.palette.background.paper} 45%, ${alpha(
                  theme.palette.background.default,
                  0.85
                )} 100%)`,
          transition: "transform 0.35s ease, box-shadow 0.35s ease",
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            background: `linear-gradient(120deg, transparent 0%, ${alpha(
              config.color,
              0.2
            )} 45%, transparent 90%)`,
            opacity: 0,
            transition: "opacity 0.35s ease",
            pointerEvents: "none",
          },
          "&:hover": {
            transform: "translateY(-6px)",
            boxShadow: `0 24px 48px ${alpha(config.color, 0.28)}`,
          },
          "&:hover::after": {
            opacity: 1,
          },
        }}
      >
        <CardContent
          sx={{
            p: { xs: 2.5, md: 3 },
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  letterSpacing: -0.2,
                  lineHeight: 1.2,
                }}
              >
                {t(`news.actions.${activity.type}`, { user: actorName })}
              </Typography>
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                flexWrap="wrap"
                sx={{ mt: 0.75 }}
              >
                <Chip
                  size="small"
                  label={typeLabel}
                  sx={{
                    bgcolor: alpha(
                      config.color,
                      theme.palette.mode === "dark" ? 0.24 : 0.12
                    ),
                    color: config.color,
                    fontWeight: 700,
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  {t("news.eventTime", { date: eventDate })}
                </Typography>
              </Stack>
            </Box>
            <Avatar
              sx={{
                bgcolor: config.background,
                color: config.color,
                width: 56,
                height: 56,
                boxShadow: `0 16px 32px ${alpha(config.color, 0.3)}`,
              }}
            >
              <Icon fontSize="large" />
            </Avatar>
          </Stack>

          <Box
            sx={{
              px: { xs: 1.5, sm: 2 },
              py: { xs: 1.25, sm: 1.75 },
              borderRadius: 2,
              border: `1px solid ${alpha(
                config.color,
                theme.palette.mode === "dark" ? 0.35 : 0.18
              )}`,
              background:
                theme.palette.mode === "dark"
                  ? alpha(config.color, 0.18)
                  : alpha(config.color, 0.08),
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr auto 1fr" },
              gap: { xs: 1.25, sm: 2.5 },
              alignItems: "center",
            }}
          >
            <Typography
              variant="subtitle1"
              fontWeight={600}
              title={teamA}
              sx={{
                minWidth: 0,
                textAlign: { xs: "left", sm: "right" },
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
              }}
            >
              {teamA}
            </Typography>
            <Stack spacing={0.5} alignItems="center">
              <Typography
                variant="h4"
                fontWeight={800}
                sx={{
                  letterSpacing: -1,
                  color: config.color,
                  textShadow: `0 6px 18px ${alpha(config.color, 0.25)}`,
                }}
              >
                {score}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t("news.matchDate", { date: matchDate })}
              </Typography>
            </Stack>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              title={teamB}
              sx={{
                minWidth: 0,
                textAlign: { xs: "left", sm: "left" },
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
              }}
            >
              {teamB}
            </Typography>
          </Box>
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
      <Stack spacing={3}>
        {paginatedActivities.map((activity) => renderActivityCard(activity))}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
          sx={{ pt: 0.5 }}
        >
          <FormControl
            size="small"
            sx={{ width: { xs: "100%", sm: 220 } }}
          >
            <InputLabel id="news-pagination-select">
              {t("news.pagination.label")}
            </InputLabel>
            <Select
              labelId="news-pagination-select"
              value={rowsPerPage.toString()}
              label={t("news.pagination.label")}
              onChange={handleRowsPerPageChange}
            >
              {pageSizeOptions.map((option) => (
                <MenuItem key={option} value={option.toString()}>
                  {t("news.pagination.option", { count: option })}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: "flex", justifyContent: { xs: "center", sm: "flex-end" } }}>
            <Pagination
              count={totalPages}
              page={page}
              color="primary"
              shape="rounded"
              onChange={handlePageChange}
              siblingCount={1}
              boundaryCount={1}
            />
          </Box>
        </Stack>
      </Stack>
    );
  };

  return (
    <Box
      sx={{
        mx: "auto",
        maxWidth: 1800,
        px: { xs: 2, md: 4 },
        mt: { xs: 1.875, md: 4 },
      }}
    >
      <Title
        title={t("news.title") as string}
        subtitle={t("news.subtitle") as string}
      />
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3.25 },
          mt: 2,
          borderRadius: 3,
          position: "relative",
          overflow: "hidden",
          border: `1px solid ${alpha(
            theme.palette.primary.main,
            theme.palette.mode === "dark" ? 0.2 : 0.08
          )}`,
          background:
            theme.palette.mode === "dark"
              ? alpha(theme.palette.background.paper, 0.72)
              : alpha(theme.palette.common.white, 0.9),
          backdropFilter: "blur(14px)",
          boxShadow:
            theme.palette.mode === "dark"
              ? `0 22px 48px ${alpha(theme.palette.common.black, 0.4)}`
              : `0 26px 50px ${alpha(theme.palette.primary.main, 0.14)}`,
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at top right, ${alpha(
              theme.palette.primary.main,
              theme.palette.mode === "dark" ? 0.18 : 0.16
            )} 0%, transparent 55%)`,
            pointerEvents: "none",
          },
        }}
      >
        {renderContent()}
      </Paper>
    </Box>
  );
};

export default NewsPage;
