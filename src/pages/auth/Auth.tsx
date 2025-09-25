import { useState, useEffect } from "react";
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
import { PLAYER_LABELS, getPlayerInfoByLabel } from "../../common/constants/players";
import { stripDiacritics } from "../../common/utils/nameUtils";
import styles from "./auth.module.scss";
import Logo from "../../assets/Logo.png";
import Title from "../../common/UI/Title";

type FormValues = { email: string; password: string };

const USERS = PLAYER_LABELS;

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
  const { login, user, loading: authLoading } = useAuth();
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
  const [loginLoading, setLoginLoading] = useState(false);
  const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null);
  const { notify } = useNotification();
  const languages = [
    { code: "en", label: "English" },
    { code: "pl", label: "Polski" },
    { code: "es", label: "Español" },
    { code: "de", label: "Deutsch" },
  ];
  const emailValue = watch("email");
  const passwordValue = watch("password");

  useEffect(() => {
    if (user) {
      navigate("/app/home", { replace: true });
    }
  }, [user, navigate]);

  const onSubmit = async ({ email, password }: FormValues) => {
    setLoginLoading(true);
    try {
      await login(email, password);
      navigate("/app/home", { replace: true });
    } catch {
      notify(t("auth.loginError"), "error");
      setLoginLoading(false);
    }
  };

  const handleUserInsert = () => {
    if (!selectedUser) return;
    const name = selectedUser;
    const ascii = stripDiacritics(name).replace(/[^a-zA-Z0-9]/g, "");
    const info = getPlayerInfoByLabel(name);
    const baseId = info?.id ?? ascii.toLowerCase();
    const email = `${baseId}@${baseId}.com`;
    const password = `${baseId.charAt(0).toUpperCase()}${baseId.slice(1)}123`;
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
          <Tooltip title="Language">
            <IconButton onClick={(e) => setLangAnchor(e.currentTarget)}>
              <LanguageIcon />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={langAnchor}
            open={!!langAnchor}
            onClose={() => setLangAnchor(null)}
          >
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
          <Title title={t("auth.title")} subtitle={t("auth.subtitle")} />

          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            className={styles.authForm}
          >
            <TextField
              label={t("auth.email")}
              type="email"
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: !!emailValue }}
              {...register("email", {
                required: t("auth.errors.emailRequired"),
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: t("auth.errors.emailInvalid"),
                },
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />

            <Box className={styles.passwordField}>
              <TextField
                label={t("auth.password")}
                type={hidePassword ? "password" : "text"}
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: !!passwordValue }}
                {...register("password", {
                  required: t("auth.errors.passwordRequired"),
                  minLength: {
                    value: 6,
                    message: t("auth.errors.passwordMin"),
                  },
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
                          hidePassword
                            ? t("auth.toggle.off")
                            : t("auth.toggle.on")
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
              disabled={authLoading || loginLoading}
              sx={{
                mt: 3,
                "&:hover": { backgroundColor: (t) => t.palette.grey[800] },
              }}
              endIcon={
                authLoading || loginLoading ? (
                  <CircularProgress size={18} />
                ) : null
              }
            >
              {t("auth.login")}
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
          {t("auth.testApplication")}
        </Button>
      </div>

      <div className={styles.authLogo}>
        <img src={Logo} alt="Logo" />
      </div>

      <div className={styles.footer}>
        <p>
          {t("auth.footer.text")} <span>{t("auth.footer.author")}</span>
        </p>
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedUser("");
        }}
        fullWidth
        maxWidth={i18n.language === "pl" ? "sm" : "xs"}
        PaperProps={{
          sx: {
            width: { xs: "95%", sm: i18n.language === "pl" ? 500 : 400 },
            minHeight: 260,
          },
        }}
      >
        <DialogTitle sx={{ bgcolor: theme.palette.grey[300], py: 1.5, px: 2 }}>
          {t("auth.selectUser")}
        </DialogTitle>
        <DialogContent sx={{ pt: 1.5, px: 2 }}>
          <Typography sx={{ mt: 1.5 }}>{t("auth.selectUserDesc")}</Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="user-select-label">
              {t("auth.userLabel")}
            </InputLabel>
            <Select
              labelId="user-select-label"
              label={t("auth.userLabel")}
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
          <Button onClick={() => setDialogOpen(false)}>
            {t("common.cancel")}
          </Button>
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
