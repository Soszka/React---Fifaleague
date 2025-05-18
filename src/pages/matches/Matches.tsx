import React, { useMemo, useState } from "react";
import {
  Autocomplete,
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
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import Title from "../../common/UI/Title";
import { useAllMatches } from "../../common/hooks/useAllMatches";
import styles from "./matches.module.scss";

const MotionRow = motion(TableRow, { forwardMotionProps: true });
const MotionButton = motion(Button);
const FILTER_WIDTH = 220;

type Order = "asc" | "desc";
type ResultOption = "WIN" | "LOSS" | "DRAW";
type FilterResultOption = ResultOption | "";

interface RowData {
  team: string;
  rival: string;
  score: string;
  outcome: ResultOption;
  date: number;
}

const getOutcome = (score: string): ResultOption => {
  const [g1, g2] = score.split(":").map((n) => parseInt(n.trim(), 10));
  if (g1 === g2) return "DRAW";
  return g1 > g2 ? "WIN" : "LOSS";
};

const formatScore = (raw: string): string => {
  const [h, a] = raw.split(":").map((n) => n.trim());
  return `${h} : ${a}`;
};

const MatchesTable: React.FC = () => {
  const { matches, loading, error } = useAllMatches();
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const currentUser = "Bartek";

  const [showAll, setShowAll] = useState<boolean>(false);
  const [rivalFilter, setRivalFilter] = useState<string | null>(null);
  const [resultFilter, setResultFilter] = useState<FilterResultOption>("");
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);
  const [orderBy, setOrderBy] = useState<keyof RowData>("date");
  const [order, setOrder] = useState<Order>("desc");
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  const earliestDate = useMemo(() => {
    if (matches.length === 0) return null;
    return dayjs(Math.min(...matches.map((m) => m.date)));
  }, [matches]);

  const latestDate = useMemo(() => {
    if (matches.length === 0) return null;
    return dayjs(Math.max(...matches.map((m) => m.date)));
  }, [matches]);

  const uniqueTeams = useMemo(() => {
    const set = new Set<string>();
    matches.forEach((m) => {
      set.add(m.team1);
      set.add(m.team2);
    });
    return Array.from(set).sort();
  }, [matches]);

  const buildRows = useMemo<RowData[]>(() => {
    return matches
      .map<RowData>((m) => {
        const userInTeam1 = m.team1.includes(currentUser);
        const userInTeam2 = m.team2.includes(currentUser);

        let team = m.team1;
        let rival = m.team2;
        let score = formatScore(m.score);

        if (!showAll && userInTeam2 && !userInTeam1) {
          team = m.team2;
          rival = m.team1;
          const [g1, g2] = m.score.split(":").map((n) => n.trim());
          score = formatScore(`${g2}:${g1}`);
        }

        const outcome = getOutcome(score);

        return { team, rival, score, outcome, date: m.date };
      })
      .filter((row) => {
        if (!showAll) {
          const userPlays =
            row.team.includes(currentUser) || row.rival.includes(currentUser);
          if (!userPlays) return false;
        }
        if (
          rivalFilter &&
          !(row.team === rivalFilter || row.rival === rivalFilter)
        )
          return false;
        if (resultFilter && row.outcome !== resultFilter) return false;
        if (dateFrom && row.date < dateFrom.valueOf()) return false;
        if (dateTo && row.date > dateTo.valueOf()) return false;
        return true;
      });
  }, [
    matches,
    showAll,
    currentUser,
    rivalFilter,
    resultFilter,
    dateFrom,
    dateTo,
  ]);

  const sortedRows = useMemo(() => {
    return [...buildRows].sort((a, b) => {
      const A = a[orderBy];
      const B = b[orderBy];
      if (A < B) return order === "asc" ? -1 : 1;
      if (A > B) return order === "asc" ? 1 : -1;
      return 0;
    });
  }, [buildRows, orderBy, order]);

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, page, rowsPerPage]);

  const resultColor = (r: ResultOption) => {
    if (isDark) {
      if (r === "WIN") return theme.palette.success.light;
      if (r === "LOSS") return theme.palette.error.light;
      return theme.palette.warning.light;
    }
    if (r === "WIN") return theme.palette.success.main;
    if (r === "LOSS") return theme.palette.error.main;
    return theme.palette.warning.main;
  };

  const outcomeLabel = (r: ResultOption) =>
    r === "WIN"
      ? t("matches.outcome.win")
      : r === "LOSS"
      ? t("matches.outcome.loss")
      : t("matches.outcome.draw");

  return (
    <Box sx={{ mx: "auto", maxWidth: 1800, px: { xs: 2, md: 4 }, mt: 4 }}>
      <Title
        title={t("matches.title") as string}
        subtitle={t("matches.subtitle") as string}
      />
      <Paper
        elevation={4}
        className={styles.container}
        sx={{ p: { xs: 2, md: 3 }, mt: 2 }}
      >
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "center",
            mb: 3,
          }}
        >
          <MotionButton
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 3, repeat: Infinity }}
            onClick={() => setShowAll(!showAll)}
            variant="outlined"
            size="small"
            sx={{
              px: 2,
              backgroundColor: "white",
              color: "black",
              borderWidth: 2,
              borderStyle: "solid",
              ":hover": { backgroundColor: "#f5f5f5" },
            }}
          >
            {showAll
              ? t("matches.filters.myMatches")
              : t("matches.filters.allMatches")}
          </MotionButton>

          <Autocomplete
            value={rivalFilter}
            onChange={(_, v) => setRivalFilter(v)}
            options={uniqueTeams}
            sx={{ width: FILTER_WIDTH }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t("matches.filters.team") as string}
                size="small"
              />
            )}
            clearOnEscape
          />

          <FormControl size="small" sx={{ width: FILTER_WIDTH }}>
            <InputLabel>{t("matches.filters.result")}</InputLabel>
            <Select
              value={resultFilter}
              label={t("matches.filters.result")}
              onChange={(e) =>
                setResultFilter(e.target.value as FilterResultOption)
              }
            >
              <MenuItem value="">{t("matches.filters.none")}</MenuItem>
              <MenuItem value="WIN">{t("matches.outcome.win")}</MenuItem>
              <MenuItem value="LOSS">{t("matches.outcome.loss")}</MenuItem>
              <MenuItem value="DRAW">{t("matches.outcome.draw")}</MenuItem>
            </Select>
          </FormControl>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label={t("matches.filters.from")}
              value={dateFrom}
              minDate={earliestDate || undefined}
              maxDate={dateTo || latestDate || undefined}
              onChange={(v) => {
                setDateFrom(v);
                if (dateTo && v && v.isAfter(dateTo)) setDateTo(v);
              }}
              slotProps={{
                textField: { size: "small", sx: { width: FILTER_WIDTH } },
              }}
            />
            <DatePicker
              label={t("matches.filters.to")}
              value={dateTo}
              minDate={dateFrom || earliestDate || undefined}
              maxDate={latestDate || undefined}
              onChange={(v) => {
                setDateTo(v);
                if (dateFrom && v && v.isBefore(dateFrom)) setDateFrom(v);
              }}
              slotProps={{
                textField: { size: "small", sx: { width: FILTER_WIDTH } },
              }}
            />
          </LocalizationProvider>

          <Button
            onClick={() => {
              setRivalFilter(null);
              setResultFilter("");
              setDateFrom(null);
              setDateTo(null);
            }}
            variant="contained"
            size="small"
            sx={{ minWidth: "auto", px: 2 }}
          >
            {t("matches.filters.clear")}
          </Button>

          <MotionButton
            whileTap={{ scale: 0.95 }}
            variant="contained"
            size="small"
            sx={{
              minWidth: "auto",
              px: 2,
              background: "linear-gradient(135deg, #9e9e9e 0%, #bdbdbd 100%)",
              color: "black",
              boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
              transition: "background 0.3s ease",
              ":hover": {
                background: "linear-gradient(135deg, #bdbdbd 0%, #e0e0e0 100%)",
              },
            }}
          >
            {t("matches.actions.add")}
          </MotionButton>
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
                  {Array.from({ length: 4 }).map((_, i) => (
                    <TableCell key={i}>
                      <Skeleton variant="text" width="80%" />
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.from({ length: 8 }).map((_, r) => (
                  <TableRow key={r}>
                    {Array.from({ length: 4 }).map((_, c) => (
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
            {t("matches.messages.error")}: {error.message}
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
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "team"}
                      direction={orderBy === "team" ? order : "asc"}
                      onClick={() => {
                        const isAsc = orderBy === "team" && order === "asc";
                        setOrder(isAsc ? "desc" : "asc");
                        setOrderBy("team");
                      }}
                    >
                      {t("matches.table.team")}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "rival"}
                      direction={orderBy === "rival" ? order : "asc"}
                      onClick={() => {
                        const isAsc = orderBy === "rival" && order === "asc";
                        setOrder(isAsc ? "desc" : "asc");
                        setOrderBy("rival");
                      }}
                    >
                      {t("matches.table.rival")}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "outcome"}
                      direction={orderBy === "outcome" ? order : "asc"}
                      onClick={() => {
                        const isAsc = orderBy === "outcome" && order === "asc";
                        setOrder(isAsc ? "desc" : "asc");
                        setOrderBy("outcome");
                      }}
                    >
                      {t("matches.table.result")}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "date"}
                      direction={orderBy === "date" ? order : "asc"}
                      onClick={() => {
                        const isAsc = orderBy === "date" && order === "asc";
                        setOrder(isAsc ? "desc" : "asc");
                        setOrderBy("date");
                      }}
                    >
                      {t("matches.table.date")}
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRows.map((row, idx) => (
                  <MotionRow
                    key={`${row.team}-${row.date}-${idx}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <TableCell
                      sx={{ fontSize: { xs: "0.95rem", md: "1.05rem" } }}
                    >
                      {row.team}
                    </TableCell>
                    <TableCell
                      sx={{ fontSize: { xs: "0.95rem", md: "1.05rem" } }}
                    >
                      {row.rival}
                    </TableCell>
                    <TableCell sx={{ display: "flex", alignItems: "center" }}>
                      <Typography
                        component="span"
                        sx={{ mr: !showAll ? 1 : 0 }}
                      >
                        {row.score}
                      </Typography>
                      {!showAll && (
                        <Box
                          component="span"
                          sx={{
                            px: 1.5,
                            py: 0.25,
                            borderRadius: 1,
                            backgroundColor: resultColor(row.outcome),
                            color: "white",
                            fontWeight: 600,
                          }}
                        >
                          {outcomeLabel(row.outcome)}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(row.date).toLocaleDateString()}
                    </TableCell>
                  </MotionRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={sortedRows.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage={t("matches.pagination.rowsPerPage")}
            />
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default MatchesTable;
