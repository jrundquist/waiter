import pino from "pino";
import { IpcMainEvent, app } from "electron";
import path from "path";
import { is } from "@electron-toolkit/utils";
import fs from "fs";
import { ipcMain } from "electron";

const startTime = Date.now();

// Get the current platform
const platform = process.platform;

let logDirectory: string;

switch (platform) {
  case "linux":
    logDirectory = path.join(app.getPath("home"), ".config", app.getName(), "logs");
    break;
  case "darwin":
    logDirectory = path.join(app.getPath("home"), "Library", "Logs", app.getName());
    break;
  case "win32":
    logDirectory = path.join(app.getPath("appData"), app.getName(), "logs");
    break;
  default:
    throw new Error("Unsupported platform");
}

function makeLogFile(type: "main" | "browser"): string {
  const logFile = path.join(logDirectory, `${type}-${is.dev ? "dev" : process.pid}.log`);
  const logPath = path.normalize(logFile);

  // Ensure the directory exists
  if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
  }

  // Ensure the log file exists
  if (!fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, "", { flag: "a" });
  }

  return logPath;
}

export const logPath = makeLogFile("main");
export const browserLogPath = makeLogFile("browser");

const transport = pino.transport({
  targets: [
    {
      level: "trace",
      target: "pino/file",
      options: {
        destination: logPath,
        sync: false,
      },
    },
    {
      level: "trace",
      target: "pino-pretty",
      options: {
        level: "trace",
        ignore: "pid,hostname",
        sync: is.dev,
      },
    },
  ],
});

const browserTransport = pino.transport({
  targets: [
    {
      level: "trace",
      target: "pino/file",
      options: {
        destination: browserLogPath,
        sync: false,
      },
    },
    {
      level: "trace",
      target: "pino-pretty",
      options: {
        customColors: "info:magentaBright",
        ignore: "pid,hostname",
        useOnlyCustomProps: false,
        sync: is.dev,
      },
    },
  ],
});

const level = is.dev ? "trace" : "info";

export const log = pino({ name: "main", level }, transport);
export const browserLog = pino({ name: "browser", level }, browserTransport);

log.debug("========= Logging Initialized =========");
log.debug(`Log file location: ${logPath}`);
log.debug(`App name: ${app.getName()}`);
log.debug(`App version: ${app.getVersion()}`);
log.debug(`Startup Time: ${startTime}`);
log.debug(`Is Dev: ${is.dev}`);
log.debug(`Process platform: ${platform}`);
log.debug(`Process PID: ${process.pid}`);
log.debug(`Process PWD: ${process.cwd()}`);
log.debug(`Process execPath: ${process.execPath}`);
log.debug(`Process argv: ${process.argv}`);
log.debug("========= End Process Info =========");

browserLog.debug("========= Browser Logging Initialized =========");
browserLog.debug(`Log file location: ${browserLogPath}`);
browserLog.debug(`App name: ${app.getName()}`);
browserLog.debug(`App version: ${app.getVersion()}`);
browserLog.debug(`Startup Time: ${startTime}`);
browserLog.debug(`Is Dev: ${is.dev}`);
browserLog.debug(`Process platform: ${platform}`);
browserLog.debug("========= End Browser Info  =========");

ipcMain.on("browserLog:debug", (_: IpcMainEvent, message: string, ...args: unknown[]) => {
  browserLog.debug(message, ...args);
});

ipcMain.on("browserLog:error", (_: IpcMainEvent, message: string, ...args: unknown[]) => {
  browserLog.error(message, ...args);
});

ipcMain.on("browserLog:info", (_: IpcMainEvent, message: string, ...args: unknown[]) => {
  browserLog.info(message, ...args);
});

ipcMain.on("browserLog:warn", (_: IpcMainEvent, message: string, ...args: unknown[]) => {
  browserLog.warn(message, ...args);
});
