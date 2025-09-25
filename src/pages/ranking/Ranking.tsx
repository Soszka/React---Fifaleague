import React, { useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router-dom";
import Title from "../../common/UI/Title";
import { useAllMatches, MatchUi } from "../../common/hooks/useAllMatches";
import { PLAYER_LABELS } from "../../common/constants/players";
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

const FilterSelect: React.FC<{
  value: string | null;
  onChange: (v: string | null) => void;
  label: string;
  options: readonly string[];
}> = ({ value, onChange, label, options }) => {
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
        <MenuItem value="">{t("ranking.select.none")}</MenuItem>
        {options.map((o) => (
          <MenuItem key={o} value={o}>
            {o}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

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
    const [g1, g2] = m.score.split(":").map((n) => parseInt(n.trim(), 10));
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
  numeric?: boolean;
}[] = [
  { id: "position", label: "ranking.column.position" },
  { id: "player", label: "ranking.column.player" },
  { id: "matches", label: "ranking.column.matches", numeric: true },
  { id: "wins", label: "ranking.column.wins", numeric: true },
  { id: "looses", label: "ranking.column.looses", numeric: true },
  { id: "draws", label: "ranking.column.draws", numeric: true },
  { id: "points", label: "ranking.column.points", numeric: true },
  { id: "pointsPerMatch", label: "ranking.column.ppm", numeric: true },
];

const RankingPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isNavVisible = false } =
    useOutletContext<{ isNavVisible?: boolean }>() ?? {};
  const isMobile = useMediaQuery(
    isNavVisible ? "(max-width:1140px)" : theme.breakpoints.down("md")
  );
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
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const handleClearFilters = () => {
    setPlayerFilter(null);
    setMatchesFilter(null);
    setPointsFilter(null);
    setPpmFilter(null);
    setPage(0);
  };
  const medalColor = (pos?: number) => {
    if (pos === 1) return "#D4AF37";
    if (pos === 2) return "#C0C0C0";
    if (pos === 3) return "#CD7F32";
    return theme.palette.text.primary;
  };
  const uniquePlayers = useMemo(() => [...PLAYER_LABELS], []);
  const rangeFilter = (data: PlayerRow[], r: string, key: keyof PlayerRow) => {
    if (r === "100<") return data.filter((d) => (d[key] as number) > 100);
    const [min, max] = r.split("-").map(Number);
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
      {t("ranking.button.clear")}
    </Button>
  );
  return (
    <Box sx={{ mx: "auto", maxWidth: 1800, px: { xs: 2, md: 4 }, mt: { xs: 1.875, md: 4 } }}>
      <Title title={t("ranking.title")} subtitle={t("ranking.subtitle")} />
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
              label={t("ranking.select.player")}
              options={uniquePlayers}
            />
            <FilterSelect
              value={matchesFilter}
              onChange={setMatchesFilter}
              label={t("ranking.select.matches")}
              options={MATCH_OPTIONS}
            />
            <FilterSelect
              value={pointsFilter}
              onChange={setPointsFilter}
              label={t("ranking.select.points")}
              options={POINTS_OPTIONS}
            />
            <FilterSelect
              value={ppmFilter}
              onChange={setPpmFilter}
              label={t("ranking.select.ppm")}
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
              {t("ranking.button.filter")}
            </Button>
            <Dialog
              open={filterDialogOpen}
              onClose={() => setFilterDialogOpen(false)}
              fullWidth
            >
              <DialogTitle>{t("ranking.filterDialog.title")}</DialogTitle>
              <DialogContent sx={{ pt: 2, pb: 1 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <FilterSelect
                    value={playerFilter}
                    onChange={setPlayerFilter}
                    label={t("ranking.select.player")}
                    options={uniquePlayers}
                  />
                  <FilterSelect
                    value={matchesFilter}
                    onChange={setMatchesFilter}
                    label={t("ranking.select.matches")}
                    options={MATCH_OPTIONS}
                  />
                  <FilterSelect
                    value={pointsFilter}
                    onChange={setPointsFilter}
                    label={t("ranking.select.points")}
                    options={POINTS_OPTIONS}
                  />
                  <FilterSelect
                    value={ppmFilter}
                    onChange={setPpmFilter}
                    label={t("ranking.select.ppm")}
                    options={PPM_OPTIONS}
                  />
                  {ClearButton}
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setFilterDialogOpen(false)}>
                  {t("ranking.filterDialog.close")}
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )}
        {loading && !isMobile && (
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
        {loading && isMobile && (
          <Box>
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} sx={{ mb: 2 }}>
                <CardContent>
                  <Skeleton variant="text" width="50%" />
                  <Skeleton variant="text" width="30%" />
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="text" width="35%" />
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
        {error && (
          <Typography color="error" align="center" sx={{ my: 4 }}>
            {t("ranking.error")} {error.message}
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
                {paginated.map((player) => (
                  <MotionRow
                    key={`${player.player}-${player.position}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.25 }}
                  >
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        color: medalColor(player.position),
                      }}
                    >
                      {player.position}
                    </TableCell>
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
              labelRowsPerPage={t("ranking.rowsPerPage")}
            />
          </TableContainer>
        )}
        {!loading && !error && isMobile && (
          <>
            {paginated.map((player) => (
              <motion.div
                key={`${player.player}-${player.position}`}
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
                      backgroundColor: medalColor(player.position),
                      color: theme.palette.getContrastText(
                        medalColor(player.position)
                      ),
                      fontWeight: 600,
                    }}
                  >
                    {player.position}
                  </Box>
                  <CardContent>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, mb: 1, fontSize: "1.4rem" }}
                    >
                      {player.player}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {t("card.matches")}:{" "}
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        {player.matches}
                      </Box>
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {t("card.wins")}:{" "}
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        {player.wins}
                      </Box>
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {t("card.losses")}:{" "}
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        {player.looses}
                      </Box>
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {t("card.draws")}:{" "}
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        {player.draws}
                      </Box>
                    </Typography>
                    <Typography variant="body2">
                      {t("card.ppm")}:{" "}
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        {player.pointsPerMatch.toFixed(2)}
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
              labelRowsPerPage={t("ranking.rowsPerPage")}
            />
          </>
        )}
      </Paper>
    </Box>
  );
};

export default RankingPage;
