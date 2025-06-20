import React, { useMemo, useState, memo, useCallback } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Select,
  Skeleton,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import ReactApexChart from "react-apexcharts";
import Title from "../../common/UI/Title";
import { useAllMatches, MatchUi } from "../../common/hooks/useAllMatches";
import { useOutletContext } from "react-router-dom";

interface TeamData {
  players: string;
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  pointsPerMatch: number;
  winPercentage: number;
  goalsFor: number;
  goalsAgainst: number;
  goalsDiff: number;
  trophy?: string;
}

const parseScore = (s: string): [number, number] => {
  const m = s.match(/\d+/g) ?? [];
  return [parseInt(m[0] || "0", 10), parseInt(m[1] || "0", 10)];
};

const formatNames = (p: string) =>
  p
    .split(" & ")
    .map((n) => n.trim())
    .map((n) => n.charAt(0).toUpperCase() + n.slice(1))
    .join(" & ");

const normalize = (t: string) =>
  t
    .split("&")
    .map((p) => p.trim().toLowerCase())
    .sort()
    .join(" & ");

const buildTeams = (matches: MatchUi[]): TeamData[] => {
  const map = new Map<string, TeamData>();
  const get = (t: string) => {
    if (!map.has(t))
      map.set(t, {
        players: t,
        matches: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        points: 0,
        pointsPerMatch: 0,
        winPercentage: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalsDiff: 0,
      });
    return map.get(t)!;
  };
  matches.forEach((m) => {
    const t1 = normalize(m.team1);
    const t2 = normalize(m.team2);
    const [g1, g2] = parseScore(m.score);
    const A = get(t1);
    const B = get(t2);
    A.matches += 1;
    B.matches += 1;
    A.goalsFor += g1;
    A.goalsAgainst += g2;
    B.goalsFor += g2;
    B.goalsAgainst += g1;
    if (g1 === g2) {
      A.draws += 1;
      B.draws += 1;
      A.points += 1;
      B.points += 1;
    } else if (g1 > g2) {
      A.wins += 1;
      B.losses += 1;
      A.points += 3;
    } else {
      B.wins += 1;
      A.losses += 1;
      B.points += 3;
    }
  });
  map.forEach((t) => {
    t.pointsPerMatch = t.matches ? t.points / t.matches : 0;
    t.winPercentage = t.matches ? (t.wins / t.matches) * 100 : 0;
    t.goalsDiff = t.goalsFor - t.goalsAgainst;
  });
  const list = Array.from(map.values()).sort(
    (a, b) =>
      b.points - a.points ||
      b.goalsDiff - a.goalsDiff ||
      b.goalsFor - a.goalsFor
  );
  list.forEach((t, i) => {
    if (i === 0) t.trophy = "🥇";
    else if (i === 1) t.trophy = "🥈";
    else if (i === 2) t.trophy = "🥉";
  });
  return list;
};

const chartDefaults = {
  chart: {
    toolbar: { show: false },
    parentHeightOffset: 0,
    animations: { enabled: false },
  },
  dataLabels: { enabled: true },
};

const Bar = memo(
  ({
    data,
    labels,
    colors,
    mode,
  }: {
    data: number[];
    labels: string[];
    colors: string[];
    mode: "light" | "dark";
  }) => (
    <ReactApexChart
      type="bar"
      width="100%"
      height={260}
      series={[{ name: labels[0], data }]}
      options={{
        ...chartDefaults,
        theme: { mode },
        colors,
        plotOptions: {
          bar: { horizontal: false, columnWidth: "50%", distributed: true },
        },
        grid: { padding: { left: 16, right: 0, top: 0, bottom: 0 } },
        xaxis: {
          categories: labels,
          labels: { style: { colors: "#888" } },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: {
          min: 0,
          max: Math.max(...data, 1),
          tickAmount: Math.max(...data, 1),
          labels: { style: { colors: "#888" } },
        },
        legend: { show: false },
      }}
    />
  )
);

const Pie = memo(
  ({
    series,
    labels,
    colors,
    mode,
  }: {
    series: number[];
    labels: string[];
    colors: string[];
    mode: "light" | "dark";
  }) => (
    <ReactApexChart
      type="pie"
      width="100%"
      height={260}
      series={series}
      options={{
        ...chartDefaults,
        theme: { mode },
        labels,
        colors,
        legend: { position: "bottom" },
      }}
    />
  )
);

interface DetailProps {
  team: TeamData;
  matches: MatchUi[];
}

const Details = memo(({ team, matches }: DetailProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { isNavVisible = false } =
    useOutletContext<{ isNavVisible?: boolean }>() ?? {};
  const sideBySideBreakpoint = isNavVisible
    ? "@media (min-width:1450px)"
    : theme.breakpoints.up("lg");
  const veryWideBreakpoint = isNavVisible
    ? "(min-width:1900px)"
    : "(min-width:1750px)";
  const isSideBySideLayout = useMediaQuery(sideBySideBreakpoint);
  const isVeryWideLayout = useMediaQuery(veryWideBreakpoint);
  const isXs = useMediaQuery(theme.breakpoints.only("xs"));
  const norm = (s: string) =>
    s
      .split("&")
      .map((p) => p.trim().toLowerCase())
      .sort()
      .join(" & ");
  const teamMatches = useMemo(
    () =>
      matches
        .filter(
          (m) =>
            norm(m.team1) === team.players || norm(m.team2) === team.players
        )
        .sort((a, b) => b.date - a.date),
    [matches, team.players]
  );
  const colors = isDark
    ? [
        theme.palette.success.light,
        theme.palette.error.light,
        theme.palette.warning.light,
      ]
    : [
        theme.palette.success.main,
        theme.palette.error.main,
        theme.palette.warning.main,
      ];
  const limit = !isSideBySideLayout || isVeryWideLayout ? 8 : 4;
  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        [sideBySideBreakpoint]: {
          gridTemplateColumns: "300px 300px 1fr",
        },
      }}
    >
      <Card elevation={3} sx={{ p: 1 }}>
        <Bar
          data={[team.wins, team.losses, team.draws]}
          labels={[
            t("teams.legend.wins"),
            t("teams.legend.losses"),
            t("teams.legend.draws"),
          ]}
          colors={colors}
          mode={theme.palette.mode as "light" | "dark"}
        />
      </Card>
      <Card elevation={3} sx={{ p: 1 }}>
        <Pie
          series={[team.goalsFor, team.goalsAgainst]}
          labels={[t("teams.legend.goalsFor"), t("teams.legend.goalsAgainst")]}
          colors={[colors[0], colors[1]]}
          mode={theme.palette.mode as "light" | "dark"}
        />
      </Card>
      <Card
        elevation={3}
        sx={{
          gridColumn: { xs: "1", md: "1 / -1" },
          [sideBySideBreakpoint]: {
            gridColumn: "auto",
          },
        }}
      >
        <CardContent>
          <Box sx={{ width: "100%", mx: "auto" }}>
            <Typography variant="subtitle2" gutterBottom>
              {t("teams.history.lastMatches")}
            </Typography>
            <Box
              component={motion.div}
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { staggerChildren: 0.05 },
                },
              }}
              sx={{
                display: "grid",
                gridTemplateColumns: isVeryWideLayout ? "1fr 1fr" : "1fr",
                gap: 2,
              }}
            >
              {teamMatches.slice(0, limit).map((m, idx) => {
                const [g1, g2] = parseScore(m.score);
                const nt1 = norm(m.team1);
                const isTeam1 = nt1 === team.players;
                const teamScore = isTeam1 ? g1 : g2;
                const oppScore = isTeam1 ? g2 : g1;
                const isDraw = teamScore === oppScore;
                const isWin = teamScore > oppScore;
                const opponent = formatNames(
                  isTeam1 ? normalize(m.team2) : normalize(m.team1)
                );
                const bg = isDraw
                  ? isDark
                    ? theme.palette.warning.light
                    : theme.palette.warning.main
                  : isWin
                  ? isDark
                    ? theme.palette.success.light
                    : theme.palette.success.main
                  : isDark
                  ? theme.palette.error.light
                  : theme.palette.error.main;
                const dateStr = new Date(m.date).toLocaleDateString("pl-PL");
                return (
                  <Box
                    key={idx}
                    component={motion.div}
                    variants={{
                      hidden: { opacity: 0, y: 8 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    sx={{
                      width: "100%",
                      p: 1,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 1,
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      sx={{
                        whiteSpace: "nowrap",
                        width: 80,
                        flexShrink: 0,
                        textAlign: "center",
                        display: { xs: "none", sm: "block" },
                      }}
                    >
                      {dateStr}
                    </Typography>
                    <Typography
                      variant="body2"
                      noWrap={!isXs}
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        textAlign: "left",
                        wordBreak: isXs ? "break-word" : "normal",
                      }}
                    >
                      {formatNames(team.players)}
                    </Typography>
                    <Chip
                      icon={<SportsSoccerIcon />}
                      label={`${teamScore} : ${oppScore}`}
                      size="small"
                      sx={{
                        bgcolor: bg,
                        color: isDark
                          ? theme.palette.common.white
                          : theme.palette.common.black,
                        fontWeight: 600,
                        flexShrink: 0,
                        minWidth: 60,
                        justifyContent: "center",
                        "& .MuiChip-icon": {
                          color: isDark
                            ? theme.palette.common.white
                            : theme.palette.common.black,
                        },
                      }}
                    />
                    <Typography
                      variant="body2"
                      noWrap={!isXs}
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        textAlign: "right",
                        wordBreak: isXs ? "break-word" : "normal",
                      }}
                    >
                      {opponent}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
});

const MotionAccordion = memo(motion(Accordion, { forwardMotionProps: true }));

const TeamsPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isCompact = useMediaQuery("(max-width:1439px)");
  const { matches, loading, error } = useAllMatches();
  const teams = useMemo(() => buildTeams(matches), [matches]);
  const [playerFilter, setPlayerFilter] = useState("");
  const [expanded, setExpanded] = useState<string | false>(false);
  const handleExpand = useCallback(
    (team: string) => (_: unknown, isExp: boolean) =>
      setExpanded(isExp ? team : false),
    []
  );
  const players = useMemo(() => {
    const set = new Set<string>();
    matches.forEach((m) =>
      m.team1
        .split("&")
        .concat(m.team2.split("&"))
        .forEach((p) => set.add(p.trim()))
    );
    return Array.from(set).sort();
  }, [matches]);
  const visibleTeams = useMemo(
    () =>
      playerFilter
        ? teams.filter((t) =>
            t.players
              .split(" & ")
              .some((p) => p.toLowerCase() === playerFilter.toLowerCase())
          )
        : teams,
    [teams, playerFilter]
  );
  const nameBgLight = [
    "#f8fafc",
    "#e2e8f0",
    "#dbeafe",
    "#eff6ff",
    "#f1f5f9",
    "#cbd5e1",
  ];
  const nameBgDark = ["#424242", "#37474F", "#303030", "#263238", "#455A64"];
  const rowBg = isDark ? theme.palette.grey[900] : theme.palette.action.hover;

  if (loading)
    return (
      <Box sx={{ mx: "auto", maxWidth: 1800, px: { xs: 2, md: 4 }, mt: { xs: 1.875, md: 4 } }}>
        <Title
          title={t("teams.title") as string}
          subtitle={t("teams.subtitle") as string}
        />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            height={isCompact ? 120 : 91}
            sx={{ my: 1 }}
          />
        ))}
      </Box>
    );

  if (error)
    return (
      <Typography color="error" align="center" sx={{ my: 4 }}>
        {error.message}
      </Typography>
    );

  return (
    <Box sx={{ mx: "auto", maxWidth: 1800, px: { xs: 2, md: 4 }, mt: { xs: 1.875, md: 4 } }}>
      <Title
        title={t("teams.title") as string}
        subtitle={t("teams.subtitle") as string}
      />
      <Box sx={{ my: 2, display: "flex", gap: 2 }}>
        <Select
          value={playerFilter}
          onChange={(e) => setPlayerFilter(e.target.value)}
          displayEmpty
          size="small"
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">{t("teams.filter.allPlayers")}</MenuItem>
          {players.map((p) => (
            <MenuItem key={p} value={p}>
              {formatNames(p)}
            </MenuItem>
          ))}
        </Select>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: { xs: 3, md: 2, lg: 2 },
        }}
      >
        {visibleTeams.map((team, idx) => (
          <MotionAccordion
            key={team.players}
            expanded={expanded === team.players}
            onChange={handleExpand(team.players)}
            disableGutters
            square
            sx={{
              backgroundColor: idx % 2 ? rowBg : "transparent",
              borderRadius: 0,
              "&::before": { display: "none" },
              transition: "background-color .15s ease",
              "&:hover": { backgroundColor: theme.palette.action.selected },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                p: 0,
                pr: 1.25,
                minHeight: isCompact ? "auto" : 91,
                "&.Mui-expanded": { minHeight: isCompact ? "auto" : 91 },
                "& .MuiAccordionSummary-content": {
                  m: 0,
                  display: "flex",
                  alignItems: isCompact ? "flex-start" : "center",
                  width: "100%",
                  flexDirection: isCompact ? "column" : "row",
                },
              }}
            >
              <Box
                sx={{
                  height: isCompact ? "auto" : 91,
                  width: "100%",
                  [theme.breakpoints.up("lg")]: {
                    width: isCompact ? "100%" : 320,
                  },
                  py: isCompact ? 2 : 0,
                  flexShrink: 0,
                  bgcolor: isDark
                    ? nameBgDark[idx % nameBgDark.length]
                    : nameBgLight[idx % nameBgLight.length],
                  color: isDark ? "#fff" : "#000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 2,
                }}
              >
                <Typography variant="h5" fontWeight={700} noWrap>
                  {formatNames(team.players)}
                </Typography>
                {team.trophy && (
                  <Typography component="span" sx={{ fontSize: "1.6rem" }}>
                    {team.trophy}
                  </Typography>
                )}
              </Box>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(4, 1fr)",
                    sm: "repeat(auto-fit, minmax(120px, 1fr))",
                  },
                  flex: { lg: 1 },
                  width: "100%",
                  gap: 1,
                  pt: { xs: 1, lg: 0 },
                  px: { xs: 2, sm: 0 },
                  textAlign: "center",
                }}
              >
                {[
                  { label: t("teams.stats.matches"), value: team.matches },
                  { label: t("teams.stats.points"), value: team.points },
                  {
                    label: t("teams.stats.pointsPerMatch"),
                    value: team.pointsPerMatch.toFixed(2),
                  },
                  {
                    label: t("teams.stats.winPercentage"),
                    value: `${team.winPercentage.toFixed(2)}%`,
                  },
                ].map(({ label, value }) => (
                  <Box key={label} sx={{ minWidth: 0 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontSize: {
                          xs: "0.85rem",
                          md: "1rem",
                          lg: "1.1rem",
                          xl: "1.1rem",
                        },
                        color: "text.secondary",
                        "@media (max-width:500px)": {
                          fontSize: "calc(0.85rem - 1.5px)",
                        },
                      }}
                    >
                      {label}
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      sx={{
                        fontSize: {
                          xs: "0.95rem",
                          md: "1.15rem",
                          lg: "1.3rem",
                          xl: "1.3rem",
                        },
                        "@media (max-width:500px)": {
                          fontSize: "calc(0.95rem - 1.5px)",
                        },
                      }}
                    >
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 2, pb: 2, px: { xs: 1, sm: 2 } }}>
              {expanded === team.players && (
                <Details team={team} matches={matches} />
              )}
            </AccordionDetails>
          </MotionAccordion>
        ))}
      </Box>
    </Box>
  );
};

export default TeamsPage;
