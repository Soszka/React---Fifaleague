import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Skeleton,
  Stack,
  Select,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import RemoveCircleOutlineRoundedIcon from "@mui/icons-material/RemoveCircleOutlineRounded";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import dayjs from "dayjs";
import { Trans, useTranslation } from "react-i18next";
import Title from "../../common/UI/Title";
import { usePendingMatches } from "../../common/context/PendingMatchesContext";
import { useNotification } from "../../common/context/NotificationContext";
import type {
  PendingMatchData,
  PendingMatchRequestPayload,
} from "../../common/types/pendingMatchRequest";
import { NotificationProvider } from "../../common/context/NotificationContext";
import type { SelectChangeEvent } from "@mui/material/Select";

const formatScore = (score: string) =>
  score.includes(":") ? score : score.replace(/-/g, " : ");

const normalizeTimestamp = (value: unknown): dayjs.Dayjs | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const numeric =
    typeof value === "string" ? Number.parseInt(value, 10) : (value as number);

  if (Number.isNaN(numeric)) {
    return null;
  }

  const normalizedValue = numeric < 1e12 ? numeric * 1000 : numeric;
  const parsed = dayjs(normalizedValue);

  return parsed.isValid() ? parsed : null;
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

type PendingCardItem = {
  id: string;
  type: PendingMatchRequestPayload["type"];
  actorName: string;
  submittedAt: string;
  baseMatch: PendingMatchData;
  previousMatch: PendingMatchData | null;
};

const PendingContent: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { requests, loading, error, isAdmin, approveRequest, rejectRequest } =
    usePendingMatches();
  const { notify } = useNotification();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(6);
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const pageSizeOptions = useMemo(() => [6, 10, 15, 20], []);

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

  const mappedRequests = useMemo<PendingCardItem[]>(
    () =>
      requests.map((request) => {
        const baseMatch = request.payload.match;
        const previousMatch =
          request.payload.type === "update" ? request.payload.previousMatch : null;
        const actorName =
          request.actor.displayName === "Unknown"
            ? t("pending.unknownUser")
            : request.actor.displayName;
        const submittedAt = dayjs(request.timestamp).format(
          t("pending.card.dateFormat")
        );
        return {
          id: request.id,
          type: request.payload.type,
          actorName,
          submittedAt,
          baseMatch,
          previousMatch: previousMatch ?? null,
        };
      }),
    [requests, t]
  );

  const totalPages = useMemo(
    () =>
      Math.max(1, mappedRequests.length ? Math.ceil(mappedRequests.length / rowsPerPage) : 1),
    [mappedRequests.length, rowsPerPage]
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedRequests = useMemo<PendingCardItem[]>(
    () => {
      if (!mappedRequests.length) return [];
      const start = (page - 1) * rowsPerPage;
      return mappedRequests.slice(start, start + rowsPerPage);
    },
    [mappedRequests, page, rowsPerPage]
  );

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleRowsPerPageChange = (event: SelectChangeEvent) => {
    const value = Number(event.target.value);
    setRowsPerPage(value);
    setPage(1);
  };

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

  const formatPersonName = (value: string) =>
    value
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");

  const ensurePlayerName = (value: string) => {
    if (!value || !value.trim().length) {
      return t("pending.unknownUser");
    }

    return formatPersonName(value.trim());
  };

  const buildTeamLabels = (match: PendingMatchData) => {
    const teamAPlayers = [
      ensurePlayerName(match.player1),
      ensurePlayerName(match.player2),
    ];
    const teamBPlayers = [
      ensurePlayerName(match.rival1),
      ensurePlayerName(match.rival2),
    ];

    return {
      teamA: {
        desktop: teamAPlayers.join(" & "),
        mobile: teamAPlayers.join("\n&\n"),
      },
      teamB: {
        desktop: teamBPlayers.join(" & "),
        mobile: teamBPlayers.join("\n&\n"),
      },
    };
  };

  const formatMatchDate = (value: PendingMatchData["date"]) => {
    const parsed = normalizeTimestamp(value);
    return parsed ? parsed.format(t("pending.card.matchDateFormat")) : null;
  };

  const renderMatchOverview = (
    match: PendingMatchData,
    options: { highlight?: boolean; accentColor: string }
  ) => {
    const { highlight = false, accentColor } = options;
    const { teamA, teamB } = buildTeamLabels(match);
    const matchDate = formatMatchDate(match.date);
    const dateLabel = matchDate
      ? t("pending.card.matchDate", { date: matchDate })
      : t("pending.card.matchDateUnknown");
    const score = formatScore(match.result);

    const borderColor = alpha(
      accentColor,
      theme.palette.mode === "dark"
        ? highlight
          ? 0.5
          : 0.35
        : highlight
        ? 0.28
        : 0.18
    );
    const backgroundColor = highlight
      ? alpha(accentColor, theme.palette.mode === "dark" ? 0.22 : 0.12)
      : alpha(
          theme.palette.mode === "dark"
            ? theme.palette.background.paper
            : theme.palette.grey[100],
          theme.palette.mode === "dark" ? 0.7 : 1
        );
    const accentTextColor = highlight
      ? accentColor
      : alpha(accentColor, theme.palette.mode === "dark" ? 0.85 : 0.9);

    return (
      <Stack spacing={1} flex={1} minWidth={0}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2.5,
            border: `1px solid ${borderColor}`,
            backgroundColor,
            px: { xs: 1.6, sm: 2.2 },
            py: { xs: 1.35, sm: 1.7 },
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr) auto minmax(0, 1fr)",
              sm: "minmax(0, 1fr) minmax(110px, 160px) minmax(0, 1fr)",
            },
            gap: { xs: 1.25, sm: 2.75 },
            alignItems: "center",
          }}
        >
          <Typography
            variant="subtitle1"
            fontWeight={700}
            title={teamA.desktop}
            sx={{
              minWidth: 0,
              textAlign: { xs: "left", sm: "right" },
              whiteSpace: { xs: "pre-line", sm: "nowrap" },
              overflow: { xs: "visible", sm: "hidden" },
              textOverflow: { xs: "clip", sm: "ellipsis" },
            }}
          >
            {isSmallScreen ? teamA.mobile : teamA.desktop}
          </Typography>
          <Stack spacing={0.5} alignItems="center" sx={{ textAlign: "center" }}>
            <Typography
              variant="h4"
              fontWeight={800}
              sx={{
                letterSpacing: -0.8,
                color: accentTextColor,
                textShadow: `0 6px 18px ${alpha(
                  accentColor,
                  highlight ? 0.28 : 0.18
                )}`,
              }}
            >
              {score}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600 }}
            >
              {dateLabel}
            </Typography>
          </Stack>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            title={teamB.desktop}
            sx={{
              minWidth: 0,
              textAlign: { xs: "right", sm: "left" },
              whiteSpace: { xs: "pre-line", sm: "nowrap" },
              overflow: { xs: "visible", sm: "hidden" },
              textOverflow: { xs: "clip", sm: "ellipsis" },
            }}
          >
            {isSmallScreen ? teamB.mobile : teamB.desktop}
          </Typography>
        </Paper>
      </Stack>
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
          background: `linear-gradient(140deg, ${alpha(
            theme.palette.primary.main,
            theme.palette.mode === "dark" ? 0.2 : 0.14
          )} 0%, ${alpha(theme.palette.background.paper, 0.94)} 50%, transparent 100%)`,
          boxShadow: `0 6px 20px ${alpha(
            theme.palette.mode === "dark"
              ? theme.palette.common.black
              : theme.palette.primary.main,
            theme.palette.mode === "dark" ? 0.3 : 0.16
          )}`,
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
      {paginatedRequests.map((item) => {
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
              borderRadius: 3,
              border: `1px solid ${alpha(visual.color, theme.palette.mode === "dark" ? 0.5 : 0.22)}`,
              backgroundColor:
                theme.palette.mode === "dark"
                  ? alpha(theme.palette.background.paper, 0.94)
                  : theme.palette.common.white,
              boxShadow:
                theme.palette.mode === "dark"
                  ? `0 18px 36px ${alpha(theme.palette.common.black, 0.45)}`
                  : `0 18px 38px ${alpha(visual.color, 0.18)}`,
              transition: "transform 0.4s ease, box-shadow 0.4s ease",
              display: "flex",
              flexDirection: "column",
              "&::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                borderRadius: "inherit",
                background: `linear-gradient(120deg, transparent 0%, ${alpha(
                  visual.color,
                  theme.palette.mode === "dark" ? 0.24 : 0.18
                )} 55%, transparent 90%)`,
                transform: "translateX(-120%) skewX(-16deg)",
                transition: "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
                pointerEvents: "none",
              },
              "&:hover": {
                transform: "translateY(-6px)",
                boxShadow: `0 28px 48px ${alpha(visual.color, 0.28)}`,
              },
              "&:hover::before": {
                transform: "translateX(130%) skewX(-16deg)",
              },
              "&:hover .pending-card-icon": {
                transform: "scale(1.08) rotate(4deg)",
              },
              "&:hover .pending-card-icon svg": {
                transform: "scale(1.08)",
              },
            }}
          >
            <CardContent
              sx={{
                p: { xs: 2, md: 2.5 },
                flexGrow: 1,
                position: "relative",
                zIndex: 1,
                display: "flex",
                flexDirection: "column",
                gap: { xs: 1.9, sm: 2.2 },
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr auto", sm: "1fr auto" },
                  columnGap: { xs: 1.5, sm: 2.5 },
                  rowGap: { xs: 1.25, sm: 0.75 },
                  alignItems: { xs: "flex-start", sm: "center" },
                }}
              >
                <Stack spacing={{ xs: 0.75, sm: 0.9 }} sx={{ minWidth: 0 }}>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{ lineHeight: 1.25, letterSpacing: -0.2 }}
                  >
                    <Trans
                      i18nKey={`pending.card.type.${item.type}`}
                      values={{ actor: item.actorName }}
                      components={{
                        actor: (
                          <Box
                            component="span"
                          sx={{
                            color: visual.color,
                            fontWeight: 800,
                            display: "inline",
                            mr: { xs: 0.5, sm: 0.35 },
                            textShadow: `0 2px 6px ${alpha(visual.color, 0.2)}`,
                          }}
                        />
                      ),
                      }}
                    />
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={0.75}
                    alignItems="center"
                    sx={{ color: "text.secondary" }}
                  >
                    <AccessTimeRoundedIcon sx={{ fontSize: 18 }} />
                    <Typography
                      variant="caption"
                      color="inherit"
                      sx={{ fontWeight: 600 }}
                    >
                      {t("pending.card.submitted", { date: item.submittedAt })}
                    </Typography>
                  </Stack>
                </Stack>
                <Avatar
                  className="pending-card-icon"
                  sx={{
                    bgcolor: alpha(visual.color, theme.palette.mode === "dark" ? 0.22 : 0.12),
                    color:
                      theme.palette.mode === "dark"
                        ? theme.palette.common.white
                        : visual.color,
                    width: { xs: 48, sm: 56 },
                    height: { xs: 48, sm: 56 },
                    border: `2px solid ${alpha(
                      visual.color,
                      theme.palette.mode === "dark" ? 0.45 : 0.28
                    )}`,
                    transition: "transform 0.45s ease",
                    alignSelf: { xs: "flex-start", sm: "center" },
                  }}
                >
                  <Icon fontSize="large" sx={{ transition: "transform 0.45s ease" }} />
                </Avatar>
              </Box>

              <Stack
                direction={{ xs: "column", md: item.previousMatch ? "row" : "column" }}
                spacing={{ xs: 2, md: 2.5 }}
              >
                {item.previousMatch
                  ? renderMatchOverview(item.previousMatch, {
                      highlight: false,
                      accentColor: visual.color,
                    })
                  : null}
                {renderMatchOverview(item.baseMatch, {
                  highlight: true,
                  accentColor: visual.color,
                })}
              </Stack>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: { xs: "stretch", sm: "flex-end" },
                  gap: 1.25,
                  flexWrap: { xs: "wrap", sm: "nowrap" },
                  mt: 0.5,
                }}
              >
                <Tooltip title={actionTooltip} disableHoverListener={isAdmin}>
                  <Box
                    component="span"
                    sx={{
                      display: "inline-flex",
                      flex: isSmallScreen ? "1 1 100%" : "0 0 auto",
                    }}
                  >
                    <Button
                      fullWidth={isSmallScreen}
                      variant="outlined"
                      color="inherit"
                      startIcon={<CancelIcon />}
                      onClick={() => handleReject(item.id)}
                      disabled={disableActions}
                      size="small"
                      sx={{ fontWeight: 600, px: 2.5, minWidth: { xs: "100%", sm: 132 } }}
                    >
                      {t("pending.actions.reject")}
                    </Button>
                  </Box>
                </Tooltip>
                <Tooltip title={actionTooltip} disableHoverListener={isAdmin}>
                  <Box
                    component="span"
                    sx={{
                      display: "inline-flex",
                      flex: isSmallScreen ? "1 1 100%" : "0 0 auto",
                    }}
                  >
                    <Button
                      fullWidth={isSmallScreen}
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleApprove(item.id)}
                      disabled={disableActions}
                      size="small"
                      sx={{ fontWeight: 700, px: 2.75, minWidth: { xs: "100%", sm: 148 } }}
                    >
                      {t("pending.actions.approve")}
                    </Button>
                  </Box>
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        );
      })}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        sx={{ pt: 1 }}
      >
        <FormControl
          size="small"
          sx={{ minWidth: { xs: "100%", sm: 220 } }}
        >
          <InputLabel id="pending-pagination-select">
            {t("pending.pagination.label")}
          </InputLabel>
          <Select
            labelId="pending-pagination-select"
            value={rowsPerPage.toString()}
            label={t("pending.pagination.label")}
            onChange={handleRowsPerPageChange}
          >
            {pageSizeOptions.map((option) => (
              <MenuItem key={option} value={option.toString()}>
                {t("pending.pagination.option", { count: option })}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box
          sx={{
            display: "flex",
            justifyContent: { xs: "center", sm: "flex-end" },
          }}
        >
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
