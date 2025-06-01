import React, { useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  useTheme,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { motion } from "framer-motion";
import { Dayjs } from "dayjs";
import { useTranslation } from "react-i18next";
import { FilterResultOption } from "../types";

const MotionButton = motion(Button);

interface Props {
  isMobile: boolean;
  showAll: boolean;
  onToggleShowAll: () => void;
  rivalFilter: string | null;
  onRivalFilterChange: (v: string | null) => void;
  resultFilter: FilterResultOption;
  onResultFilterChange: (v: FilterResultOption) => void;
  dateFrom: Dayjs | null;
  dateTo: Dayjs | null;
  onDateFromChange: (v: Dayjs | null) => void;
  onDateToChange: (v: Dayjs | null) => void;
  earliestDate: Dayjs | null;
  latestDate: Dayjs | null;
  uniqueTeams: string[];
  onClearFilters: () => void;
  onAddMatch: () => void;
}

const FILTER_WIDTH = 220;

const MatchesFilters: React.FC<Props> = ({
  isMobile,
  showAll,
  onToggleShowAll,
  rivalFilter,
  onRivalFilterChange,
  resultFilter,
  onResultFilterChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  earliestDate,
  latestDate,
  uniqueTeams,
  onClearFilters,
  onAddMatch,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const controlWidth = isMobile ? "100%" : FILTER_WIDTH;
  const buttonWidth = isMobile ? "100%" : "auto";

  const controls = (
    <>
      <MotionButton
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 3, repeat: Infinity }}
        onClick={onToggleShowAll}
        variant="outlined"
        size="small"
        sx={{
          px: 2,
          backgroundColor: "transparent",
          color: "inherit",
          borderWidth: 2,
          borderStyle: "solid",
          borderColor: "currentColor",
          width: buttonWidth,
          "&:hover": {
            backgroundColor: theme.palette.action.hover,
            borderColor: theme.palette.primary.main,
          },
        }}
      >
        {showAll
          ? t("matches.filters.myMatches")
          : t("matches.filters.allMatches")}
      </MotionButton>

      <Autocomplete
        value={rivalFilter}
        onChange={(_, v) => onRivalFilterChange(v)}
        options={uniqueTeams}
        sx={{ width: controlWidth }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={t("matches.filters.team") as string}
            size="small"
          />
        )}
        clearOnEscape
      />

      <FormControl size="small" sx={{ width: controlWidth }}>
        <InputLabel>{t("matches.filters.result")}</InputLabel>
        <Select
          value={resultFilter}
          label={t("matches.filters.result")}
          onChange={(e) =>
            onResultFilterChange(e.target.value as FilterResultOption)
          }
        >
          <MenuItem value="">{t("matches.filters.none")}</MenuItem>
          <MenuItem value="WIN">{t("matches.outcome.win")}</MenuItem>
          <MenuItem value="LOSS">{t("matches.outcome.loss")}</MenuItem>
          <MenuItem value="DRAW">{t("matches.outcome.draw")}</MenuItem>
        </Select>
      </FormControl>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          label={t("matches.filters.from")}
          value={dateFrom}
          minDate={earliestDate || undefined}
          maxDate={dateTo || latestDate || undefined}
          onChange={(v) => {
            onDateFromChange(v);
            if (dateTo && v && v.isAfter(dateTo)) onDateToChange(v);
          }}
          slotProps={{
            textField: { size: "small", sx: { width: controlWidth } },
          }}
        />
        <DatePicker
          label={t("matches.filters.to")}
          value={dateTo}
          minDate={dateFrom || earliestDate || undefined}
          maxDate={latestDate || undefined}
          onChange={(v) => {
            onDateToChange(v);
            if (dateFrom && v && v.isBefore(dateFrom)) onDateFromChange(v);
          }}
          slotProps={{
            textField: { size: "small", sx: { width: controlWidth } },
          }}
        />
      </LocalizationProvider>

      <Button
        onClick={onClearFilters}
        variant="contained"
        size="small"
        sx={{ minWidth: "auto", px: 2, width: buttonWidth }}
      >
        {t("matches.filters.clear")}
      </Button>

      {!isMobile && (
        <Button
          onClick={onAddMatch}
          variant="contained"
          size="small"
          sx={{
            minWidth: "auto",
            px: 2,
            width: buttonWidth,
            backgroundColor: theme.palette.grey[500],
            color: theme.palette.getContrastText(theme.palette.grey[500]),
            "&:hover": {
              backgroundColor: theme.palette.grey[600],
            },
          }}
        >
          {t("matches.actions.add")}
        </Button>
      )}
    </>
  );

  if (isMobile) {
    return (
      <>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            alignItems: "center",
            mb: 3,
          }}
        >
          <Button
            variant="contained"
            size="small"
            sx={{ width: "100%", px: 2 }}
            onClick={() => setOpen(true)}
          >
            {t("matches.filters.filter")}
          </Button>
          <Button
            variant="contained"
            size="small"
            sx={{
              width: "100%",
              px: 2,
              backgroundColor: theme.palette.grey[500],
              color: theme.palette.getContrastText(theme.palette.grey[500]),
              "&:hover": {
                backgroundColor: theme.palette.grey[600],
              },
            }}
            onClick={onAddMatch}
          >
            {t("matches.actions.add")}
          </Button>
        </Box>
        <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
          <DialogTitle>{t("matches.filters.filter")}</DialogTitle>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
          >
            {controls}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
        alignItems: "center",
        mb: 3,
      }}
    >
      {controls}
    </Box>
  );
};

export default MatchesFilters;
