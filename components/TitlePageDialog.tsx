import React, { useEffect, useState } from "react";
import { Theme } from "@mui/material";
import { makeStyles } from "tss-react/mui";

const useStyles = makeStyles()((theme: Theme) => ({
  dialog: {
    position: "fixed",
    top: "10%",
    left: "50%",
    transform: "translate(-50%, 0)",
    backgroundColor: theme.palette.background.paper,
    padding: 20,
    boxShadow: `0 0 10px ${theme.palette.text.secondary}`,
    border: `2px solid ${theme.palette.divider}`,
    borderRadius: 10,
    zIndex: 100,
    minWidth: 500,
  },

  content: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    color: theme.palette.text.primary,
  },

  row: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  label: {
    width: 100,
  },

  input: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.default,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 5,
    padding: 5,
    color: theme.palette.text.primary,
  },

  dialogButtons: {
    marginTop: 20,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },

  actionButton: {
    padding: "5px 10px",
    borderRadius: 5,
    border: `none`,
    cursor: "pointer",
    transition: "background-color 0.2s",
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
    },
  },

  cancelButton: {
    padding: "5px 10px",
    borderRadius: 5,
    border: `none`,
    cursor: "pointer",
    transition: "background-color 0.2s",
    backgroundColor: theme.palette.grey[500],
    "&:hover": {
      backgroundColor: theme.palette.error.dark,
    },
    alignSelf: "flex-start",
  },
}));

interface Info {
  title: string;
  credit: string;
  authors: string;
  source: string;
  contact: string;
  date: string;
}
interface TitlePageDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (info: Info) => void;
  currentInfo: Info;
}

export const TitlePageDialog: React.FC<TitlePageDialogProps> = ({
  open,
  onClose,
  onSave,
  currentInfo,
}) => {
  const [title, setTitle] = useState(currentInfo.title);
  const [credit, setCredit] = useState(currentInfo.credit);
  const [authors, setAuthors] = useState(currentInfo.authors);
  const [source, setSource] = useState(currentInfo.source);
  const [contact, setContact] = useState(currentInfo.contact);
  const [date, setDate] = useState(currentInfo.date ?? new Date().toISOString().substring(0, 10));

  useEffect(() => {
    setTitle(currentInfo.title);
    setCredit(currentInfo.credit);
    setAuthors(currentInfo.authors);
    setSource(currentInfo.source);
    setContact(currentInfo.contact);
    setDate(currentInfo.date ?? new Date().toISOString().substring(0, 10));
  }, [currentInfo]);

  const handleSave = React.useCallback(() => {
    onSave({
      title,
      credit,
      authors,
      source,
      contact,
      date,
    });
    onClose();
  }, [onClose, onSave, title, credit, authors, source, contact, date]);

  const { classes } = useStyles();

  if (!open) return null;
  return (
    <div className={classes.dialog}>
      <div className={classes.content}>
        <h2>Title Page</h2>
        <div className={classes.row}>
          <label className={classes.label} htmlFor="title">
            Title:
          </label>
          <input
            className={classes.input}
            type="text"
            id="title"
            value={title}
            placeholder="Script Title"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className={classes.row}>
          <label className={classes.label} htmlFor="credit">
            Credit:
          </label>
          <input
            className={classes.input}
            type="text"
            id="credit"
            value={credit}
            placeholder="Written by"
            onChange={(e) => setCredit(e.target.value)}
          />
        </div>
      </div>

      <div className={classes.row}>
        <label className={classes.label} htmlFor="authors">
          Author(s):
        </label>
        <input
          className={classes.input}
          type="text"
          id="authors"
          placeholder="First Author, Second Author"
          value={authors}
          onChange={(e) => setAuthors(e.target.value)}
        />
      </div>

      <div className={classes.row}>
        <label className={classes.label} htmlFor="source">
          Source:
        </label>
        <input
          className={classes.input}
          type="text"
          id="source"
          placeholder="Based on ..."
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />
      </div>

      <div className={classes.row}>
        <label className={classes.label} htmlFor="date">
          Date:
        </label>
        <input
          className={classes.input}
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className={classes.row}>
        <label className={classes.label} htmlFor="contact">
          Contact:
        </label>
        <textarea
          className={classes.input}
          id="contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />
      </div>

      <div className={classes.dialogButtons}>
        <button className={`${classes.cancelButton}`} onClick={onClose}>
          Cancel
        </button>
        <button className={classes.actionButton} onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
};
