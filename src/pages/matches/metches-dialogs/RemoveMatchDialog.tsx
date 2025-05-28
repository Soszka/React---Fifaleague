import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useMatches, Match } from "../../../common/context/MatchesContext";

interface RemoveMatchDialogProps {
  open: boolean;
  onClose: () => void;
  match: Match | null;
}

const RemoveMatchDialog: React.FC<RemoveMatchDialogProps> = ({
  open,
  onClose,
  match,
}) => {
  const { t } = useTranslation();
  const { removeMatch } = useMatches();

  const handleConfirm = () => {
    if (match) {
      removeMatch(match.id);
    }
    onClose();
  };

  // Compose a confirmation message (e.g., "Delete TeamA vs TeamB on Date?")
  let confirmMessage = "";
  if (match) {
    const teamA = `${match.player1} & ${match.player2}`;
    const teamB = `${match.rival1} & ${match.rival2}`;
    const dateStr = new Date(match.date).toLocaleDateString();
    confirmMessage =
      t("matches.dialogs.deleteConfirm", {
        team1: teamA,
        team2: teamB,
        date: dateStr,
      }) ||
      `${t("matches.dialogs.deleteMatch")} ${teamA} vs ${teamB} (${dateStr})?`;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs">
      <DialogTitle>{t("matches.dialogs.deleteMatch")}</DialogTitle>
      <DialogContent>
        <Typography>{confirmMessage}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("common.cancel") ?? "Cancel"}</Button>
        <Button variant="contained" color="error" onClick={handleConfirm}>
          {t("matches.actions.delete") ?? "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RemoveMatchDialog;
