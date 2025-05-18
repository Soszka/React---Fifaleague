import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import Title from "../../common/UI/Title";
import { useAllMatches, MatchUi } from "../../common/hooks/useAllMatches";
import styles from "./ranking.module.scss";

export interface PlayerRow {
  position?: number;
  player: string;
  matches: number;
  wins: number;
  looses: number;
  draws: number;
  points: number;
  pointsPerMatch: number;
}

type Order = "asc" | "desc";

const MATCH_OPTIONS = [
  "0-10",
  "10-20",
  "20-30",
  "30-40",
  "40-50",
  "50-60",
  "60-70",
  "70-80",
  "80-90",
  "90-100",
  "100<",
];
const POINTS_OPTIONS = MATCH_OPTIONS;
const PPM_OPTIONS = ["0-1", "1-2", "2-3"];

const MotionRow = motion(TableRow, { forwardMotionProps: true });

const FilterSelect = ({
  value,
  onChange,
  label,
  options,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  label: string;
  options: readonly string[];
}) => (
  <FormControl size="small" sx={{ minWidth: 180 }}>
    <InputLabel>{label}</InputLabel>
    <Select
      label={label}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
    >
      <MenuItem value="">Brak</MenuItem>
      {options.map((o) => (
        <MenuItem key={o} value={o}>
          {o}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

const buildPlayersStats = (matches: MatchUi[]): PlayerRow[] => {
  const map = new Map<string, PlayerRow>();
  const add = (player: string, result: "win" | "loss" | "draw") => {
    if (!map.has(player))
      map.set(player, {
        player,
        matches: 0,
        wins: 0,
        looses: 0,
        draws: 0,
        points: 0,
        pointsPerMatch: 0,
      });
    const p = map.get(player)!;
    p.matches += 1;
    if (result === "win") {
      p.wins += 1;
      p.points += 3;
    } else if (result === "draw") {
      p.draws += 1;
      p.points += 1;
    } else {
      p.looses += 1;
    }
  };

  matches.forEach((m) => {
    const [g1, g2] = m.score
      .split(":" as const)
      .map((n) => parseInt(n.trim(), 10));
    const result = g1 === g2 ? "draw" : g1 > g2 ? "team1Win" : "team2Win";

    const team1Players = m.team1.split("&").map((p) => p.trim());
    const team2Players = m.team2.split("&").map((p) => p.trim());

    team1Players.forEach((player) =>
      add(
        player,
        result === "team1Win" ? "win" : result === "draw" ? "draw" : "loss"
      )
    );
    team2Players.forEach((player) =>
      add(
        player,
        result === "team2Win" ? "win" : result === "draw" ? "draw" : "loss"
      )
    );
  });

  const arr = Array.from(map.values());
  arr.forEach((p) => (p.pointsPerMatch = p.points / p.matches));
  return arr;
};

const columns: {
  id: keyof PlayerRow | "position";
  label: string;
  labelFallback: string;
  numeric?: boolean;
}[] = [
  { id: "position", label: "table.column.position", labelFallback: "Lp." },
  { id: "player", label: "table.column.player", labelFallback: "Gracz" },
  {
    id: "matches",
    label: "table.column.matches",
    labelFallback: "Mecze",
    numeric: true,
  },
  {
    id: "wins",
    label: "table.column.wins",
    labelFallback: "Wygrane",
    numeric: true,
  },
  {
    id: "looses",
    label: "table.column.looses",
    labelFallback: "Porażki",
    numeric: true,
  },
  {
    id: "draws",
    label: "table.column.draws",
    labelFallback: "Remisy",
    numeric: true,
  },
  {
    id: "points",
    label: "table.column.points",
    labelFallback: "Pkt",
    numeric: true,
  },
  {
    id: "pointsPerMatch",
    label: "table.column.ppm",
    labelFallback: "Pkt/Mecz",
    numeric: true,
  },
];

const RankingPage: React.FC = () => {
  const { t } = useTranslation();
  const { matches, loading, error } = useAllMatches();
  const players = useMemo(() => buildPlayersStats(matches), [matches]);

  const [playerFilter, setPlayerFilter] = useState<string | null>(null);
  const [matchesFilter, setMatchesFilter] = useState<string | null>(null);
  const [pointsFilter, setPointsFilter] = useState<string | null>(null);
  const [ppmFilter, setPpmFilter] = useState<string | null>(null);
  const [orderBy, setOrderBy] = useState<keyof PlayerRow>("pointsPerMatch");
  const [order, setOrder] = useState<Order>("desc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const uniquePlayers = useMemo(
    () => players.map((p) => p.player).sort(),
    [players]
  );

  const rangeFilter = (data: PlayerRow[], r: string, key: keyof PlayerRow) => {
    if (r === "100<") return data.filter((d) => (d[key] as number) > 100);
    const [min, max] = r.split("-" as const).map(Number);
    return data.filter((d) => {
      const v = d[key] as number;
      return v >= min && v <= max;
    });
  };

  const applyFilters = (data: PlayerRow[]) => {
    let out = [...data];
    if (playerFilter) out = out.filter((p) => p.player === playerFilter);
    if (matchesFilter) out = rangeFilter(out, matchesFilter, "matches");
    if (pointsFilter) out = rangeFilter(out, pointsFilter, "points");
    if (ppmFilter) out = rangeFilter(out, ppmFilter, "pointsPerMatch");
    return out;
  };

  const sortData = (data: PlayerRow[]) =>
    [...data].sort((a, b) => {
      const A = a[orderBy] as number | string;
      const B = b[orderBy] as number | string;
      if (A < B) return order === "asc" ? -1 : 1;
      if (A > B) return order === "asc" ? 1 : -1;
      return 0;
    });

  const processed = useMemo(() => {
    const filtered = applyFilters(players);
    const sorted = sortData(filtered);
    return sorted.map((p, i) => ({ ...p, position: i + 1 }));
  }, [
    players,
    playerFilter,
    matchesFilter,
    pointsFilter,
    ppmFilter,
    orderBy,
    order,
  ]);

  const paginated = useMemo(() => {
    const start = page * rowsPerPage;
    return processed.slice(start, start + rowsPerPage);
  }, [processed, page, rowsPerPage]);

  const handleSort = (prop: keyof PlayerRow | "position") => {
    const isAsc = orderBy === prop && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(prop as keyof PlayerRow);
  };

  const clearFilters = () => {
    setPlayerFilter(null);
    setMatchesFilter(null);
    setPointsFilter(null);
    setPpmFilter(null);
  };

  return (
    <Box sx={{ mx: "auto", maxWidth: 1800, px: { xs: 2, md: 4 }, mt: 4 }}>
      <Title
        title={t("playerTable.title", "Graczy")}
        subtitle={t("playerTable.subtitle", "Sprawdź ranking ...")}
      />
      <Paper
        elevation={4}
        className={styles.container}
        sx={{ p: { xs: 2, md: 3 }, mt: 2 }}
      >
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 3 }}>
          <FilterSelect
            value={playerFilter}
            onChange={setPlayerFilter}
            label={t("table.select.player", "Gracz")}
            options={uniquePlayers}
          />
          <FilterSelect
            value={matchesFilter}
            onChange={setMatchesFilter}
            label={t("table.select.matches", "Mecze")}
            options={MATCH_OPTIONS}
          />
          <FilterSelect
            value={pointsFilter}
            onChange={setPointsFilter}
            label={t("table.select.points", "Punkty")}
            options={POINTS_OPTIONS}
          />
          <FilterSelect
            value={ppmFilter}
            onChange={setPpmFilter}
            label={t("table.select.ppm", "Pkt/Mecz")}
            options={PPM_OPTIONS}
          />
          <Button
            onClick={clearFilters}
            variant="contained"
            size="small"
            sx={{
              minWidth: "auto",
              px: 2,
              backgroundColor: (theme) =>
                theme.palette.mode === "light" ? "black" : "white",
              color: (theme) =>
                theme.palette.mode === "light" ? "white" : "black",
              "&:hover": {
                backgroundColor: (theme) =>
                  theme.palette.mode === "light" ? "#333333" : "#e0e0e0",
              },
            }}
          >
            {t("table.clear", "Wyczyść")}
          </Button>
        </Box>
        {loading && (
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ overflow: "hidden" }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  {columns.map((col) => (
                    <TableCell
                      key={col.id}
                      align={col.numeric ? "right" : "left"}
                    >
                      <Skeleton variant="text" width="80%" />
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.from({ length: 8 }).map((_, r) => (
                  <TableRow key={r}>
                    {columns.map((_, c) => (
                      <TableCell key={c}>
                        <Skeleton variant="text" width="90%" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {error && (
          <Typography color="error" align="center" sx={{ my: 4 }}>
            Błąd: {error.message}
          </Typography>
        )}
        {!loading && !error && (
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ overflow: "hidden" }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  {columns.map((col) => (
                    <TableCell
                      key={col.id}
                      align={col.numeric ? "right" : "left"}
                    >
                      <TableSortLabel
                        active={orderBy === col.id}
                        direction={orderBy === col.id ? order : "asc"}
                        onClick={() => handleSort(col.id)}
                      >
                        {t(col.label, col.labelFallback)}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((player) => (
                  <MotionRow
                    key={`${player.player}-${player.position}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.25 }}
                  >
                    <TableCell>{player.position}</TableCell>
                    <TableCell
                      sx={{ fontSize: { xs: "0.95rem", md: "1.05rem" } }}
                    >
                      {player.player}
                    </TableCell>
                    <TableCell align="right">{player.matches}</TableCell>
                    <TableCell align="right">{player.wins}</TableCell>
                    <TableCell align="right">{player.looses}</TableCell>
                    <TableCell align="right">{player.draws}</TableCell>
                    <TableCell align="right">{player.points}</TableCell>
                    <TableCell align="right">
                      {player.pointsPerMatch.toFixed(2)}
                    </TableCell>
                  </MotionRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={processed.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage={t("table.rowsPerPage", "Wierszy na stronę:")}
            />
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default RankingPage;
