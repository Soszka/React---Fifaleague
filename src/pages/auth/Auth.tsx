import { useState } from "react";
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
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Menu,
  MenuItem,
  Typography,
  Tooltip,
  useTheme,
  CircularProgress,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { getTheme } from "../../theme";
import { useTranslation } from "react-i18next";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import LanguageIcon from "@mui/icons-material/Language";
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
      <ThemeProvider theme={getTheme("light")}>
        <AuthInner />
      </ThemeProvider>
    </NotificationProvider>
  );
}

function AuthInner() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
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
  const [selectedUser, setSelectedUser] = useState("");
  const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null);
  const { notify } = useNotification();
  const languages = [
    { code: "en", label: "English" },
    { code: "pl", label: "Polski" },
  ];
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

  const handleUserInsert = () => {
    if (!selectedUser) return;
    const name = selectedUser;
    const email = `${name.toLowerCase()}@${name.toLowerCase()}.com`;
    const password = `${name.charAt(0).toUpperCase()}${name
      .slice(1)
      .toLowerCase()}123`;
    setValue("email", email, { shouldDirty: true });
    setValue("password", password, { shouldDirty: true });
    setDialogOpen(false);
    setSelectedUser("");
    notify(t("auth.userInserted"), "success");
  };

  return (
    <div className={styles.auth}>
      <div className={styles.authContainer}>
        <div className={styles.langSwitch}>
          <Tooltip title={t("navigation.language")}> 
            <IconButton onClick={(e) => setLangAnchor(e.currentTarget)}>
              <LanguageIcon />
            </IconButton>
          </Tooltip>
          <Menu anchorEl={langAnchor} open={!!langAnchor} onClose={() => setLangAnchor(null)}>
            {languages.map(({ code, label }) => (
              <MenuItem
                key={code}
                onClick={() => {
                  i18n.changeLanguage(code);
                  setLangAnchor(null);
                }}
                selected={i18n.language === code}
              >
                {label}
              </MenuItem>
            ))}
          </Menu>
        </div>
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
        onClose={() => {
          setDialogOpen(false);
          setSelectedUser("");
        }}
        maxWidth="sm"
        PaperProps={{ sx: { minWidth: "350px", minHeight: 260 } }}
      >
        <DialogTitle sx={{ bgcolor: theme.palette.grey[300] }}>
          Select user
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography>{t("auth.selectUserDesc")}</Typography>
          <FormControl fullWidth sx={{ mt: 3 }}>
            <InputLabel id="user-select-label">User</InputLabel>
            <Select
              labelId="user-select-label"
              label="User"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value as string)}
            >
              {USERS.map((u) => (
                <MenuItem key={u} value={u}>
                  {u}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
          <Button
            variant="contained"
            disabled={!selectedUser}
            onClick={handleUserInsert}
          >
            {t("common.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
