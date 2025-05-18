import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Grow,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from "@mui/material";
import { SvgIconProps } from "@mui/material/SvgIcon";
import { useTranslation, Trans } from "react-i18next";
import Title from "../../common/UI/Title";
import { useAllMatches } from "../../common/hooks/useAllMatches";
import ReactApexChart from "react-apexcharts";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import CancelIcon from "@mui/icons-material/Cancel";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PercentIcon from "@mui/icons-material/Percent";
import QueryStatsIcon from "@mui/icons-material/QueryStats";

type Outcome = "win" | "draw" | "loss";

const TabPanel = ({
  value,
  index,
  children,
}: {
  value: number;
  index: number;
  children: React.ReactNode;
}) => (value === index ? <Box sx={{ mt: 2 }}>{children}</Box> : null);

const pointsForOutcome = (o: Outcome) =>
  o === "win" ? 3 : o === "draw" ? 1 : 0;

const StatsPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { matches } = useAllMatches();
  const textColor =
    theme.palette.mode === "dark"
      ? theme.palette.grey[100]
      : theme.palette.grey[900];

  const players = useMemo(() => {
    const s = new Set<string>();
    matches.forEach((m) => {
      m.team1.split("&").forEach((p: string) => s.add(p.trim()));
      m.team2.split("&").forEach((p: string) => s.add(p.trim()));
    });
    return Array.from(s).sort();
  }, [matches]);

  const [user, setUser] = useState("");
  useEffect(() => {
    if (!user && players.length) {
      setUser(players.includes("Bartek") ? "Bartek" : players[0]);
    }
  }, [players, user]);

  const [tab, setTab] = useState(0);

  const normPlayers = (team: string) => team.split("&").map((p) => p.trim());

  const getOutcomeForUser = (score: string, isUserTeam1: boolean): Outcome => {
    const delim = score.includes(":") ? ":" : "-";
    const [g1, g2] = score.split(delim).map((n) => parseInt(n.trim(), 10));
    if (g1 === g2) return "draw";
    const team1Won = g1 > g2;
    return team1Won === isUserTeam1 ? "win" : "loss";
  };

  const userMatches = useMemo(
    () =>
      matches.filter(
        (m) =>
          normPlayers(m.team1).includes(user) ||
          normPlayers(m.team2).includes(user)
      ),
    [matches, user]
  );

  const outcomeCounts = useMemo(() => {
    let win = 0,
      draw = 0,
      loss = 0;
    userMatches.forEach((m) => {
      const isUserTeam1 = normPlayers(m.team1).includes(user);
      const oc = getOutcomeForUser(m.score, isUserTeam1);
      if (oc === "win") win += 1;
      else if (oc === "draw") draw += 1;
      else loss += 1;
    });
    return { win, draw, loss } as const;
  }, [userMatches, user]);

  const totalMatches = userMatches.length;
  const totalPoints = outcomeCounts.win * 3 + outcomeCounts.draw;
  const overallPPM = totalMatches ? totalPoints / totalMatches : 0;
  const winPct = totalMatches ? (outcomeCounts.win / totalMatches) * 100 : 0;

  const recentWins = useMemo(() => {
    const recent = [...userMatches].sort((a, b) => b.date - a.date).slice(0, 5);
    return recent.filter((m) => {
      const isUserTeam1 = normPlayers(m.team1).includes(user);
      return getOutcomeForUser(m.score, isUserTeam1) === "win";
    }).length;
  }, [userMatches, user]);

  const recentPPM = useMemo<string>(() => {
    const recent = [...userMatches].sort((a, b) => b.date - a.date).slice(0, 5);
    const pts = recent.reduce<number>((sum, m) => {
      const isUserTeam1 = normPlayers(m.team1).includes(user);
      return sum + pointsForOutcome(getOutcomeForUser(m.score, isUserTeam1));
    }, 0);
    return recent.length ? (pts / recent.length).toFixed(2) : "0.00";
  }, [userMatches, user]);

  const stability = recentPPM;

  const partnerAgg = useMemo(() => {
    const getPartner = (team: string) => {
      const p = normPlayers(team);
      if (!p.includes(user)) return null;
      return p.find((x) => x !== user) || null;
    };
    const map = new Map<
      string,
      { matches: number; wins: number; points: number }
    >();
    userMatches.forEach((m) => {
      const partner =
        getPartner(m.team1) || getPartner(m.team2) || "Solo/Unknown";
      if (!map.has(partner))
        map.set(partner, { matches: 0, wins: 0, points: 0 });
      const a = map.get(partner)!;
      a.matches += 1;
      const isUserTeam1 = normPlayers(m.team1).includes(user);
      const oc = getOutcomeForUser(m.score, isUserTeam1);
      if (oc === "win") {
        a.wins += 1;
        a.points += 3;
      } else if (oc === "draw") a.points += 1;
    });
    return map;
  }, [userMatches, user]);

  const partnerStats = useMemo(() => {
    const arr = Array.from(partnerAgg.entries()).map(([name, d]) => ({
      name,
      ...d,
      ppm: d.matches ? d.points / d.matches : 0,
    }));
    const by = (k: keyof (typeof arr)[number]) =>
      [...arr].sort((a, b) => (b[k] as number) - (a[k] as number));
    return {
      bestWins: by("wins")[0],
      bestPoints: by("points")[0],
      bestPPM: by("ppm")[0],
      worstPPM: by("ppm").reverse()[0],
      mostMatches: by("matches")[0],
      listWins: by("wins").slice(0, 6),
      listPoints: by("points").slice(0, 6),
      listPPM: by("ppm").slice(0, 6),
    } as const;
  }, [partnerAgg]);

  const successColor =
    theme.palette.mode === "dark"
      ? theme.palette.success.light
      : theme.palette.success.main;
  const errorColor =
    theme.palette.mode === "dark"
      ? theme.palette.error.light
      : theme.palette.error.main;
  const warningColor =
    theme.palette.mode === "dark"
      ? theme.palette.warning.light
      : theme.palette.warning.main;

  const chartColors = [successColor, errorColor, warningColor];

  const barConfig = (
    list: { name: string; value: number }[],
    color: string,
    label: string
  ) => ({
    series: [{ name: label, data: list.map((i) => i.value) }],
    opts: {
      theme: { mode: theme.palette.mode },
      chart: { toolbar: { show: false }, parentHeightOffset: 0 },
      plotOptions: { bar: { horizontal: true } },
      xaxis: { categories: list.map((i) => i.name) },
      colors: [color],
    },
  });

  const matchesBar = {
    series: [
      {
        name: t("stats.charts.matches") as string,
        data: [outcomeCounts.win, outcomeCounts.loss, outcomeCounts.draw],
      },
    ],
    opts: {
      theme: { mode: theme.palette.mode },
      chart: { toolbar: { show: false }, parentHeightOffset: 0 },
      plotOptions: { bar: { horizontal: true, distributed: true } },
      xaxis: {
        categories: [
          t("stats.outcome.win") as string,
          t("stats.outcome.loss") as string,
          t("stats.outcome.draw") as string,
        ],
      },
      colors: chartColors,
    },
  };

  const winsBar = barConfig(
    partnerStats.listWins.map((i) => ({ name: i.name, value: i.wins })),
    successColor,
    t("stats.charts.wins") as string
  );

  const pointsBar = barConfig(
    partnerStats.listPoints.map((i) => ({ name: i.name, value: i.points })),
    errorColor,
    t("stats.charts.points") as string
  );

  const ppmBar = barConfig(
    partnerStats.listPPM.map((i) => ({
      name: i.name,
      value: parseFloat(i.ppm.toFixed(2)),
    })),
    warningColor,
    t("stats.charts.ppm") as string
  );

  const bulletIndexRef = useRef(0);
  const bullet = (
    icon: React.ReactElement<SvgIconProps>,
    label: string,
    value: string | number
  ) => {
    bulletIndexRef.current += 1;
    const idx = bulletIndexRef.current - 1;
    const color =
      idx % 2 === 0 ? theme.palette.text.secondary : theme.palette.text.primary;
    return (
      <ListItem sx={{ py: 0.5 }}>
        <ListItemIcon sx={{ minWidth: 40, mr: 2 }}>
          {React.cloneElement(icon, { sx: { fontSize: 36, color } })}
        </ListItemIcon>
        <ListItemText
          primary={label}
          secondary={value}
          primaryTypographyProps={{ variant: "body2" }}
          secondaryTypographyProps={{
            variant: "subtitle2",
            fontWeight: 700,
            fontSize: "1rem",
            color: textColor,
          }}
        />
      </ListItem>
    );
  };

  const ChartCard = ({ children }: { children: React.ReactNode }) => (
    <Card sx={{ flex: 1, p: 2 }}>{children}</Card>
  );

  const InfoCard = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <Grow in timeout={500}>
      <Card sx={{ flex: 1 }}>
        <CardContent>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {title}
          </Typography>
          <List sx={{ columnCount: { xs: 1, sm: 2 }, columnGap: 2 }}>
            {children}
          </List>
        </CardContent>
      </Card>
    </Grow>
  );

  return (
    <Box sx={{ mx: "auto", maxWidth: 1800, px: { xs: 2, md: 4 }, mt: 4 }}>
      <Title
        title={t("stats.title") as string}
        subtitle={t("stats.subtitle") as string}
      />

      <Box sx={{ mt: 2 }}>
        <Select
          size="small"
          sx={{ minWidth: 200 }}
          value={user}
          onChange={(e) => setUser(e.target.value)}
        >
          {players.map((p) => (
            <MenuItem key={p} value={p}>
              {p}
            </MenuItem>
          ))}
        </Select>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mt: 3 }}
      >
        <Tab label={t("stats.tabs.matches")} />
        <Tab label={t("stats.tabs.wins")} />
        <Tab label={t("stats.tabs.points")} />
        <Tab label={t("stats.tabs.ppm")} />
      </Tabs>

      <TabPanel value={tab} index={0}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
          }}
        >
          <ChartCard>
            <ReactApexChart
              type="bar"
              width="100%"
              height={360}
              series={matchesBar.series}
              options={matchesBar.opts as any}
            />
          </ChartCard>

          <InfoCard title={t("stats.cards.matches.title") as string}>
            {bullet(
              <SportsSoccerIcon />,
              t("stats.cards.matches.totalLabel"),
              totalMatches
            )}
            {bullet(
              <EmojiEventsIcon />,
              t("stats.cards.matches.winsLabel"),
              outcomeCounts.win
            )}
            {bullet(
              <RemoveCircleOutlineIcon />,
              t("stats.cards.matches.drawsLabel"),
              outcomeCounts.draw
            )}
            {bullet(
              <CancelIcon />,
              t("stats.cards.matches.lossesLabel"),
              outcomeCounts.loss
            )}
            {bullet(
              <PercentIcon />,
              t("stats.cards.matches.winPercent"),
              `${winPct.toFixed(1)}%`
            )}
            {bullet(
              <TrendingUpIcon />,
              t("stats.cards.matches.totalPointsLabel"),
              totalPoints
            )}
            {bullet(
              <PercentIcon />,
              t("stats.cards.matches.ppmLabel"),
              overallPPM.toFixed(2)
            )}
            {bullet(
              <QueryStatsIcon />,
              t("stats.cards.matches.stabilityLabel"),
              stability
            )}
          </InfoCard>
        </Box>
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
          }}
        >
          <ChartCard>
            <ReactApexChart
              type="bar"
              width="100%"
              height={360}
              series={winsBar.series}
              options={winsBar.opts as any}
            />
          </ChartCard>

          <InfoCard title={t("stats.cards.wins.title") as string}>
            {bullet(
              <EmojiEventsIcon />,
              t("stats.cards.wins.totalLabel"),
              outcomeCounts.win
            )}
            {bullet(
              <PercentIcon />,
              t("stats.cards.wins.winPercentLabel"),
              `${winPct.toFixed(1)}%`
            )}
            {bullet(
              <TrendingUpIcon />,
              t("stats.cards.wins.recentLabel"),
              recentWins
            )}
            {bullet(
              <QueryStatsIcon />,
              t("stats.cards.wins.matchesLabel"),
              totalMatches
            )}
            {bullet(
              <RemoveCircleOutlineIcon />,
              t("stats.cards.wins.drawsLabel"),
              outcomeCounts.draw
            )}
            {bullet(
              <CancelIcon />,
              t("stats.cards.wins.lossesLabel"),
              outcomeCounts.loss
            )}
            {bullet(
              <TrendingUpIcon />,
              t("stats.cards.wins.totalPointsLabel"),
              totalPoints
            )}
            {bullet(
              <PercentIcon />,
              t("stats.cards.wins.ppmLabel"),
              overallPPM.toFixed(2)
            )}
          </InfoCard>
        </Box>
      </TabPanel>

      <TabPanel value={tab} index={2}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
          }}
        >
          <ChartCard>
            <ReactApexChart
              type="bar"
              width="100%"
              height={360}
              series={pointsBar.series}
              options={pointsBar.opts as any}
            />
          </ChartCard>

          <InfoCard title={t("stats.cards.points.title") as string}>
            {bullet(
              <TrendingUpIcon />,
              t("stats.cards.points.totalPointsLabel"),
              totalPoints
            )}
            {bullet(
              <PercentIcon />,
              t("stats.cards.points.avgPPMLabel"),
              overallPPM.toFixed(2)
            )}
            {bullet(
              <QueryStatsIcon />,
              t("stats.cards.points.matchesLabel"),
              totalMatches
            )}
            {bullet(
              <EmojiEventsIcon />,
              t("stats.cards.points.winsLabel"),
              outcomeCounts.win
            )}
            {bullet(
              <RemoveCircleOutlineIcon />,
              t("stats.cards.points.drawsLabel"),
              outcomeCounts.draw
            )}
            {bullet(
              <CancelIcon />,
              t("stats.cards.points.lossesLabel"),
              outcomeCounts.loss
            )}
            {bullet(
              <PercentIcon />,
              t("stats.cards.points.winPercentLabel"),
              `${winPct.toFixed(1)}%`
            )}
            {bullet(
              <QueryStatsIcon />,
              t("stats.cards.points.stabilityLabel"),
              stability
            )}
          </InfoCard>
        </Box>
      </TabPanel>

      <TabPanel value={tab} index={3}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
          }}
        >
          <ChartCard>
            <ReactApexChart
              type="bar"
              width="100%"
              height={360}
              series={ppmBar.series}
              options={ppmBar.opts as any}
            />
          </ChartCard>

          <InfoCard title={t("stats.cards.ppm.title") as string}>
            {bullet(
              <PercentIcon />,
              t("stats.cards.ppm.avgPPMLabel"),
              overallPPM.toFixed(2)
            )}
            {bullet(
              <QueryStatsIcon />,
              t("stats.cards.ppm.stabilityLabel"),
              stability
            )}
            {bullet(
              <QueryStatsIcon />,
              t("stats.cards.ppm.matchesLabel"),
              totalMatches
            )}
            {bullet(
              <PercentIcon />,
              t("stats.cards.ppm.winPercentLabel"),
              `${winPct.toFixed(1)}%`
            )}
            {bullet(
              <TrendingUpIcon />,
              t("stats.cards.ppm.totalPointsLabel"),
              totalPoints
            )}
            {bullet(
              <EmojiEventsIcon />,
              t("stats.cards.ppm.winsLabel"),
              outcomeCounts.win
            )}
            {bullet(
              <RemoveCircleOutlineIcon />,
              t("stats.cards.ppm.drawsLabel"),
              outcomeCounts.draw
            )}
            {bullet(
              <CancelIcon />,
              t("stats.cards.ppm.lossesLabel"),
              outcomeCounts.loss
            )}
          </InfoCard>
        </Box>
      </TabPanel>
    </Box>
  );
};

export default StatsPage;
