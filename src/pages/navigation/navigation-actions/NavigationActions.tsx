// src/components/navigation-actions/NavigationActions.tsx
import { useState } from "react";
import { IconButton, Menu, MenuItem, Tooltip } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LanguageIcon from "@mui/icons-material/Language";
import GitHubIcon from "@mui/icons-material/GitHub";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

interface Props {
  toggleTheme: () => void;
}

export default function NavigationActions({ toggleTheme }: Props) {
  const { i18n, t } = useTranslation();
  const theme = useTheme();

  const [anchorLang, setAnchorLang] = useState<null | HTMLElement>(null);
  const [anchorUser, setAnchorUser] = useState<null | HTMLElement>(null);

  return (
    <>
      {/* Języki */}
      <Tooltip title={t("navigation.language")}>
        <IconButton
          color="inherit"
          onClick={(e) => setAnchorLang(e.currentTarget)}
        >
          <LanguageIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorLang}
        open={!!anchorLang}
        onClose={() => setAnchorLang(null)}
      >
        {["en", "pl"].map((lng) => (
          <MenuItem
            key={lng}
            onClick={() => {
              i18n.changeLanguage(lng);
              setAnchorLang(null);
            }}
            selected={i18n.language === lng}
          >
            {t(`language.${lng}`)}
          </MenuItem>
        ))}
      </Menu>

      {/* Motyw jasny/ciemny */}
      <Tooltip title={t("navigation.theme")}>
        <IconButton color="inherit" onClick={toggleTheme}>
          {theme.palette.mode === "dark" ? (
            <Brightness7Icon />
          ) : (
            <Brightness4Icon />
          )}
        </IconButton>
      </Tooltip>

      {/* GitHub */}
      <Tooltip title="GitHub">
        <IconButton
          color="inherit"
          href="https://github.com/TwojeRepo"
          target="_blank"
          rel="noopener"
        >
          <GitHubIcon />
        </IconButton>
      </Tooltip>

      {/* Avatar */}
      <Tooltip title={t("navigation.account")}>
        <IconButton
          color="inherit"
          onClick={(e) => setAnchorUser(e.currentTarget)}
        >
          <AccountCircleIcon sx={{ fontSize: 26 }} />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorUser}
        open={!!anchorUser}
        onClose={() => setAnchorUser(null)}
      >
        <MenuItem onClick={() => setAnchorUser(null)}>
          {t("navigation.profile")}
        </MenuItem>
        <MenuItem onClick={() => setAnchorUser(null)}>
          {t("navigation.logout")}
        </MenuItem>
      </Menu>
    </>
  );
}
