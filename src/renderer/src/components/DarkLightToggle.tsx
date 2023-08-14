import { usePreference } from "@/hooks/preferences";
import * as React from "react";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import { makeStyles } from "@mui/styles";
import { Theme } from "@mui/material";

const useStyles = makeStyles((theme: Theme) => ({
  toggleButton: {
    color: theme.palette.text.secondary,
    position: "fixed",
    top: "1rem",
    right: "1rem",
    cursor: "pointer",
  },
}));

export const DarkLightToggle: React.FunctionComponent<{}> = () => {
  const [useDark, setDark] = usePreference<boolean>("darkTheme", false);
  const classes = useStyles();

  const toggleDark = React.useCallback(() => {
    setDark(!useDark);
  }, [setDark, useDark]);

  return (
    <div onClick={toggleDark} className={classes.toggleButton}>
      <Brightness4Icon />
    </div>
  );
};
