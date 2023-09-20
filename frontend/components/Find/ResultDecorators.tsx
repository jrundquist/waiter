import { Theme } from "@mui/material";
import { makeStyles } from "@mui/styles";
import React from "react";

interface Props {
  rects: DOMRect[];
  selected: number;
}

const useStyles = makeStyles((theme: Theme) => ({
  resultDecorator: {
    boxSizing: "border-box",
    position: "absolute",
    background: theme.palette.primary.dark,
    opacity: 0.5,
    pointerEvents: "none",
  },
  resultDecoratorActive: {
    // border: `3px solid ${theme.palette.secondary.main}`,
    background: theme.palette.primary.main,
  },
}));

export const ResultDecorators: React.FC<Props> = ({ rects, selected }) => {
  const classes = useStyles();
  return rects.map((rect, index) => {
    const classNames = [classes.resultDecorator];
    if (index === selected) {
      classNames.push(classes.resultDecoratorActive);
    }
    return (
      <div
        key={`res-${index}`}
        className={classNames.join(" ")}
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }}
      />
    );
  });
};
