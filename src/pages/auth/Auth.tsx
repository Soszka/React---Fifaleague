import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  IconButton,
  Button,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useTranslation } from "react-i18next";

import styles from "./auth.module.scss";
import Logo from "../../assets/Logo.png";
import Title from "../../common/UI/Title";

type FormValues = { email: string; password: string };

export default function Auth() {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();
  const navigate = useNavigate();
  const [hide, setHide] = useState(true);

  const onSubmit = () => navigate("/navigation/home");

  return (
    <div className={styles.auth}>
      <div className={styles.authContainer}>
        <div className={styles.authContent}>
          <Title title={t("auth.subtitle")} subtitle={t("auth.started")} />

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
                type={hide ? "password" : "text"}
                fullWidth
                margin="normal"
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setHide(!hide)}
                        edge="end"
                        aria-label={
                          hide ? t("auth.toggle.off") : t("auth.toggle.on")
                        }
                        className={styles.passwordToggle}
                      >
                        {hide ? <VisibilityOff /> : <Visibility />}
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
              sx={{
                mt: 3,
                "&:hover": {
                  backgroundColor: (theme) => theme.palette.grey[800],
                },
              }}
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
            backgroundColor: (theme) => theme.palette.common.black,
            color: (theme) => theme.palette.common.white,
            py: 1.2,
            borderRadius: "0 0 10px 10px",
            "&:hover": {
              backgroundColor: (theme) => theme.palette.grey[800],
            },
          }}
        >
          Przetestuj aplikację jako admin
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
    </div>
  );
}
