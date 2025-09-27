import React, { useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Divider,
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
      borderRadius: 4,
      borderColor: "divider",
      opacity: 0.7,
      overflow: "hidden",
      position: "relative",
    }}
  >
    <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
      <Stack spacing={2.5}>
        <Stack direction="row" spacing={2}>
          <Skeleton variant="circular" width={56} height={56} />
          <Stack spacing={1} flex={1}>
            <Skeleton variant="text" width="35%" height={18} />
            <Skeleton variant="text" width="72%" height={30} />
            <Skeleton variant="text" width="45%" height={18} />
          </Stack>
        </Stack>
        <Skeleton
          variant="rectangular"
          height={96}
          sx={{ borderRadius: 3 }}
        />
        <Divider sx={{ borderStyle: "dashed" }} />
        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
          <Skeleton variant="rounded" width={104} height={40} />
          <Skeleton variant="rounded" width={132} height={40} />
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
    const borderColor = highlight
      ? alpha(accentColor, theme.palette.mode === "dark" ? 0.6 : 0.35)
      : alpha(theme.palette.text.secondary, theme.palette.mode === "dark" ? 0.4 : 0.22);
    const background = highlight
      ? `linear-gradient(135deg, ${alpha(
          accentColor,
          theme.palette.mode === "dark" ? 0.24 : 0.16
        )} 0%, ${alpha(accentColor, theme.palette.mode === "dark" ? 0.12 : 0.08)} 100%)`
      : `linear-gradient(135deg, ${alpha(
          theme.palette.background.paper,
          theme.palette.mode === "dark" ? 0.9 : 0.96
        )} 0%, ${alpha(theme.palette.background.default, 0.9)} 100%)`;
    const primaryText = highlight
      ? theme.palette.mode === "dark"
        ? theme.palette.grey[50]
        : theme.palette.grey[900]
      : theme.palette.text.primary;
    const subtleText = highlight
      ? alpha(primaryText, 0.75)
      : theme.palette.text.secondary;

    return (
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          borderRadius: 3,
          border: `1px solid ${borderColor}`,
          background,
          p: { xs: 2, md: 2.5 },
          position: "relative",
          overflow: "hidden",
          minWidth: 0,
          "&::before": highlight
            ? {
                content: '""',
                position: "absolute",
                inset: 0,
                background: `linear-gradient(120deg, ${alpha(
                  accentColor,
                  theme.palette.mode === "dark" ? 0.3 : 0.18
                )} 0%, transparent 65%)`,
                opacity: 0.9,
                pointerEvents: "none",
              }
            : undefined,
        }}
      >
        <Stack spacing={1.6} sx={{ position: "relative", zIndex: 1 }}>
          <Typography
            variant="overline"
            sx={{
              fontWeight: 700,
              letterSpacing: 1.2,
              color: subtleText,
            }}
          >
            {label}
          </Typography>
          <Stack spacing={0.75}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: subtleText,
              }}
            >
              {t("pending.card.teams")}
            </Typography>
            <Typography
              variant="body1"
              fontWeight={600}
              color={primaryText}
              sx={{ whiteSpace: "pre-line" }}
            >
              {formatTeams(match, t)}
            </Typography>
          </Stack>
          <Stack spacing={0.75}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: subtleText,
              }}
            >
              {t("pending.card.score")}
            </Typography>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "baseline",
                gap: 1,
                px: 1.8,
                py: 0.9,
                borderRadius: 999,
                bgcolor: highlight
                  ? alpha(accentColor, theme.palette.mode === "dark" ? 0.35 : 0.2)
                  : alpha(
                      theme.palette.text.secondary,
                      theme.palette.mode === "dark" ? 0.2 : 0.12
                    ),
                color: primaryText,
                boxShadow: highlight
                  ? `0 10px 24px ${alpha(accentColor, 0.25)}`
                  : `0 10px 24px ${alpha(
                      theme.palette.common.black,
                      theme.palette.mode === "dark" ? 0.4 : 0.08
                    )}`,
                fontWeight: 700,
              }}
            >
              <Typography variant="subtitle1" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
                {formatScore(match.result)}
              </Typography>
              <Typography variant="body2" sx={{ color: subtleText, fontWeight: 600 }}>
                {t("pending.card.matchDate", {
                  date: dayjs(match.date).format(t("pending.card.matchDateFormat")),
                })}
              </Typography>
            </Box>
          </Stack>
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
              position: "relative",
              overflow: "hidden",
              borderRadius: 4,
              border: `1px solid ${alpha(
                visual.color,
                theme.palette.mode === "dark" ? 0.55 : 0.25
              )}`,
              background: `linear-gradient(135deg, ${alpha(
                visual.color,
                theme.palette.mode === "dark" ? 0.16 : 0.12
              )} 0%, ${alpha(
                theme.palette.background.paper,
                theme.palette.mode === "dark" ? 0.94 : 0.98
              )} 38%, ${alpha(theme.palette.background.default, 0.94)} 100%)`,
              boxShadow:
                theme.palette.mode === "dark"
                  ? `0 22px 42px ${alpha(visual.color, 0.32)}`
                  : `0 20px 48px ${alpha(visual.color, 0.24)}`,
              transition: "transform 0.45s ease, box-shadow 0.45s ease",
              "&::after": {
                content: '""',
                position: "absolute",
                inset: 0,
                borderRadius: "inherit",
                background: `radial-gradient(circle at 20% -10%, ${alpha(
                  visual.color,
                  theme.palette.mode === "dark" ? 0.35 : 0.18
                )} 0%, transparent 55%)`,
                opacity: 0.9,
                pointerEvents: "none",
                mixBlendMode: "soft-light",
              },
              "&:hover": {
                transform: "translateY(-8px)",
                boxShadow: `0 26px 60px ${alpha(visual.color, 0.32)}`,
              },
            }}
          >
            <CardContent sx={{ p: { xs: 2.75, md: 3.25 }, position: "relative", zIndex: 1 }}>
              <Stack spacing={3}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2.25}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                >
                  <Avatar
                    sx={{
                      bgcolor: alpha(
                        visual.color,
                        theme.palette.mode === "dark" ? 0.28 : 0.18
                      ),
                      color:
                        theme.palette.mode === "dark"
                          ? theme.palette.common.white
                          : visual.color,
                      width: 62,
                      height: 62,
                      boxShadow: `0 14px 32px ${alpha(visual.color, 0.28)}`,
                    }}
                  >
                    <Icon fontSize="large" />
                  </Avatar>
                  <Stack spacing={1} flex={1} minWidth={0}>
                    <Typography
                      variant="overline"
                      sx={{
                        color: alpha(
                          visual.color,
                          theme.palette.mode === "dark" ? 0.9 : 0.8
                        ),
                        fontWeight: 700,
                        letterSpacing: 1.6,
                      }}
                    >
                      {t(`pending.card.typeLabel.${item.type}`)}
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      sx={{
                        lineHeight: 1.2,
                        color:
                          theme.palette.mode === "dark"
                            ? theme.palette.grey[50]
                            : theme.palette.grey[900],
                      }}
                    >
                      {item.typeLabel}
                    </Typography>
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      <AccessTimeRoundedIcon
                        sx={{
                          fontSize: 20,
                          color: alpha(
                            visual.color,
                            theme.palette.mode === "dark" ? 0.8 : 0.65
                          ),
                        }}
                      />
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        {t("pending.card.submitted", { date: item.submittedAt })}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>

                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2.25}
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
              </Stack>
            </CardContent>
            <CardActions
              sx={{
                justifyContent: { xs: "stretch", sm: "space-between" },
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "stretch", sm: "center" },
                gap: { xs: 1, sm: 1.5 },
                px: { xs: 2.75, md: 3.25 },
                py: { xs: 2.25, md: 2.5 },
                position: "relative",
                zIndex: 1,
                backgroundColor: alpha(
                  visual.color,
                  theme.palette.mode === "dark" ? 0.12 : 0.06
                ),
                backdropFilter: "blur(8px)",
              }}
            >
              <Tooltip title={actionTooltip} disableHoverListener={isAdmin}>
                <span>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => handleReject(item.id)}
                    disabled={disableActions}
                    sx={{
                      minWidth: 160,
                      fontWeight: 600,
                      px: { xs: 2.5, sm: 3 },
                    }}
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
                    sx={{
                      minWidth: 180,
                      fontWeight: 700,
                      px: { xs: 2.75, sm: 3.25 },
                      boxShadow: `0 12px 28px ${alpha(
                        visual.color,
                        theme.palette.mode === "dark" ? 0.32 : 0.26
                      )}`,
                    }}
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
