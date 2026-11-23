import { describe, expect, test } from "bun:test";
import { formatCode, formatScript, languageOf } from "../extensions/languages";
import { formatMarkdownCode } from "../extensions/markdown";

describe("languageOf", () => {
  test("maps common fence tags", () => {
    expect(languageOf("ts")).toBe("typescript");
    expect(languageOf("Python")).toBe("python");
    expect(languageOf("sh")).toBe("shell");
    expect(languageOf("yml")).toBe("yaml");
    expect(languageOf("rust")).toBeNull();
    expect(languageOf(undefined)).toBeNull();
  });
});

describe("formatCode", () => {
  test("typescript", () => {
    expect(formatCode("const a={b:1};function f(x){if(x){return x*2}return 0}", "typescript")).toBe(
      "const a = { b: 1 };\nfunction f(x) {\n  if (x) {\n    return x * 2;\n  }\n  return 0;\n}",
    );
  });
  test("python", () => {
    expect(formatCode("def f(x):\n  if x: return {'a':1}\n  return None", "python")).toBe(
      'def f(x):\n    if x:\n        return {"a": 1}\n    return None',
    );
  });
  test("go", () => {
    expect(formatCode("package main\nfunc main(){\nx:=1\nif x>0{println(x)}}", "go")).toBe("package main\n\nfunc main() {\n\tx := 1\n\tif x > 0 {\n\t\tprintln(x)\n\t}\n}");
  });
  test("sql", () => {
    expect(formatCode("select a,b from t where a>1", "sql")).toBe("select\n  a,\n  b\nfrom\n  t\nwhere\n  a > 1");
  });
  test("yaml", () => {
    expect(formatCode("a:   1\nc:\n    d: e", "yaml")).toBe("a: 1\nc:\n  d: e");
  });
  test("json", () => {
    expect(formatCode('{"a":1,"b":[1,2]}', "json")).toBe('{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ]\n}');
  });
  test("shell", () => {
    expect(formatCode("cd x && make | tail -3", "shell")).toBe("cd x &&\n  make |\n  tail -3");
  });
  test("broken code is shown exactly as written", () => {
    expect(formatCode("def f(:\n x", "python")).toBe("def f(:\n x");
    expect(formatCode("func {", "go")).toBe("func {");
    expect(formatCode("const a = {\nfoo(", "typescript")).toBe("const a = {\nfoo(");
    expect(formatCode("{nope", "json")).toBe("{nope");
  });
  test("wraps to the width it is given", () => {
    const line = "return sum([i['price'] * i['qty'] for i in items if i.get('qty', 0) > 0])";
    const narrow = formatCode(`def total(items):\n    ${line}`, "python", 60);
    expect(narrow.split("\n").every((l) => l.length <= 60)).toBe(true);
    expect(formatCode(`def total(items):\n    ${line}`, "python", 200).split("\n").length).toBe(2);
  });
  test("unknown languages pass through", () => {
    expect(formatCode("fn main(){}", null)).toBe("fn main(){}");
  });
});

describe("formatScript", () => {
  test("formats top-level await and return as a function body", () => {
    expect(formatScript("const r = await tools.bash({command:'ls'}); return r.output.length")).toBe(
      'const r = await tools.bash({ command: "ls" });\nreturn r.output.length;',
    );
  });
  test("broken scripts keep their tokens", () => {
    expect(formatScript("const = ").trim()).toBe("const =");
  });
});

describe("formatMarkdownCode", () => {
  test("formats tagged fences and leaves prose alone", () => {
    const markdown = "Run this:\n\n```ts\nconst a={b:1}\n```\n\nand `x&&y` inline.";
    expect(formatMarkdownCode(markdown)).toBe("Run this:\n\n```ts\nconst a = { b: 1 };\n```\n\nand `x&&y` inline.");
  });
  test("untagged and unknown fences are untouched", () => {
    const markdown = "```\na&&b\n```\n\n```rust\nfn x(){}\n```";
    expect(formatMarkdownCode(markdown)).toBe(markdown);
  });
  test("several fences in one message", () => {
    const markdown = "```py\nx=1\n```\ntext\n```sql\nselect a from t\n```";
    expect(formatMarkdownCode(markdown)).toBe("```py\nx = 1\n```\ntext\n```sql\nselect\n  a\nfrom\n  t\n```");
  });
});
