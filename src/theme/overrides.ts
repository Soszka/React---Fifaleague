import { Components } from "@mui/material/styles";

export const componentOverrides: Components = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        textTransform: "none",
      },
    },
  },

  MuiAppBar: {
    defaultProps: {
      color: "primary",
      elevation: 0,
    },
    styleOverrides: {
      root: {
        backgroundColor: "var(--mui-palette-background-default)",
        color: "var(--mui-palette-text-primary)",
        boxShadow: "none",
      },
    },
  },

  MuiToolbar: {
    styleOverrides: {
      root: {
        minHeight: "58px",
        "@media (min-width:600px)": {
          minHeight: "58px",
        },
      },
    },
  },
};
