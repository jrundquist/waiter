import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Theme } from "@mui/material";
import { makeStyles } from 'tss-react/mui';
import React from "react";
import { throttle } from "lodash";
interface Props {
  rects: DOMRect[];
  selected: number;
}

const SCROLL_PADDING_TOP = 80;
const SCROLL_PADDING_BOTTOM = 20;

const useStyles = makeStyles()((theme: Theme) => ({
  container: {
    position: "fixed",
    top: 0,
    left: 0,
    pointerEvents: "none",
    width: "100vw",
    height: "100vh",
  },
  resultDecorator: {
    position: "absolute",
    background:
      theme.palette.mode === "dark" ? theme.palette.primary.dark : theme.palette.primary.light,
    opacity: theme.palette.mode === "dark" ? 0.4 : 0.3,
    pointerEvents: "none",
    mixBlendMode: theme.palette.mode === "dark" ? "hard-light" : "darken",
  },
  resultDecoratorActive: {
    background: theme.palette.primary.main,
    opacity: 0.6,
  },
}));

export const ResultDecorators: React.FC<Props> = ({ rects, selected }) => {
  const { classes } = useStyles();

  const [editor] = useLexicalComposerContext();
  const scrollEl = React.useMemo(
    () => editor.getRootElement()!.parentElement?.parentElement,
    [editor]
  );

  const [scrollTop, setScrollTop] = React.useState<number>(scrollEl?.scrollTop || 0);
  const [scrollLeft, setScrollLeft] = React.useState<number>(scrollEl?.scrollLeft || 0);

  React.useEffect(() => {
    const handleScroll = throttle(
      () => {
        console.log("scrolling!");
        setScrollTop(scrollEl?.scrollTop ?? 0);
        setScrollLeft(scrollEl?.scrollLeft ?? 0);
      },
      5,
      { leading: true, trailing: true }
    );
    scrollEl?.addEventListener("scroll", handleScroll);
    return () => scrollEl?.removeEventListener("scroll", handleScroll);
  }, [scrollEl]);

  React.useEffect(() => {
    // Scroll to the selected rect if it's off screen.
    const selectedRect = rects[selected];
    if (!selectedRect) {
      return;
    }

    const { top, height } = selectedRect;
    const { scrollTop } = scrollEl!;
    const { clientHeight } = scrollEl!.parentElement!;
    const scrollBottom = scrollTop + clientHeight;
    if (top - SCROLL_PADDING_TOP < scrollTop) {
      scrollEl!.scrollTo({
        top: top - SCROLL_PADDING_TOP,
        behavior: "smooth",
      });
    } else if (top + height + SCROLL_PADDING_BOTTOM > scrollBottom) {
      scrollEl!.scrollTo({
        top: top + height - clientHeight + SCROLL_PADDING_BOTTOM,
        behavior: "smooth",
      });
    }
  }, [selected, rects]);

  console.log({ scrollTop, scrollLeft });

  return rects.map((rect, index) => {
    const classNames = [classes.resultDecorator];
    if (index === selected) {
      classNames.push(classes.resultDecoratorActive);
    }

    return (
      <div className={classes.container}>
        <div
          key={`res-${index}`}
          className={classNames.join(" ")}
          style={{
            top: rect.top - scrollTop,
            left: rect.left - scrollLeft,
            width: rect.width,
            height: rect.height,
          }}
        />
      </div>
    );
  });
};
