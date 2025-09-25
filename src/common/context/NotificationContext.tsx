import React, { createContext, useContext, useState, ReactNode } from "react";
import { Snackbar, Alert } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

type Severity = "success" | "error" | "info";

interface NotificationCtx {
  notify: (msg: string, severity?: Severity) => void;
}

const NotificationContext = createContext<NotificationCtx>({
  notify: () => {},
});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<Severity>("success");

  const notify = (msg: string, sev: Severity = "success") => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={open}
        autoHideDuration={4000}
        onClose={() => setOpen(false)}
      >
        <Alert
          variant="filled"
          onClose={() => setOpen(false)}
          severity={severity}
          icon={
            severity === "success" ? (
              <CheckCircleIcon fontSize="inherit" />
            ) : severity === "info" ? (
              <InfoOutlinedIcon fontSize="inherit" />
            ) : (
              <ErrorIcon fontSize="inherit" />
            )
          }
          sx={(theme) => ({
            width: "100%",
            bgcolor:
              severity === "success"
                ? theme.palette.mode === "light"
                  ? theme.palette.success.main
                  : theme.palette.success.dark
                : severity === "info"
                ? theme.palette.mode === "light"
                  ? theme.palette.info.main
                  : theme.palette.info.dark
                : theme.palette.mode === "light"
                ? theme.palette.error.main
                : theme.palette.error.dark,
            color: theme.palette.common.white,
            "& .MuiAlert-icon": {
              color: theme.palette.common.white,
            },
          })}
        >
          {message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};
