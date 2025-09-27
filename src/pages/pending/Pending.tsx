import React, { useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import RemoveCircleOutlineRoundedIcon from "@mui/icons-material/RemoveCircleOutlineRounded";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import Title from "../../common/UI/Title";
import { usePendingMatches } from "../../common/context/PendingMatchesContext";
import { useNotification } from "../../common/context/NotificationContext";
import { PendingMatchData } from "../../common/types/pendingMatchRequest";
import { NotificationProvider } from "../../common/context/NotificationContext";

const formatScore = (score: string) =>
  score.includes(":") ? score : score.replace(/-/g, " : ");

const formatTeams = (match: PendingMatchData, t: (key: string) => string) => {
  const teamA = `${match.player1} & ${match.player2}`;
  const teamB = `${match.rival1} & ${match.rival2}`;
  return `${teamA} ${t("pending.card.vs")} ${teamB}`;
};

const PendingSkeletonCard: React.FC = () => (
  <Card
    variant="outlined"
    sx={{
      borderRadius: 3,
      borderColor: "divider",
      overflow: "hidden",
    }}
  >
    <CardContent sx={{ p: { xs: 2.25, md: 2.75 } }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={2}>
          <Skeleton variant="circular" width={48} height={48} />
          <Stack spacing={0.75} flex={1}>
            <Skeleton variant="text" width="40%" height={16} />
            <Skeleton variant="text" width="70%" height={24} />
            <Skeleton variant="text" width="30%" height={16} />
          </Stack>
        </Stack>
        <Skeleton variant="rounded" height={72} />
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Skeleton variant="rounded" width={96} height={36} />
          <Skeleton variant="rounded" width={120} height={36} />
        </Stack>
      </Stack>
    </CardContent>
  </Card>
);

const PendingContent: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { requests, loading, error, isAdmin, approveRequest, rejectRequest } =
    usePendingMatches();
  const { notify } = useNotification();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const typeVisuals = useMemo(
    () => ({
      create: {
        color: theme.palette.success.main,
        icon: AddCircleOutlineRoundedIcon,
      },
      update: {
        color: theme.palette.warning.main,
        icon: EditRoundedIcon,
      },
      delete: {
        color: theme.palette.error.main,
        icon: RemoveCircleOutlineRoundedIcon,
      },
    }),
    [theme]
  );

  const mappedRequests = useMemo(
    () =>
      requests.map((request) => {
        const baseMatch = request.payload.match;
        const previousMatch =
          request.payload.type === "update" ? request.payload.previousMatch : null;
        const actorName =
          request.actor.displayName === "Unknown"
            ? t("pending.unknownUser")
            : request.actor.displayName;
        const typeLabel = t(`pending.card.type.${request.payload.type}`, {
          actor: actorName,
        });
        const submittedAt = dayjs(request.timestamp).format(
          t("pending.card.dateFormat")
        );
        return {
          id: request.id,
          type: request.payload.type,
          typeLabel,
          submittedAt,
          baseMatch,
          previousMatch,
        };
      }),
    [requests, t]
  );

  const handleApprove = async (requestId: string) => {
    const request = requests.find((item) => item.id === requestId);
    if (!request) return;

    try {
      setProcessingId(requestId);
      await approveRequest(request);
      notify(t("pending.messages.approveSuccess"), "success");
    } catch (err) {
      console.error(err);
      notify(t("pending.messages.error"), "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      await rejectRequest(requestId);
      notify(t("pending.messages.rejectSuccess"), "info");
    } catch (err) {
      console.error(err);
      notify(t("pending.messages.error"), "error");
    } finally {
      setProcessingId(null);
    }
  };

  const renderMatchSection = (
    match: PendingMatchData,
    label: string,
    options: { highlight?: boolean; accentColor: string }
  ) => {
    const { highlight = false, accentColor } = options;
    const borderColor = alpha(
      highlight ? accentColor : theme.palette.divider,
      theme.palette.mode === "dark" ? 0.5 : highlight ? 0.35 : 0.8
    );
    const background = highlight
      ? alpha(accentColor, theme.palette.mode === "dark" ? 0.12 : 0.1)
      : alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.4 : 0.9);
    const scoreTextColor = highlight
      ? theme.palette.mode === "dark"
        ? theme.palette.common.white
        : theme.palette.getContrastText(accentColor)
      : theme.palette.text.primary;
    const subtleText = highlight
      ? alpha(theme.palette.getContrastText(accentColor), 0.85)
      : theme.palette.text.secondary;

    return (
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          borderRadius: 2,
          border: `1px solid ${borderColor}`,
          backgroundColor: background,
          p: { xs: 1.75, md: 2 },
          display: "grid",
          gap: 1.25,
          minWidth: 0,
        }}
      >
        <Typography
          variant="caption"
          fontWeight={600}
          sx={{ textTransform: "uppercase", letterSpacing: 0.8, color: subtleText }}
        >
          {label}
        </Typography>
        <Stack spacing={0.5}>
          <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
            {t("pending.card.teams")}
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: "pre-line", fontWeight: 600 }}>
            {formatTeams(match, t)}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Box
            sx={{
              px: 1.25,
              py: 0.65,
              borderRadius: 1.5,
              fontWeight: 700,
              bgcolor: alpha(accentColor, theme.palette.mode === "dark" ? 0.2 : 0.12),
              color: scoreTextColor,
            }}
          >
            {formatScore(match.result)}
          </Box>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {t("pending.card.matchDate", {
              date: dayjs(match.date).format(t("pending.card.matchDateFormat")),
            })}
          </Typography>
        </Stack>
      </Paper>
    );
  };

  if (loading) {
    return (
      <Stack spacing={2.5} sx={{ mt: 2 }}>
        {Array.from({ length: 3 }).map((_, idx) => (
          <PendingSkeletonCard key={idx} />
        ))}
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2, borderRadius: 3 }}>
        {t("pending.messages.error")}: {error.message}
      </Alert>
    );
  }

  if (!mappedRequests.length) {
    return (
      <Paper
        elevation={0}
        sx={{
          mt: 3,
          p: { xs: 3, md: 4 },
          borderRadius: 4,
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          border: `1px dashed ${alpha(
            theme.palette.primary.main,
            theme.palette.mode === "dark" ? 0.5 : 0.35
          )}`,
          background: `linear-gradient(140deg, ${alpha(
            theme.palette.primary.main,
            theme.palette.mode === "dark" ? 0.2 : 0.14
          )} 0%, ${alpha(theme.palette.background.paper, 0.94)} 50%, transparent 100%)`,
        }}
      >
        <Stack spacing={2} alignItems="center" sx={{ position: "relative", zIndex: 1 }}>
          <Avatar
            sx={{
              bgcolor: alpha(
                theme.palette.primary.main,
                theme.palette.mode === "dark" ? 0.28 : 0.18
              ),
              color: theme.palette.primary.contrastText,
              width: 64,
              height: 64,
              boxShadow: `0 18px 32px ${alpha(theme.palette.primary.main, 0.25)}`,
            }}
          >
            <HourglassEmptyRoundedIcon fontSize="large" />
          </Avatar>
          <Typography variant="h6" fontWeight={700}>
            {t("pending.emptyTitle")}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 420, mx: "auto" }}
          >
            {t("pending.emptyDescription")}
          </Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack spacing={2.5} sx={{ mt: 2 }}>
      {mappedRequests.map((item) => {
        const disableActions = !isAdmin || processingId === item.id;
        const actionTooltip = isAdmin
          ? undefined
          : (t("pending.tooltips.adminOnly") as string);
        const visual = typeVisuals[item.type];
        const Icon = visual.icon;
        return (
          <Card
            key={item.id}
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(visual.color, theme.palette.mode === "dark" ? 0.4 : 0.25)}`,
              boxShadow: theme.shadows[2],
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: theme.shadows[4],
              },
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CardContent sx={{ p: { xs: 2.25, md: 2.75 }, flexGrow: 1 }}>
              <Stack spacing={2.5}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                >
                  <Stack direction="row" spacing={1.75} alignItems="center" flex={1} width="100%">
                    <Avatar
                      sx={{
                        bgcolor: alpha(visual.color, theme.palette.mode === "dark" ? 0.25 : 0.15),
                        color:
                          theme.palette.mode === "dark"
                            ? theme.palette.common.white
                            : visual.color,
                        width: 52,
                        height: 52,
                      }}
                    >
                      <Icon fontSize="medium" />
                    </Avatar>
                    <Stack spacing={0.75} flex={1} minWidth={0}>
                      <Typography
                        variant="caption"
                        sx={{
                          letterSpacing: 0.8,
                          textTransform: "uppercase",
                          color: alpha(visual.color, 0.9),
                          fontWeight: 600,
                        }}
                      >
                        {t(`pending.card.typeLabel.${item.type}`)}
                      </Typography>
                      <Typography variant="h6" fontWeight={600} sx={{ lineHeight: 1.3 }}>
                        {item.typeLabel}
                      </Typography>
                    </Stack>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ color: "text.secondary" }}>
                    <AccessTimeRoundedIcon sx={{ fontSize: 20 }} />
                    <Typography variant="body2" fontWeight={500}>
                      {t("pending.card.submitted", { date: item.submittedAt })}
                    </Typography>
                  </Stack>
                </Stack>

                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  alignItems="stretch"
                >
                  {item.previousMatch
                    ? renderMatchSection(item.previousMatch, t("pending.card.previous"), {
                        highlight: false,
                        accentColor: visual.color,
                      })
                    : null}
                  {renderMatchSection(
                    item.baseMatch,
                    item.previousMatch
                      ? t("pending.card.proposed")
                      : t("pending.card.details"),
                    {
                      highlight: Boolean(item.previousMatch),
                      accentColor: visual.color,
                    }
                  )}
                </Stack>

                <Box display="flex" justifyContent="flex-end" gap={1.25} mt={0.5}>
                  <Tooltip title={actionTooltip} disableHoverListener={isAdmin}>
                    <span>
                      <Button
                        variant="outlined"
                        color="inherit"
                        startIcon={<CancelIcon />}
                        onClick={() => handleReject(item.id)}
                        disabled={disableActions}
                        size="small"
                        sx={{ fontWeight: 600, px: 2.5, minWidth: 120 }}
                      >
                        {t("pending.actions.reject")}
                      </Button>
                    </span>
                  </Tooltip>
                  <Tooltip title={actionTooltip} disableHoverListener={isAdmin}>
                    <span>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleApprove(item.id)}
                        disabled={disableActions}
                        size="small"
                        sx={{ fontWeight: 700, px: 2.75, minWidth: 140 }}
                      >
                        {t("pending.actions.approve")}
                      </Button>
                    </span>
                  </Tooltip>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
};

const PendingPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <NotificationProvider>
      <Box
        sx={{
          mx: "auto",
          maxWidth: 1800,
          px: { xs: 2, md: 4 },
          mt: { xs: 1.875, md: 4 },
        }}
      >
        <Title
          title={t("pending.title") as string}
          subtitle={t("pending.subtitle") as string}
        />
        <PendingContent />
      </Box>
    </NotificationProvider>
  );
};

export default PendingPage;
