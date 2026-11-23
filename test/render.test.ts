import { describe, expect, test } from "bun:test";
import legible from "../extensions/legible";

type Resolver = (name: string, next: () => unknown) => any;

function load() {
  let resolver: Resolver | undefined;
  let transformer: ((markdown: string, context: { isStreaming: boolean; availableWidth?: number }) => string) | undefined;
  const api = {
    registerToolRenderer: (r: Resolver) => { resolver = r; },
    registerMarkdownTransformer: (t: typeof transformer) => { transformer = t; },
    on: () => {},
  };
  legible(api as never);
  return { resolver: resolver!, transformer: transformer! };
}

const theme = { fg: (_color: string, text: string) => text, bold: (text: string) => text };
const done = { argsComplete: true, lastComponent: undefined };

describe("tool renderers", () => {
  test("bash calls render one step per line", () => {
    const renderers = load().resolver("bash", () => undefined);
    const lines = renderers.renderCall({ command: "cd x && make | tail -3; echo ok" }, theme, done).render(80).map((l: string) => l.trimEnd());
    expect(lines).toEqual(["$ cd x &&", "    make |", "    tail -3", "  echo ok"]);
  });
  test("codemode scripts are formatted", () => {
    const renderers = load().resolver("codemode", () => undefined);
    const lines = renderers.renderCall({ code: "const r=await tools.read({path:'a'});return r" }, theme, done).render(80).map((l: string) => l.trimEnd());
    expect(lines).toEqual(['js const r = await tools.read({ path: "a" });', "  return r;"]);
  });
  test("while arguments stream, the original renderer is used", () => {
    const original = { renderCall: () => "ORIGINAL" };
    const renderers = load().resolver("bash", () => original);
    expect(renderers.renderCall({ command: "a && b" }, theme, { argsComplete: false, executionStarted: false, isPartial: true })).toBe("ORIGINAL");
  });
  test("calls restored from a saved session are formatted", () => {
    const renderers = load().resolver("bash", () => undefined);
    const restored = { argsComplete: false, executionStarted: false, isPartial: false, lastComponent: undefined };
    const lines = renderers.renderCall({ command: "a && b" }, theme, restored).render(80).map((l: string) => l.trimEnd());
    expect(lines).toEqual(["$ a &&", "    b"]);
  });
  test("other tools are untouched", () => {
    expect(load().resolver("read", () => "NEXT")).toBe("NEXT");
  });
});

describe("markdown", () => {
  test("finished messages get formatted code blocks", () => {
    expect(load().transformer("```py\nx=1\n```", { isStreaming: false, availableWidth: 80 })).toBe("```py\nx = 1\n```");
  });
  test("streaming messages are left alone", () => {
    expect(load().transformer("```py\nx=1\n```", { isStreaming: true })).toBe("```py\nx=1\n```");
  });
});
