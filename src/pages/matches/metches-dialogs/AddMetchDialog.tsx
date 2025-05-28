import React, { useState } from "react";
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
import { useMatches } from "../../../common/context/MatchesContext";

interface AddMatchDialogProps {
  open: boolean;
  onClose: () => void;
}

const AddMatchDialog: React.FC<AddMatchDialogProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const { addMatch } = useMatches();

  // Form state for new match fields
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [rival1, setRival1] = useState("");
  const [rival2, setRival2] = useState("");
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");
  const [date, setDate] = useState<Dayjs | null>(dayjs()); // default to today

  const handleAdd = () => {
    if (
      !player1 ||
      !player2 ||
      !rival1 ||
      !rival2 ||
      score1 === "" ||
      score2 === "" ||
      !date
    ) {
      return; // do not add if any field is empty
    }
    // Prepare result in "X-Y" format
    const resultString = `${parseInt(score1, 10)}-${parseInt(score2, 10)}`;
    // Add match via context
    addMatch({
      player1,
      player2,
      rival1,
      rival2,
      result: resultString,
      date: date.valueOf(),
    });
    onClose();
    // Clear the form after adding (optional, since dialog will unmount by default)
    setPlayer1("");
    setPlayer2("");
    setRival1("");
    setRival2("");
    setScore1("");
    setScore2("");
    setDate(dayjs());
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t("matches.dialogs.addMatch")}</DialogTitle>
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
        <Button variant="contained" onClick={handleAdd}>
          {t("matches.actions.add") ?? "Add"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddMatchDialog;
