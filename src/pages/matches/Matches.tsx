// src/pages/matches/Matches.tsx
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

const normalizeTeam = (a: string, b: string) => [a, b].sort().join(" & ");

const getOutcome = (score: string): ResultOption => {
  const [g1, g2] = score.split(" : ").map((n) => parseInt(n.trim(), 10));
  if (g1 === g2) return "DRAW";
  return g1 > g2 ? "WIN" : "LOSS";
};

const eq = (a = "", b = "") => a.toLowerCase() === b.toLowerCase();

const MatchesScreen: React.FC = () => {
  const { matches, loading, error } = useMatches();
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // aktualnie zalogowany gracz
  const { user } = useAuth();
  const emailName = user?.email?.split("@")[0] || "";
  const currentUserKey = emailName.toLowerCase(); // do porównań
  const currentUserLabel =
    emailName.charAt(0).toUpperCase() + emailName.slice(1).toLowerCase(); // do UI

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

        const userInTeam1 = team1.toLowerCase().includes(currentUserKey);
        const userInTeam2 = team2.toLowerCase().includes(currentUserKey);

        let team = team1;
        let rival = team2;
        let score = m.result.replace("-", " : ");

        if (!showAll && userInTeam2 && !userInTeam1) {
          team = team2;
          rival = team1;
          const [g1, g2] = m.result.split("-");
          score = `${g2.trim()} : ${g1.trim()}`;
        }

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
        if (
          (!showAll &&
            !row.team.toLowerCase().includes(currentUserKey) &&
            !row.rival.toLowerCase().includes(currentUserKey)) ||
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
    <Box sx={{ mx: "auto", maxWidth: 1800, px: { xs: 2, md: 4 }, mt: 4 }}>
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
            t("matches.subtitle", { player: currentUserLabel }) as string
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
