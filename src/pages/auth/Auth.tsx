import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  IconButton,
  Button,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  NotificationProvider,
  useNotification,
} from "../../common/context/NotificationContext";
import { useAuth } from "../../common/context/AuthContext";
import styles from "./auth.module.scss";
import Logo from "../../assets/Logo.png";
import Title from "../../common/UI/Title";

type FormValues = { email: string; password: string };

const USERS = ["Damian", "Bartek", "Grzesiek", "Darek", "Marek", "Adrian"];

export default function Auth() {
  return (
    <NotificationProvider>
      <AuthInner />
    </NotificationProvider>
  );
}

function AuthInner() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { login, loading: authLoading } = useAuth();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>();
  const [hidePassword, setHidePassword] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { notify } = useNotification();
  const emailValue = watch("email");
  const passwordValue = watch("password");

  const onSubmit = async ({ email, password }: FormValues) => {
    try {
      await login(email, password);
      navigate("/app/home", { replace: true });
    } catch {
      notify("Błędne dane logowania", "error");
    }
  };

  const handleUserSelect = (name: string) => {
    const email = `${name.toLowerCase()}@${name.toLowerCase()}.com`;
    const password = `${name.charAt(0).toUpperCase()}${name
      .slice(1)
      .toLowerCase()}123`;
    setValue("email", email, { shouldDirty: true });
    setValue("password", password, { shouldDirty: true });
    setDialogOpen(false);
    notify("Użytkownik wstawiony – kliknij Log in", "success");
  };

  return (
    <div className={styles.auth}>
      <div className={styles.authContainer}>
        <div className={styles.authContent}>
          <Title title="Get started" subtitle="Log in to Efubol League" />

          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            className={styles.authForm}
          >
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: !!emailValue }}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email address",
                },
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />

            <Box className={styles.passwordField}>
              <TextField
                label="Password"
                type={hidePassword ? "password" : "text"}
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: !!passwordValue }}
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 6, message: "Min 6 characters" },
                })}
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setHidePassword(!hidePassword)}
                        edge="end"
                        aria-label={
                          hidePassword ? "Show password" : "Hide password"
                        }
                        className={styles.passwordToggle}
                      >
                        {hidePassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Button
              type="submit"
              variant="contained"
              className={styles.loginButton}
              disabled={authLoading}
              sx={{
                mt: 3,
                "&:hover": { backgroundColor: (t) => t.palette.grey[800] },
              }}
              endIcon={authLoading ? <CircularProgress size={18} /> : null}
            >
              Log in
            </Button>
          </Box>
        </div>

        <Button
          fullWidth
          variant="contained"
          className={styles.adminBar}
          sx={{
            mt: -1,
            fontSize: "0.875rem",
            backgroundColor: (t) => t.palette.common.black,
            color: (t) => t.palette.common.white,
            py: 1,
            borderRadius: "0 0 10px 10px",
            "&:hover": { backgroundColor: (t) => t.palette.grey[800] },
          }}
          onClick={() => setDialogOpen(true)}
        >
          Test application
        </Button>
      </div>

      <div className={styles.authLogo}>
        <img src={Logo} alt="Logo" />
      </div>

      <div className={styles.footer}>
        <p>
          Created by <span>Bartlomiej Socha</span>
        </p>
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        PaperProps={{ sx: { minWidth: "350px", minHeight: 220 } }}
      >
        <DialogTitle sx={{ bgcolor: theme.palette.grey[300] }}>
          Select user
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth sx={{ mt: 3 }}>
            <InputLabel id="user-select-label">User</InputLabel>
            <Select
              labelId="user-select-label"
              label="User"
              onChange={(e) => handleUserSelect(e.target.value as string)}
            >
              {USERS.map((u) => (
                <MenuItem key={u} value={u}>
                  {u}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
      </Dialog>
    </div>
  );
}
