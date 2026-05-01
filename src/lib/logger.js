const LEVEL_MAP = { debug: 10, info: 20, warn: 30, error: 40 };

const LOG_LEVEL = LEVEL_MAP[process.env.LOG_LEVEL || "info"] || LEVEL_MAP.info;

/**
 * @param {"debug"|"info"|"warn"|"error"} level
 * @param {string} msg
 * @param {Record<string,unknown>} [extra]
 */
function emit(level, msg, extra) {
  if (LEVEL_MAP[level] < LOG_LEVEL) return;
  const entry = {
    level,
    msg,
    ts: new Date().toISOString(),
    service: "civitra",
    ...extra,
  };
  const out = JSON.stringify(entry);
  if (level === "error" || level === "warn") {
    process.stderr.write(out + "\n");
  } else {
    process.stdout.write(out + "\n");
  }
}

const log = {
  /** @param {string} msg @param {Record<string,unknown>} [extra] */
  debug: (msg, extra) => emit("debug", msg, extra),
  /** @param {string} msg @param {Record<string,unknown>} [extra] */
  info: (msg, extra) => emit("info", msg, extra),
  /** @param {string} msg @param {Record<string,unknown>} [extra] */
  warn: (msg, extra) => emit("warn", msg, extra),
  /** @param {string} msg @param {Record<string,unknown>} [extra] */
  error: (msg, extra) => emit("error", msg, extra),
};

export default log;
