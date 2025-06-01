// AddMetchDialog.tsx
import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { useTranslation } from "react-i18next";
import { useMatches } from "../../../common/context/MatchesContext";
import { useNotification } from "../../../common/context/NotificationContext";

interface AddMatchDialogProps {
  open: boolean;
  onClose: () => void;
}

const AddMetchDialog: React.FC<AddMatchDialogProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const { addMatch, matches } = useMatches();
  const { notify } = useNotification();

  const players = useMemo(() => {
    const set = new Set<string>();
    matches.forEach((m) => {
      set.add(m.player1);
      set.add(m.player2);
      set.add(m.rival1);
      set.add(m.rival2);
    });
    return Array.from(set).sort();
  }, [matches]);

  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [rival1, setRival1] = useState("");
  const [rival2, setRival2] = useState("");
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");
  const [date, setDate] = useState<Dayjs | null>(dayjs());

  const options = (exclude: string[], value: string) =>
    players.filter((p) => p === value || !exclude.includes(p));

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
      return;
    }
    const resultString = `${parseInt(score1, 10)}-${parseInt(score2, 10)}`;
    try {
      addMatch({
        player1,
        player2,
        rival1,
        rival2,
        result: resultString,
        date: date.valueOf(),
      });
      notify(t("matches.messages.addSuccess"), "success");
      onClose();
      setPlayer1("");
      setPlayer2("");
      setRival1("");
      setRival2("");
      setScore1("");
      setScore2("");
      setDate(dayjs());
    } catch {
      notify(t("matches.messages.error"), "error");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle
        sx={{
          typography: "h5",
          fontSize: "1.6rem",
          fontWeight: 700,
          bgcolor: (theme) =>
            theme.palette.mode === "dark"
              ? theme.palette.grey[700]
              : theme.palette.grey[200],
          px: 2,
          py: 1.5,
          mb: 1,
        }}
      >
        {t("matches.dialogs.addMatch")}
      </DialogTitle>
      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 3, px: 2 }}
      >
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>{t("matches.form.player1")}</InputLabel>
          <Select
            label={t("matches.form.player1")}
            value={player1}
            onChange={(e) => setPlayer1(e.target.value as string)}
          >
            {options([player2, rival1, rival2], player1).map((p) => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>{t("matches.form.player2")}</InputLabel>
          <Select
            label={t("matches.form.player2")}
            value={player2}
            onChange={(e) => setPlayer2(e.target.value as string)}
          >
            {options([player1, rival1, rival2], player2).map((p) => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>{t("matches.form.rival1")}</InputLabel>
          <Select
            label={t("matches.form.rival1")}
            value={rival1}
            onChange={(e) => setRival1(e.target.value as string)}
          >
            {options([player1, player2, rival2], rival1).map((p) => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>{t("matches.form.rival2")}</InputLabel>
          <Select
            label={t("matches.form.rival2")}
            value={rival2}
            onChange={(e) => setRival2(e.target.value as string)}
          >
            {options([player1, player2, rival1], rival2).map((p) => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label={t("matches.form.date")}
            value={date}
            onChange={(newValue) => setDate(newValue)}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </LocalizationProvider>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <TextField
            type="number"
            label={t("matches.form.scoreHome")}
            value={score1}
            onChange={(e) => setScore1(e.target.value)}
            inputProps={{ min: 0 }}
            fullWidth
            sx={{ flex: 1 }}
          />
          <Typography variant="h6" fontWeight={700}>
            :
          </Typography>
          <TextField
            type="number"
            label={t("matches.form.scoreAway")}
            value={score2}
            onChange={(e) => setScore2(e.target.value)}
            inputProps={{ min: 0 }}
            fullWidth
            sx={{ flex: 1 }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ pb: 2, px: 3 }}>
        <Button onClick={onClose}>{t("common.cancel")}</Button>
        <Button
          variant="contained"
          onClick={handleAdd}
          disabled={
            !player1 ||
            !player2 ||
            !rival1 ||
            !rival2 ||
            score1 === "" ||
            score2 === ""
          }
        >
          {t("matches.actions.add")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddMetchDialog;
