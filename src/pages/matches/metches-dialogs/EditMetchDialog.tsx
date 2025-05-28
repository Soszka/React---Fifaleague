import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { useTranslation } from "react-i18next";
import { useMatches, Match } from "../../../common/context/MatchesContext";

interface EditMatchDialogProps {
  open: boolean;
  onClose: () => void;
  match: Match | null;
}

const EditMatchDialog: React.FC<EditMatchDialogProps> = ({
  open,
  onClose,
  match,
}) => {
  const { t } = useTranslation();
  const { updateMatch } = useMatches();

  // Form state, initialize from `match` when it changes
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [rival1, setRival1] = useState("");
  const [rival2, setRival2] = useState("");
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");
  const [date, setDate] = useState<Dayjs | null>(null);

  useEffect(() => {
    if (match) {
      setPlayer1(match.player1);
      setPlayer2(match.player2);
      setRival1(match.rival1);
      setRival2(match.rival2);
      // Split result "X-Y" into two scores
      const [g1, g2] = match.result.split("-");
      setScore1(g1 ?? "");
      setScore2(g2 ?? "");
      setDate(dayjs(match.date));
    }
  }, [match]);

  const handleSave = () => {
    if (
      !match ||
      !player1 ||
      !player2 ||
      !rival1 ||
      !rival2 ||
      score1 === "" ||
      score2 === "" ||
      !date
    ) {
      return;
    }
    const updatedResult = `${parseInt(score1, 10)}-${parseInt(score2, 10)}`;
    const updatedMatch: Match = {
      ...match,
      player1,
      player2,
      rival1,
      rival2,
      result: updatedResult,
      date: date.valueOf(),
    };
    updateMatch(updatedMatch);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t("matches.dialogs.editMatch")}</DialogTitle>
      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
      >
        <TextField
          label={t("matches.form.player1") ?? "Player 1"}
          value={player1}
          onChange={(e) => setPlayer1(e.target.value)}
          required
        />
        <TextField
          label={t("matches.form.player2") ?? "Player 2"}
          value={player2}
          onChange={(e) => setPlayer2(e.target.value)}
          required
        />
        <TextField
          label={t("matches.form.rival1") ?? "Rival 1"}
          value={rival1}
          onChange={(e) => setRival1(e.target.value)}
          required
        />
        <TextField
          label={t("matches.form.rival2") ?? "Rival 2"}
          value={rival2}
          onChange={(e) => setRival2(e.target.value)}
          required
        />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label={t("matches.form.date") ?? "Date"}
            value={date}
            onChange={(newValue) => setDate(newValue)}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </LocalizationProvider>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <TextField
            type="number"
            label={t("matches.form.scoreHome") ?? "Score Home"}
            value={score1}
            onChange={(e) => setScore1(e.target.value)}
            inputProps={{ min: 0 }}
            sx={{ width: 80 }}
            required
          />
          <Box component="span" sx={{ mx: 1, fontWeight: "bold" }}>
            :
          </Box>
          <TextField
            type="number"
            label={t("matches.form.scoreAway") ?? "Score Away"}
            value={score2}
            onChange={(e) => setScore2(e.target.value)}
            inputProps={{ min: 0 }}
            sx={{ width: 80 }}
            required
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("common.cancel") ?? "Cancel"}</Button>
        <Button variant="contained" onClick={handleSave}>
          {t("common.save") ?? t("matches.actions.edit") ?? "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditMatchDialog;
