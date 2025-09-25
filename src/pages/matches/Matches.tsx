import React, { useMemo, useState } from "react";
import { Box, Paper, useTheme, useMediaQuery } from "@mui/material";
import { useTranslation } from "react-i18next";
import dayjs, { Dayjs } from "dayjs";
import Title from "../../common/UI/Title";
import MatchesFilters from "./components/MatchesFilters";
import MatchTableDesktop from "./components/MatchesTableDesktop";
import MatchListMobile from "./components/MatchesMobile";
import { Order, FilterResultOption, ResultOption, RowData } from "./types";
import styles from "./matches.module.scss";
import AddMatchDialog from "./metches-dialogs/AddMetchDialog";
import EditMatchDialog from "./metches-dialogs/EditMetchDialog";
import RemoveMatchDialog from "./metches-dialogs/RemoveMatchDialog";
import {
  MatchesProvider,
  useMatches,
  Match,
} from "../../common/context/MatchesContext";
import { NotificationProvider } from "../../common/context/NotificationContext";
import { useAuth } from "../../common/context/AuthContext";
import {
  stripDiacritics,
  restoreDiacritics,
} from "../../common/utils/nameUtils";

const normalizeTeam = (a: string, b: string) => [a, b].sort().join(" & ");
const splitScore = (score: string): [string, string] => {
  const [first = "", second = ""] = score
    .split(/[:\-]/)
    .map((part) => part.trim());

  return [first, second];
};

const formatScore = (score: string, invert = false) => {
  const [first, second] = splitScore(score);

  if (!first || !second) {
    return score;
  }

  const [left, right] = invert ? [second, first] : [first, second];

  return `${left} : ${right}`;
};

const getOutcome = (score: string): ResultOption => {
  const [g1Raw, g2Raw] = splitScore(score);
  const g1 = parseInt(g1Raw, 10);
  const g2 = parseInt(g2Raw, 10);

  if (Number.isNaN(g1) || Number.isNaN(g2)) {
    return "DRAW";
  }

  if (g1 === g2) return "DRAW";
  return g1 > g2 ? "WIN" : "LOSS";
};
const normalize = (s: string) => stripDiacritics(s).toLowerCase();
const eq = (a = "", b = "") => normalize(a) === normalize(b);

const MatchesScreen: React.FC = () => {
  const { matches, loading, error } = useMatches();
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { user } = useAuth();
  const emailName = user?.email?.split("@")[0] || "";
  const currentUserDisplay = restoreDiacritics(emailName);
  const currentUserKey = normalize(currentUserDisplay);

  const [showAll, setShowAll] = useState(false);
  const [rivalFilter, setRivalFilter] = useState<string | null>(null);
  const [resultFilter, setResultFilter] = useState<FilterResultOption>("");
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);
  const [orderBy, setOrderBy] = useState<keyof RowData>("date");
  const [order, setOrder] = useState<Order>("desc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [matchToEdit, setMatchToEdit] = useState<Match | null>(null);
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);

  const earliestDate = useMemo(
    () =>
      matches.length ? dayjs(Math.min(...matches.map((m) => m.date))) : null,
    [matches]
  );
  const latestDate = useMemo(
    () =>
      matches.length ? dayjs(Math.max(...matches.map((m) => m.date))) : null,
    [matches]
  );

  const uniqueTeams = useMemo(() => {
    const set = new Set<string>();
    matches.forEach((m) => {
      set.add(normalizeTeam(m.player1, m.player2));
      set.add(normalizeTeam(m.rival1, m.rival2));
    });
    return [...set].sort();
  }, [matches]);

  const buildRows = useMemo<RowData[]>(() => {
    return matches
      .map<RowData>((m) => {
        const team1 = normalizeTeam(m.player1, m.player2);
        const team2 = normalizeTeam(m.rival1, m.rival2);

        const userInTeam1 = normalize(team1).includes(currentUserKey);
        const userInTeam2 = normalize(team2).includes(currentUserKey);

        let team = team1;
        let rival = team2;
        const shouldInvert = !showAll && userInTeam2 && !userInTeam1;

        if (shouldInvert) {
          team = team2;
          rival = team1;
        }

        const score = formatScore(m.result, shouldInvert);

        return {
          id: m.id,
          team,
          rival,
          score,
          outcome: getOutcome(score),
          date: m.date,
        };
      })
      .filter((row) => {
        const rowTeamNorm = normalize(row.team);
        const rowRivalNorm = normalize(row.rival);
        if (
          (!showAll &&
            !rowTeamNorm.includes(currentUserKey) &&
            !rowRivalNorm.includes(currentUserKey)) ||
          (rivalFilter &&
            !eq(row.team, rivalFilter) &&
            !eq(row.rival, rivalFilter)) ||
          (resultFilter && row.outcome !== resultFilter) ||
          (dateFrom && row.date < dateFrom.valueOf()) ||
          (dateTo && row.date > dateTo.valueOf())
        ) {
          return false;
        }
        return true;
      });
  }, [
    matches,
    showAll,
    rivalFilter,
    resultFilter,
    dateFrom,
    dateTo,
    currentUserKey,
  ]);

  const sortedRows = useMemo(() => {
    const rows = [...buildRows].sort((a, b) => {
      const A = a[orderBy];
      const B = b[orderBy];
      if (A < B) return order === "asc" ? -1 : 1;
      if (A > B) return order === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [buildRows, orderBy, order]);

  const paginatedRows = useMemo(() => {
    if (rowsPerPage === -1) return sortedRows;
    return sortedRows.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [sortedRows, page, rowsPerPage]);

  const handleSortChange = (col: keyof RowData) => {
    const isAsc = orderBy === col && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(col);
  };

  const clearFilters = () => {
    setRivalFilter(null);
    setResultFilter("");
    setDateFrom(null);
    setDateTo(null);
  };

  const handleEdit = (id: string) => {
    const match = matches.find((m) => m.id === id) || null;
    setMatchToEdit(match);
    setOpenEditDialog(true);
  };

  const handleDelete = (id: string) => {
    const match = matches.find((m) => m.id === id) || null;
    setMatchToDelete(match);
    setOpenDeleteDialog(true);
  };

  return (
    <Box
      sx={{
        mx: "auto",
        maxWidth: 1800,
        px: { xs: 2, md: 4 },
        mt: { xs: 1.875, md: 4 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Title
          title={t("matches.title") as string}
          subtitle={
            t("matches.subtitle", { player: currentUserDisplay }) as string
          }
        />
      </Box>
      <Paper
        elevation={4}
        className={styles.container}
        sx={{ p: { xs: 2, md: 3 }, mt: 2 }}
      >
        <MatchesFilters
          isMobile={isMobile}
          showAll={showAll}
          onToggleShowAll={() => setShowAll(!showAll)}
          rivalFilter={rivalFilter}
          onRivalFilterChange={setRivalFilter}
          resultFilter={resultFilter}
          onResultFilterChange={setResultFilter}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          earliestDate={earliestDate}
          latestDate={latestDate}
          uniqueTeams={uniqueTeams}
          onClearFilters={clearFilters}
          onAddMatch={() => setOpenAddDialog(true)}
        />
        {isMobile ? (
          <MatchListMobile
            rows={paginatedRows}
            loading={loading}
            error={error}
            page={page}
            onPageChange={setPage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={setRowsPerPage}
          totalRows={sortedRows.length}
          showAll={showAll}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ) : (
        <MatchTableDesktop
            rows={paginatedRows}
            loading={loading}
            error={error}
            orderBy={orderBy}
            order={order}
            onSortChange={handleSortChange}
            page={page}
            onPageChange={setPage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={setRowsPerPage}
          totalRows={sortedRows.length}
          showAll={showAll}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
      </Paper>
      <AddMatchDialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
      />
      <EditMatchDialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        match={matchToEdit}
      />
      <RemoveMatchDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        match={matchToDelete}
      />
    </Box>
  );
};

const Matches: React.FC = () => (
  <NotificationProvider>
    <MatchesProvider>
      <MatchesScreen />
    </MatchesProvider>
  </NotificationProvider>
);

export default Matches;
