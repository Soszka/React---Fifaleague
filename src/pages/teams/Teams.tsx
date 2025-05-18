import React, { useMemo, useState } from "react";
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
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import Title from "../../common/UI/Title";
import { useAllMatches, MatchUi } from "../../common/hooks/useAllMatches";
import ReactApexChart from "react-apexcharts";

interface TeamAccordionData {
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

const buildTeamsData = (matches: MatchUi[]): TeamAccordionData[] => {
  const map = new Map<string, TeamAccordionData>();
  const get = (team: string) => {
    if (!map.has(team))
      map.set(team, {
        players: team,
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
    return map.get(team)!;
  };
  const norm = (team: string) =>
    team
      .split("&")
      .map((p) => p.trim())
      .sort((a, b) => a.localeCompare(b))
      .join(" & ");

  matches.forEach((m) => {
    const t1 = norm(m.team1);
    const t2 = norm(m.team2);
    const [g1, g2] = m.score.split(":").map((n) => parseInt(n, 10));
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

  const arr = Array.from(map.values()).sort(
    (a, b) => b.winPercentage - a.winPercentage
  );
  arr.forEach((t, i) => {
    if (i === 0) t.trophy = "🥇";
    else if (i === 1) t.trophy = "🥈";
    else if (i === 2) t.trophy = "🥉";
  });
  return arr;
};

interface DetailsProps {
  team: TeamAccordionData;
  matches: MatchUi[];
}

const TeamDetails: React.FC<DetailsProps> = ({ team, matches }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const normalize = (s: string) =>
    s
      .split("&")
      .map((p) => p.trim())
      .sort()
      .join(" & ");

  const teamMatches = useMemo(
    () =>
      matches
        .filter(
          (m) =>
            normalize(m.team1) === team.players ||
            normalize(m.team2) === team.players
        )
        .sort((a, b) => b.date - a.date),
    [matches, team.players]
  );

  const chartColors = isDark
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

  const maxValue = Math.max(team.wins, team.losses, team.draws);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: 2,
      }}
    >
      <Card elevation={3} sx={{ p: 1, width: { xs: "100%", md: 300 } }}>
        <ReactApexChart
          type="bar"
          width="100%"
          height={260}
          series={[
            {
              name: t("teams.legend.wins"),
              data: [team.wins, team.losses, team.draws],
            },
          ]}
          options={{
            theme: { mode: theme.palette.mode },
            chart: {
              toolbar: { show: false },
              parentHeightOffset: 0,
            },
            colors: chartColors,
            plotOptions: {
              bar: {
                horizontal: false,
                columnWidth: "50%",
                distributed: true,
              },
            },
            grid: {
              padding: { left: 16, right: 0, top: 0, bottom: 0 },
            },
            xaxis: {
              categories: [
                t("teams.legend.wins"),
                t("teams.legend.losses"),
                t("teams.legend.draws"),
              ],
              labels: { style: { colors: theme.palette.text.primary } },
              axisBorder: { show: false },
              axisTicks: { show: false },
            },
            yaxis: {
              min: 0,
              max: maxValue === 0 ? 1 : maxValue,
              tickAmount: maxValue === 0 ? 1 : maxValue,
              labels: { style: { colors: theme.palette.text.primary } },
            },
            dataLabels: { enabled: true },
            legend: { show: false },
          }}
        />
      </Card>

      <Card elevation={3} sx={{ p: 1, width: { xs: "100%", md: 300 } }}>
        <ReactApexChart
          type="pie"
          width="100%"
          height={260}
          series={[team.goalsFor, team.goalsAgainst]}
          options={{
            theme: { mode: theme.palette.mode },
            chart: { toolbar: { show: false }, parentHeightOffset: 0 },
            labels: [
              t("teams.legend.goalsFor"),
              t("teams.legend.goalsAgainst"),
            ],
            colors: [chartColors[0], chartColors[1]],
            dataLabels: { enabled: true },
            legend: { position: "bottom" },
          }}
        />
      </Card>

      <Card elevation={3} sx={{ flex: 1 }}>
        <CardContent>
          <Box sx={{ width: { xs: "100%" }, mx: "auto" }}>
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
                gridTemplateColumns: "1fr 1fr",
                gap: 2,
              }}
            >
              {teamMatches.slice(0, 8).map((m, idx) => {
                const [g1, g2] = m.score.split(":").map((n) => parseInt(n, 10));
                const isWin =
                  (normalize(m.team1) === team.players && g1 > g2) ||
                  (normalize(m.team2) === team.players && g2 > g1);
                const isDraw = g1 === g2;
                const opponent =
                  normalize(m.team1) === team.players
                    ? normalize(m.team2)
                    : normalize(m.team1);

                const outcomeBg = isDraw
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
                      alignItems: "center",
                      gap: 2,
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
                      }}
                    >
                      {dateStr}
                    </Typography>
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{ flex: 1, minWidth: 0, textAlign: "left" }}
                    >
                      {team.players}
                    </Typography>
                    <Chip
                      icon={<SportsSoccerIcon />}
                      label={m.score}
                      size="small"
                      sx={{
                        bgcolor: outcomeBg,
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
                      noWrap
                      sx={{ flex: 1, minWidth: 0, textAlign: "right" }}
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
};

const MotionAccordion = motion(Accordion);

const TeamsPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const { matches, loading, error } = useAllMatches();
  const teams = useMemo(() => buildTeamsData(matches), [matches]);

  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const playersList = useMemo(() => {
    const set = new Set<string>();
    matches.forEach((m) =>
      m.team1
        .split("&")
        .concat(m.team2.split("&"))
        .forEach((p) => set.add(p.trim()))
    );
    return Array.from(set).sort();
  }, [matches]);

  const filteredTeams = useMemo(
    () =>
      selectedPlayer
        ? teams.filter((t) => t.players.includes(selectedPlayer))
        : teams,
    [teams, selectedPlayer]
  );

  const nameBgLight = ["#FFFACD", "#E6E6FA", "#F0FFF0", "#FFF0F5", "#E0F7FA"];
  const nameBgDark = ["#424242", "#37474F", "#303030", "#263238", "#455A64"];
  const rowBg = isDark ? theme.palette.grey[900] : theme.palette.action.hover;

  if (loading)
    return (
      <Box sx={{ mx: "auto", maxWidth: 1800, px: { xs: 2, md: 4 }, mt: 4 }}>
        <Title
          title={t("teams.title") as string}
          subtitle={t("teams.subtitle") as string}
        />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={140} sx={{ my: 1 }} />
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
    <Box sx={{ mx: "auto", maxWidth: 1800, px: { xs: 2, md: 4 }, mt: 4 }}>
      <Title
        title={t("teams.title") as string}
        subtitle={t("teams.subtitle") as string}
      />

      <Box sx={{ my: 2, display: "flex", gap: 2 }}>
        <Select
          value={selectedPlayer}
          onChange={(e) => setSelectedPlayer(e.target.value)}
          displayEmpty
          size="small"
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">{t("teams.filter.allPlayers")}</MenuItem>
          {playersList.map((p) => (
            <MenuItem key={p} value={p}>
              {p}
            </MenuItem>
          ))}
        </Select>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {filteredTeams.map((team, idx) => (
          <MotionAccordion
            key={team.players}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.04 }}
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
                minHeight: 91,
                "&.Mui-expanded": { minHeight: 91 },
                "& .MuiAccordionSummary-content": {
                  m: 0,
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                },
              }}
            >
              <Box
                sx={{
                  height: 91,
                  width: 320,
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
                  {team.players}
                </Typography>
                {team.trophy && (
                  <Typography component="span" sx={{ fontSize: "1.6rem" }}>
                    {team.trophy}
                  </Typography>
                )}
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "nowrap",
                  flex: 1,
                  gap: { xs: 1, md: 2 },
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
                  <Box
                    key={label}
                    sx={{
                      flex: "1 0 0",
                      textAlign: "center",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {label}
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 2 }}>
              <TeamDetails team={team} matches={matches} />
            </AccordionDetails>
          </MotionAccordion>
        ))}
      </Box>
    </Box>
  );
};

export default TeamsPage;
