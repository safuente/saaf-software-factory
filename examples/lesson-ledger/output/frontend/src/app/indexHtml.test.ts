import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const html = readFileSync(resolve(__dirname, "../../index.html"), "utf8");
const doc = new DOMParser().parseFromString(html, "text/html");

describe("AC-5 served HTML document", () => {
  it("declares English as the page language", () => {
    expect(doc.documentElement.getAttribute("lang")).toBe("en");
  });

  it("has the title 'Lesson Ledger' before any script runs", () => {
    expect(doc.title).toBe("Lesson Ledger");
  });

  it("tells users without JavaScript what is needed", () => {
    expect(doc.querySelector("noscript")?.textContent?.trim()).toBe(
      "Lesson Ledger needs JavaScript enabled.",
    );
  });

  it("has no inline scripts or styles, so the CSP default-src 'self' holds", () => {
    const inlineScripts = [...doc.querySelectorAll("script")].filter((s) => !s.src);
    expect(inlineScripts).toHaveLength(0);
    expect(doc.querySelectorAll("style, [style]")).toHaveLength(0);
  });
});
