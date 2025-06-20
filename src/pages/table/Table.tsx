import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router-dom";
import Title from "../../common/UI/Title";
import { useAllMatches, MatchUi } from "../../common/hooks/useAllMatches";
import styles from "./table.module.scss";

export interface Team {
  position?: number;
  players: string;
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
}) => {
  const { t } = useTranslation();
  return (
    <FormControl
      size="small"
      sx={{ minWidth: 180, width: { xs: "100%", md: "auto" } }}
    >
      <InputLabel>{label}</InputLabel>
      <Select
        label={label}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <MenuItem value="">{t("common.none")}</MenuItem>
        {options.map((o) => (
          <MenuItem key={o} value={o}>
            {o}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

const buildTeamsStats = (matches: MatchUi[]): Team[] => {
  const map = new Map<string, Team>();
  const normalizeTeam = (team: string) =>
    team
      .split("&")
      .map((p) => p.trim())
      .sort((a, b) => a.localeCompare(b))
      .join(" & ");
  matches.forEach((m) => {
    const team1 = normalizeTeam(m.team1);
    const team2 = normalizeTeam(m.team2);
    const [g1, g2] = m.score.split(":").map((n) => parseInt(n.trim(), 10));
    const res = g1 === g2 ? "draw" : g1 > g2 ? "team1Win" : "team2Win";
    const add = (team: string, r: "win" | "loss" | "draw") => {
      if (!map.has(team))
        map.set(team, {
          players: team,
          matches: 0,
          wins: 0,
          looses: 0,
          draws: 0,
          points: 0,
          pointsPerMatch: 0,
        });
      const t = map.get(team)!;
      t.matches += 1;
      if (r === "win") {
        t.wins += 1;
        t.points += 3;
      } else if (r === "draw") {
        t.draws += 1;
        t.points += 1;
      } else {
        t.looses += 1;
      }
    };
    add(team1, res === "team1Win" ? "win" : res === "draw" ? "draw" : "loss");
    add(team2, res === "team2Win" ? "win" : res === "draw" ? "draw" : "loss");
  });
  const arr = Array.from(map.values());
  arr.forEach((t) => (t.pointsPerMatch = t.points / t.matches));
  return arr;
};

const columns: {
  id: keyof Team | "position";
  label: string;
  numeric?: boolean;
}[] = [
  { id: "position", label: "table.column.position" },
  { id: "players", label: "table.column.team" },
  { id: "matches", label: "table.column.matches", numeric: true },
  { id: "wins", label: "table.column.wins", numeric: true },
  { id: "looses", label: "table.column.looses", numeric: true },
  { id: "draws", label: "table.column.draws", numeric: true },
  { id: "points", label: "table.column.points", numeric: true },
  { id: "pointsPerMatch", label: "table.column.ppm", numeric: true },
];

const TablePage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isNavVisible = false } =
    useOutletContext<{ isNavVisible?: boolean }>() ?? {};
  const isMobile = useMediaQuery(
    isNavVisible ? "(max-width:1040px)" : "(max-width:800px)"
  );
  const { matches, loading, error } = useAllMatches();
  const teams = useMemo(() => buildTeamsStats(matches), [matches]);

  const [playerFilter, setPlayerFilter] = useState<string | null>(null);
  const [matchesFilter, setMatchesFilter] = useState<string | null>(null);
  const [pointsFilter, setPointsFilter] = useState<string | null>(null);
  const [ppmFilter, setPpmFilter] = useState<string | null>(null);
  const [orderBy, setOrderBy] = useState<keyof Team>("pointsPerMatch");
  const [order, setOrder] = useState<Order>("desc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const medalColor = (pos?: number) => {
    if (pos === 1) return "#D4AF37";
    if (pos === 2) return "#C0C0C0";
    if (pos === 3) return "#CD7F32";
    return theme.palette.text.primary;
  };

  const uniquePlayers = useMemo(() => {
    const s = new Set<string>();
    teams.forEach((t) =>
      t.players
        .split("&")
        .map((p) => p.trim())
        .forEach((p) => s.add(p))
    );
    return Array.from(s).sort();
  }, [teams]);

  const rangeFilter = (data: Team[], r: string, key: keyof Team) => {
    if (r === "100<") return data.filter((d) => (d[key] as number) > 100);
    const [min, max] = r.split("-").map(Number);
    return data.filter((d) => {
      const v = d[key] as number;
      return v >= min && v <= max;
    });
  };

  const applyFilters = (data: Team[]) => {
    let out = [...data];
    if (playerFilter) out = out.filter((t) => t.players.includes(playerFilter));
    if (matchesFilter) out = rangeFilter(out, matchesFilter, "matches");
    if (pointsFilter) out = rangeFilter(out, pointsFilter, "points");
    if (ppmFilter) out = rangeFilter(out, ppmFilter, "pointsPerMatch");
    return out;
  };

  const sortData = (data: Team[]) =>
    [...data].sort((a, b) => {
      const A = a[orderBy] as number | string;
      const B = b[orderBy] as number | string;
      if (A < B) return order === "asc" ? -1 : 1;
      if (A > B) return order === "asc" ? 1 : -1;
      return 0;
    });

  const processed = useMemo(() => {
    const filtered = applyFilters(teams);
    const sorted = sortData(filtered);
    return sorted.map((t, i) => ({ ...t, position: i + 1 }));
  }, [
    teams,
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

  const handleSort = (prop: keyof Team | "position") => {
    const isAsc = orderBy === prop && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(prop as keyof Team);
  };

  const handleClearFilters = () => {
    setPlayerFilter(null);
    setMatchesFilter(null);
    setPointsFilter(null);
    setPpmFilter(null);
    setPage(0);
  };

  const ClearButton = (
    <Button
      variant="contained"
      onClick={handleClearFilters}
      sx={{
        backgroundColor: theme.palette.mode === "light" ? "#000" : "#fff",
        color: theme.palette.mode === "light" ? "#fff" : "#000",
        "&:hover": {
          backgroundColor: theme.palette.mode === "light" ? "#000" : "#fff",
        },
        width: { xs: "100%", md: "auto" },
        px: 2,
      }}
    >
      {t("table.button.clear")}
    </Button>
  );

  return (
    <Box sx={{ mx: "auto", maxWidth: 1800, px: { xs: 2, md: 4 }, mt: { xs: 1.875, md: 4 } }}>
      <Title title={t("table.title")} subtitle={t("table.subtitle")} />
      <Paper
        elevation={4}
        className={styles.container}
        sx={{ p: { xs: 2, md: 3 }, mt: 2 }}
      >
        {!isMobile && (
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              flexWrap: "wrap",
              gap: 2,
              alignItems: "center",
              mb: 3,
            }}
          >
            <FilterSelect
              value={playerFilter}
              onChange={setPlayerFilter}
              label={t("table.select.player")}
              options={uniquePlayers}
            />
            <FilterSelect
              value={matchesFilter}
              onChange={setMatchesFilter}
              label={t("table.select.matches")}
              options={MATCH_OPTIONS}
            />
            <FilterSelect
              value={pointsFilter}
              onChange={setPointsFilter}
              label={t("table.select.points")}
              options={POINTS_OPTIONS}
            />
            <FilterSelect
              value={ppmFilter}
              onChange={setPpmFilter}
              label={t("table.select.ppm")}
              options={PPM_OPTIONS}
            />
            {ClearButton}
          </Box>
        )}

        {isMobile && (
          <>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => setFilterDialogOpen(true)}
              sx={{ mb: 2 }}
            >
              {t("table.button.filter")}
            </Button>
            <Dialog
              open={filterDialogOpen}
              onClose={() => setFilterDialogOpen(false)}
              fullWidth
            >
              <DialogTitle>{t("table.filterDialog.title")}</DialogTitle>
              <DialogContent sx={{ pt: 2, pb: 1 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <FilterSelect
                    value={playerFilter}
                    onChange={setPlayerFilter}
                    label={t("table.select.player")}
                    options={uniquePlayers}
                  />
                  <FilterSelect
                    value={matchesFilter}
                    onChange={setMatchesFilter}
                    label={t("table.select.matches")}
                    options={MATCH_OPTIONS}
                  />
                  <FilterSelect
                    value={pointsFilter}
                    onChange={setPointsFilter}
                    label={t("table.select.points")}
                    options={POINTS_OPTIONS}
                  />
                  <FilterSelect
                    value={ppmFilter}
                    onChange={setPpmFilter}
                    label={t("table.select.ppm")}
                    options={PPM_OPTIONS}
                  />
                  {ClearButton}
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setFilterDialogOpen(false)}>
                  {t("table.filterDialog.close")}
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )}

        {loading &&
          (isMobile ? (
            <Box>
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} sx={{ mb: 2 }}>
                  <CardContent>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" />
                    <Skeleton variant="text" width="30%" />
                    <Skeleton variant="text" width="50%" />
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
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
          ))}

        {error && (
          <Typography color="error" align="center" sx={{ my: 4 }}>
            {error.message}
          </Typography>
        )}

        {!loading && !error && !isMobile && (
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
                        {t(col.label)}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((team) => (
                  <MotionRow
                    key={`${team.players}-${team.position}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.25 }}
                  >
                    <TableCell
                      sx={{ fontWeight: 700, color: medalColor(team.position) }}
                    >
                      {team.position}
                    </TableCell>
                    <TableCell
                      sx={{ fontSize: { xs: "0.95rem", md: "1.05rem" } }}
                    >
                      {team.players}
                    </TableCell>
                    <TableCell align="right">{team.matches}</TableCell>
                    <TableCell align="right">{team.wins}</TableCell>
                    <TableCell align="right">{team.looses}</TableCell>
                    <TableCell align="right">{team.draws}</TableCell>
                    <TableCell align="right">{team.points}</TableCell>
                    <TableCell align="right">
                      {team.pointsPerMatch.toFixed(2)}
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
              labelRowsPerPage={t("table.rowsPerPage")}
            />
          </TableContainer>
        )}

        {!loading && !error && isMobile && (
          <>
            {paginated.map((team) => (
              <motion.div
                key={`${team.players}-${team.position}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.25 }}
              >
                <Card sx={{ mb: 2, position: "relative" }}>
                  <Box
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      px: 1.5,
                      py: 0.25,
                      borderRadius: 1,
                      backgroundColor: medalColor(team.position),
                      color: theme.palette.getContrastText(
                        medalColor(team.position)
                      ),
                      fontWeight: 600,
                    }}
                  >
                    {team.position}
                  </Box>
                  <CardContent>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, mb: 1, fontSize: "1.4rem" }}
                    >
                      {team.players}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {t("table.card.matches")}:{" "}
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        {team.matches}
                      </Box>
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {t("table.card.wins")}:{" "}
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        {team.wins}
                      </Box>
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {t("table.card.losses")}:{" "}
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        {team.looses}
                      </Box>
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {t("table.card.draws")}:{" "}
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        {team.draws}
                      </Box>
                    </Typography>
                    <Typography variant="body2">
                      {t("table.card.ppm")}:{" "}
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        {team.pointsPerMatch.toFixed(2)}
                      </Box>
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
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
              labelRowsPerPage={t("table.rowsPerPage")}
            />
          </>
        )}
      </Paper>
    </Box>
  );
};

export default TablePage;
