import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useMatches, Match } from "../../../common/context/MatchesContext";
import { useNotification } from "../../../common/context/NotificationContext";
import { formatDateValue } from "../../../common/utils/dateUtils";

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
  const { notify } = useNotification();

  const handleConfirm = async () => {
    if (!match) {
      onClose();
      return;
    }

    try {
      await removeMatch(match.id);
      notify(t("matches.messages.deleteSuccess"), "success");
    } catch {
      notify(t("matches.messages.error"), "error");
    }

    onClose();
  };

  const teamA = match ? `${match.player1} & ${match.player2}` : "";
  const teamB = match ? `${match.rival1} & ${match.rival2}` : "";
  const dateStr = match ? formatDateValue(match.date) : "";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle
        sx={(theme) => {
          const bgColor =
            theme.palette.mode === "light"
              ? theme.palette.error.light
              : theme.palette.error.dark;
          return {
            typography: "h5",
            fontWeight: 700,
            bgcolor: bgColor,
            color: theme.palette.getContrastText(bgColor),
            px: 2,
            py: 1,
          };
        }}
      >
        {t("matches.dialogs.deleteMatch")}
      </DialogTitle>
      <DialogContent
        sx={{
          mt: 3,
          px: 2,
        }}
      >
        {match && (
          <Typography variant="body1">
            {t(
              "matches.dialogs.deleteConfirmPrefix",
              "Czy na pewno chcesz usunąć"
            )}{" "}
            <Box component="span" sx={{ fontWeight: 700 }}>
              {teamA}
            </Box>{" "}
            vs{" "}
            <Box component="span" sx={{ fontWeight: 700 }}>
              {teamB}
            </Box>{" "}
            ({dateStr})?
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ pb: 2, px: 3 }}>
        <Button onClick={onClose}>{t("common.cancel")}</Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          sx={(theme) => {
            const bgColor =
              theme.palette.mode === "light"
                ? theme.palette.error.light
                : theme.palette.error.dark;
            return {
              bgcolor: bgColor,
              color: theme.palette.getContrastText(bgColor),
              "&:hover": {
                bgcolor: theme.palette.error.main,
              },
            };
          }}
        >
          {t("matches.actions.delete")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RemoveMatchDialog;
