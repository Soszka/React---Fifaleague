import React from "react";
import {
  Box,
  IconButton,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Order, ResultOption, RowData } from "../types";

const MotionRow = motion(TableRow, { forwardMotionProps: true });

const CELL_SX = { height: 52, py: 0, verticalAlign: "middle" as const };

interface Props {
  rows: RowData[];
  loading: boolean;
  error: Error | null;
  orderBy: keyof RowData;
  order: Order;
  onSortChange: (col: keyof RowData) => void;
  page: number;
  onPageChange: (p: number) => void;
  rowsPerPage: number;
  onRowsPerPageChange: (n: number) => void;
  totalRows: number;
  showAll: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  disableDelete: boolean;
}

const MatchTableDesktop: React.FC<Props> = ({
  rows,
  loading,
  error,
  orderBy,
  order,
  onSortChange,
  page,
  onPageChange,
  rowsPerPage,
  onRowsPerPageChange,
  totalRows,
  showAll,
  onEdit,
  onDelete,
  disableDelete,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

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
    <>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ overflow: "hidden" }}
      >
        {loading ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableCell key={i} sx={CELL_SX}>
                    <Skeleton variant="text" width="80%" />
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.from({ length: 8 }).map((_, r) => (
                <TableRow key={r} sx={{ height: 52 }}>
                  {Array.from({ length: 5 }).map((_, c) => (
                    <TableCell key={c} sx={CELL_SX}>
                      <Skeleton variant="text" width="90%" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : !error ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                {(
                  ["team", "rival", "outcome", "date"] as (keyof RowData)[]
                ).map((col) => (
                  <TableCell key={col} sx={CELL_SX}>
                    <TableSortLabel
                      active={orderBy === col}
                      direction={orderBy === col ? order : "asc"}
                      onClick={() => onSortChange(col)}
                    >
                      {t(`matches.table.${col === "outcome" ? "result" : col}`)}
                    </TableSortLabel>
                  </TableCell>
                ))}
                <TableCell align="center" sx={CELL_SX}>
                  {t("matches.table.actions")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <MotionRow
                  key={row.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  whileHover={{ scale: 1.02 }}
                  sx={{ height: 52 }}
                >
                  <TableCell sx={CELL_SX}>{row.team}</TableCell>
                  <TableCell sx={CELL_SX}>{row.rival}</TableCell>
                  <TableCell sx={CELL_SX}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        component="span"
                        sx={{ whiteSpace: "nowrap" }}
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
                            color: theme.palette.getContrastText(
                              resultColor(row.outcome)
                            ),
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {outcomeLabel(row.outcome)}
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={CELL_SX}>
                    {new Date(row.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell sx={CELL_SX} align="center">
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      <Tooltip title={t("matches.actions.edit") as string}>
                        <IconButton
                          size="small"
                          onClick={() => onEdit(row.id)}
                          sx={{
                            color: theme.palette.primary.main,
                            "&:hover": {
                              backgroundColor: theme.palette.action.hover,
                            },
                          }}
                        >
                          <EditIcon fontSize="medium" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t("matches.actions.delete") as string}>
                        <span style={{ display: "inline-flex" }}>
                          <IconButton
                            size="small"
                            onClick={() => onDelete(row.id)}
                            disabled={disableDelete}
                            sx={{
                              color: resultColor("LOSS"),
                              "&:hover": {
                                backgroundColor: theme.palette.action.hover,
                              },
                            }}
                          >
                            <DeleteIcon fontSize="medium" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </MotionRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Typography color="error" align="center" sx={{ my: 4 }}>
            {t("matches.messages.error")}: {error.message}
          </Typography>
        )}
      </TableContainer>

      {!loading && !error && (
        <TablePagination
          component="div"
          count={totalRows}
          page={page}
          onPageChange={(_, p) => onPageChange(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            const value = parseInt(e.target.value, 10);
            onRowsPerPageChange(value);
            onPageChange(0);
          }}
          labelRowsPerPage={t("matches.pagination.rowsPerPage")}
          rowsPerPageOptions={[
            5,
            10,
            25,
            { label: t("matches.pagination.all") as string, value: -1 },
          ]}
        />
      )}
    </>
  );
};

export default MatchTableDesktop;
