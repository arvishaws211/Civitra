import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("logger", () => {
  let stdoutSpy;
  let stderrSpy;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("writes info level to stdout as JSON", async () => {
    const { default: log } = await import("../../src/lib/logger.js");
    log.info("test_msg", { extra: "data" });
    expect(stdoutSpy).toHaveBeenCalledOnce();
    const output = JSON.parse(stdoutSpy.mock.calls[0][0].trim());
    expect(output.level).toBe("info");
    expect(output.msg).toBe("test_msg");
    expect(output.extra).toBe("data");
    expect(output.service).toBe("civitra");
    expect(output.ts).toBeDefined();
  });

  it("writes error level to stderr", async () => {
    const { default: log } = await import("../../src/lib/logger.js");
    log.error("fail_msg", { code: 500 });
    expect(stderrSpy).toHaveBeenCalledOnce();
    const output = JSON.parse(stderrSpy.mock.calls[0][0].trim());
    expect(output.level).toBe("error");
    expect(output.msg).toBe("fail_msg");
  });

  it("writes warn level to stderr", async () => {
    const { default: log } = await import("../../src/lib/logger.js");
    log.warn("warn_msg");
    expect(stderrSpy).toHaveBeenCalledOnce();
    const output = JSON.parse(stderrSpy.mock.calls[0][0].trim());
    expect(output.level).toBe("warn");
  });

  it("suppresses debug when LOG_LEVEL is info", async () => {
    const { default: log } = await import("../../src/lib/logger.js");
    log.debug("hidden");
    expect(stdoutSpy).not.toHaveBeenCalled();
  });
});
