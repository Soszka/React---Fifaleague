import React from "react";
import {
  Box,
  Card,
  CardActions,
  CardContent,
  IconButton,
  Paper,
  Skeleton,
  TablePagination,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ResultOption, RowData } from "../types";

const MotionCard = motion.div;

interface Props {
  rows: RowData[];
  loading: boolean;
  error: Error | null;
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

const MatchListMobile: React.FC<Props> = ({
  rows,
  loading,
  error,
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
    <Paper elevation={0}>
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} sx={{ mb: 2 }}>
            <CardContent>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="text" width="30%" />
              <Skeleton variant="text" width="50%" />
            </CardContent>
          </Card>
        ))
      ) : error ? (
        <Typography color="error" align="center" sx={{ my: 4 }}>
          {t("matches.messages.error")}: {error.message}
        </Typography>
      ) : (
        rows.map((row) => (
          <MotionCard
            key={row.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card sx={{ mb: 2, position: "relative" }}>
              {!showAll && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    px: 1.5,
                    py: 0.25,
                    borderRadius: 1,
                    backgroundColor: resultColor(row.outcome),
                    color: theme.palette.getContrastText(
                      resultColor(row.outcome)
                    ),
                    fontWeight: 600,
                    fontSize: "0.75rem",
                  }}
                >
                  {outcomeLabel(row.outcome)}
                </Box>
              )}
              <CardContent sx={{ pt: 4, pb: 0.5 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {t("matches.card.players")}:{" "}
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {row.team}
                  </Box>
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {t("matches.card.rival")}:{" "}
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {row.rival}
                  </Box>
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {t("matches.card.score")}:{" "}
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {row.score}
                  </Box>
                </Typography>
                <Typography variant="body2">
                  {t("matches.card.date")}:{" "}
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {new Date(row.date).toLocaleDateString()}
                  </Box>
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: "flex-end", pt: 0, pb: 0.5 }}>
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
              </CardActions>
            </Card>
          </MotionCard>
        ))
      )}

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
    </Paper>
  );
};

export default MatchListMobile;
