import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
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
      opacity: 0.6,
    }}
  >
    <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
      <Stack spacing={2}>
        <Skeleton variant="text" width="50%" height={24} />
        <Skeleton variant="text" width="70%" height={32} />
        <Skeleton variant="rectangular" height={64} sx={{ borderRadius: 2 }} />
        <Skeleton variant="text" width="40%" height={18} />
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Skeleton variant="rounded" width={96} height={36} />
          <Skeleton variant="rounded" width={96} height={36} />
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
    accent: "primary" | "default"
  ) => (
    <Box
      sx={{
        flex: 1,
        borderRadius: 2,
        border: "1px solid",
        borderColor: accent === "primary" ? "primary.main" : "divider",
        p: 2,
        backgroundColor:
          accent === "primary"
            ? theme.palette.mode === "dark"
              ? theme.palette.primary.dark
              : theme.palette.primary.light
            : theme.palette.background.paper,
      }}
    >
      <Typography
        variant="subtitle2"
        fontWeight={700}
        color={accent === "primary" ? theme.palette.primary.contrastText : "inherit"}
        gutterBottom
      >
        {label}
      </Typography>
      <Stack
        spacing={0.75}
        sx={{
          color:
            accent === "primary"
              ? theme.palette.primary.contrastText
              : theme.palette.text.primary,
        }}
      >
        <Typography variant="body2">
          <Box component="span" fontWeight={600}>
            {t("pending.card.teams")}:
          </Box>{" "}
          {formatTeams(match, t)}
        </Typography>
        <Typography variant="body2">
          <Box component="span" fontWeight={600}>
            {t("pending.card.score")}:
          </Box>{" "}
          {formatScore(match.result)}
        </Typography>
        <Typography variant="body2">
          <Box component="span" fontWeight={600}>
            {t("pending.card.matchDate")}:
          </Box>{" "}
          {dayjs(match.date).format(t("pending.card.matchDateFormat"))}
        </Typography>
      </Stack>
    </Box>
  );

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
      <Alert severity="error" sx={{ mt: 2 }}>
        {t("pending.messages.error")}: {error.message}
      </Alert>
    );
  }

  if (!mappedRequests.length) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        {t("pending.empty")}
      </Alert>
    );
  }

  return (
    <Stack spacing={2.5} sx={{ mt: 2 }}>
      {mappedRequests.map((item) => {
        const disableActions = !isAdmin || processingId === item.id;
        const actionTooltip = isAdmin
          ? undefined
          : (t("pending.tooltips.adminOnly") as string);
        return (
          <Card
            key={item.id}
            variant="outlined"
            sx={{
              borderRadius: 3,
              borderColor: "divider",
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
              <Stack spacing={2.5}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Stack spacing={0.5} flex={1}>
                    <Typography variant="h6" fontWeight={700}>
                      {item.typeLabel}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t("pending.card.submitted", { date: item.submittedAt })}
                    </Typography>
                  </Stack>
                  <Chip
                    label={t(`pending.card.typeLabel.${item.type}`)}
                    color={
                      item.type === "delete"
                        ? "error"
                        : item.type === "update"
                        ? "warning"
                        : "success"
                    }
                    variant="outlined"
                  />
                </Stack>

                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  alignItems="stretch"
                >
                  {item.previousMatch
                    ? renderMatchSection(
                        item.previousMatch,
                        t("pending.card.previous"),
                        "default"
                      )
                    : null}
                  {renderMatchSection(
                    item.baseMatch,
                    item.previousMatch
                      ? t("pending.card.proposed")
                      : t("pending.card.details"),
                    item.previousMatch ? "primary" : "default"
                  )}
                </Stack>
              </Stack>
            </CardContent>
            <CardActions
              sx={{ justifyContent: "flex-end", px: { xs: 2.5, md: 3 }, pb: 2.5 }}
            >
              <Tooltip title={actionTooltip} disableHoverListener={isAdmin}>
                <span>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => handleReject(item.id)}
                    disabled={disableActions}
                    sx={{ mr: 1 }}
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
                  >
                    {t("pending.actions.approve")}
                  </Button>
                </span>
              </Tooltip>
            </CardActions>
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
        sx={{ mx: "auto", maxWidth: 1800, px: { xs: 2, md: 4 }, mt: { xs: 1.875, md: 4 } }}
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
