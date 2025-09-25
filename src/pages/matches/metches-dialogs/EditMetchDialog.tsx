// EditMetchDialog.tsx
import React, { useState, useEffect, useMemo } from "react";
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
import { useMatches, Match } from "../../../common/context/MatchesContext";
import { useNotification } from "../../../common/context/NotificationContext";
import { PLAYER_LABELS } from "../../../common/constants/players";

interface EditMatchDialogProps {
  open: boolean;
  onClose: () => void;
  match: Match | null;
}

const EditMetchDialog: React.FC<EditMatchDialogProps> = ({
  open,
  onClose,
  match,
}) => {
  const { t } = useTranslation();
  const { updateMatch } = useMatches();
  const { notify } = useNotification();

  const players = useMemo(() => [...PLAYER_LABELS], []);

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
      const [g1, g2] = match.result.split(/[:\-]/);
      setScore1(g1 ?? "");
      setScore2(g2 ?? "");
      setDate(dayjs(match.date));
    }
  }, [match]);

  const options = (exclude: string[], value: string) =>
    players.filter((p) => p === value || !exclude.includes(p));

  const handleSave = async () => {
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
    try {
      await updateMatch(updatedMatch);
      notify(t("matches.messages.updateSuccess"), "success");
      onClose();
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
        {t("matches.dialogs.editMatch")}
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
          onClick={handleSave}
          disabled={
            !player1 ||
            !player2 ||
            !rival1 ||
            !rival2 ||
            score1 === "" ||
            score2 === ""
          }
        >
          {t("common.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditMetchDialog;
