/**
 * F08 AC-4 and AC-5 (b, c), and F09 AC-4: the only spec that runs without reduced motion. It checks the motion
 * of ADR-007 with `prefers-reduced-motion: no-preference`, then the same elements with `reduce`.
 *
 * Deterministic: it reads computed styles and animation state only. Animations are frozen at
 * their start through the DevTools Animation domain (playback rate 0), so the test never waits
 * on elapsed time or frames and always sees the strongest colour of the highlight.
 */
import { expect, test, type Page } from "@playwright/test";
import { LESSON_B, addF03Data, contrast } from "./support/f08";
import { longestMotion } from "./support/layout";
import { PASSWORD, forgetTeacher, signUp, uniqueEmail } from "./support/stack";

test.use({ reducedMotion: "no-preference" });

const UNDO_B = "Undo paid: Adam Lee, Nov 10, 2026";
const MARKED_B = "Marked as paid. Collected: $102.50, pending: $0.00.";

/** Freezes every animation at its current time (new ones at their start). */
async function freezeAnimations(page: Page): Promise<void> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Animation.enable");
  await cdp.send("Animation.setPlaybackRate", { playbackRate: 0 });
}

/** Computed motion of the elements matched by `selector`. */
async function motionOf(page: Page, selector: string) {
  return page.locator(selector).evaluateAll((els) =>
    els.map((el) => {
      const s = getComputedStyle(el);
      return {
        name: s.animationName,
        duration: s.animationDuration,
        count: s.animationIterationCount,
        running: el.getAnimations().length,
        opacity: s.opacity,
      };
    }),
  );
}

const seconds = (value: string) => parseFloat(value) * (value.endsWith("ms") ? 1 : 1000);

/** Every element's animation iteration count and the longest transition or animation (AC-4 e). */
async function expectBoundedMotion(page: Page, where: string): Promise<void> {
  const counts = await page.evaluate(() => [
    ...new Set(
      [...document.querySelectorAll("*")].flatMap((el) =>
        [null, "::before", "::after"].map((p) => getComputedStyle(el, p).animationIterationCount),
      ),
    ),
  ]);
  expect(counts, `${where}: iteration counts`).toEqual(["1"]);
  expect(await longestMotion(page), `${where}: longest`).toBeLessThanOrEqual(1000);
}

async function openSummary(page: Page): Promise<void> {
  await page.goto("/summary?month=2026-11");
  await expect(page.getByRole("table")).toBeVisible();
}

test.describe("F08 AC-4 / AC-5 motion on and off", () => {
  const email = uniqueEmail();

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signUp(page, email, PASSWORD);
    await addF03Data(page.request);
  });
  test.afterEach(() => forgetTeacher(email));

  test("AC-4a interaction transitions: 150-200 ms on colours only, never on the focus ring", async ({
    page,
  }) => {
    const targets: [string, string][] = [
      ["/summary?month=2026-11", 'nav[aria-label="Main"] a'],
      ["/summary?month=2026-11", "main button"],
      ["/summary?month=2026-11", "header button"],
      ["/", "main a"],
    ];
    for (const [path, selector] of targets) {
      await page.goto(path);
      await expect(page.locator(selector).first()).toBeVisible();
      const transitions = await page.locator(selector).evaluateAll((els) =>
        els.map((el) => {
          const s = getComputedStyle(el);
          return {
            name: (el.textContent ?? "").trim(),
            property: s.transitionProperty,
            durations: s.transitionDuration.split(",").map((d) => d.trim()),
          };
        }),
      );
      expect(transitions.length, selector).toBeGreaterThan(0);
      for (const t of transitions) {
        const properties = t.property.split(",").map((p) => p.trim());
        for (const p of properties) {
          expect(
            ["color", "background-color", "border-color", "text-decoration-color"],
            `${path} ${t.name}: ${p}`,
          ).toContain(p);
        }
        for (const d of t.durations) {
          expect(seconds(d), `${t.name} ${d}`).toBeGreaterThanOrEqual(150);
          expect(seconds(d), `${t.name} ${d}`).toBeLessThanOrEqual(200);
        }
      }
    }
    await page.context().clearCookies();
    await page.goto("/login");
    for (const el of [
      page.getByRole("button", { name: "Log in" }),
      page.getByRole("link", { name: "Create an account" }),
    ]) {
      const s = await el.evaluate((e) => getComputedStyle(e).transitionProperty);
      expect(s).not.toMatch(/all|outline|box-shadow/);
      expect(s).toMatch(/color/);
    }
  });

  test("AC-4b,c,d,e then AC-5b: load motion, the highlight, and nothing under reduce", async ({
    page,
  }) => {
    await freezeAnimations(page);
    await openSummary(page);

    // (b) one grow on the paid segment when the panel appears.
    const [bar] = await motionOf(page, "[data-segment=paid]");
    expect(bar).toMatchObject({ name: "grow-in", count: "1", running: 1 });
    expect(seconds(bar?.duration ?? "")).toBeLessThanOrEqual(1000);
    expect((await motionOf(page, "[data-segment=pending]"))[0]?.name).toBe("none");

    // (c) one fade on the panel's values; their text is in the accessibility tree at once.
    const values = await motionOf(page, "[data-metrics-panel] dd, [data-metrics-panel] p");
    expect(values).toHaveLength(5);
    for (const v of values) {
      expect(v).toMatchObject({ name: "fade-in", count: "1", running: 1, opacity: "0" });
      expect(seconds(v.duration)).toBeLessThanOrEqual(1000);
    }
    await expect(page.getByRole("definition")).toHaveText(["3", "$42.50", "$60.00"]);
    await expect(page.getByText("41% paid · 59% pending", { exact: true })).toBeAttached();
    await expectBoundedMotion(page, "/summary");

    // (d) mark lesson B: one highlight on its row, at its strongest colour while frozen.
    await page.evaluate(() => {
      const w = window as unknown as { __before: Animation[] };
      w.__before = document.getAnimations();
    });
    // By keyboard, so the re-focused button shows its focus ring (focus-visible).
    await page.getByRole("button", { name: LESSON_B, exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status").filter({ hasText: MARKED_B })).toBeAttached();
    const undo = page.getByRole("button", { name: UNDO_B, exact: true });
    await expect(undo).toBeFocused();
    const row = undo.locator("xpath=ancestor::tr");
    await expect(row.getByText("Paid", { exact: true })).toBeVisible();

    const highlight = await row.evaluate((tr) => {
      const w = window as unknown as { __before: Animation[] };
      const fresh = document
        .getAnimations()
        .filter((a) => !w.__before.includes(a) && a instanceof CSSAnimation);
      const cells = [...tr.querySelectorAll("td")];
      const css = getComputedStyle(cells[0] as Element);
      const ground = getComputedStyle(cells[1] as Element).backgroundColor;
      const texts = [...tr.querySelectorAll<HTMLElement>("td *, td")]
        .filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim()))
        .filter((el) => !el.closest("button"))
        .map((el) => getComputedStyle(el).color);
      const button = tr.querySelector("button") as HTMLElement;
      return {
        names: [...new Set(fresh.map((a) => (a as CSSAnimation).animationName))],
        targets: [...new Set(fresh.map((a) => (a.effect as KeyframeEffect).target?.tagName))],
        count: css.animationIterationCount,
        duration: css.animationDuration,
        ground,
        texts,
        border: getComputedStyle(button).borderColor,
        ring: getComputedStyle(button).outlineColor,
        ringStyle: getComputedStyle(button).outlineStyle,
      };
    });
    expect(highlight.names).toEqual(["paid-highlight"]);
    expect(highlight.targets).toEqual(["TD"]);
    expect(highlight.count).toBe("1");
    expect(seconds(highlight.duration)).toBeLessThanOrEqual(1000);
    expect(highlight.ground).not.toBe("rgba(0, 0, 0, 0)");
    expect(highlight.ground).not.toBe("rgb(255, 255, 255)");
    expect(highlight.texts.length).toBeGreaterThanOrEqual(4);
    for (const colour of highlight.texts) {
      expect(contrast(colour, highlight.ground), colour).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrast(highlight.border, highlight.ground)).toBeGreaterThanOrEqual(3);
    expect(highlight.ringStyle).not.toBe("none");
    expect(contrast(highlight.ring, highlight.ground)).toBeGreaterThanOrEqual(3);

    // (b, c) after the mark the bar and figures change in place, with no new animation.
    await expect(page.getByText("100% paid · 0% pending", { exact: true })).toBeAttached();
    const replayed = await page.evaluate(() => {
      const w = window as unknown as { __before: Animation[] };
      return document
        .getAnimations()
        .filter((a) => !w.__before.includes(a) && a instanceof CSSAnimation)
        .map((a) => (a as CSSAnimation).animationName)
        .filter((name) => name !== "paid-highlight");
    });
    expect(replayed).toEqual([]);

    // (d) Undo paid: no highlight, and no new animation.
    await page.evaluate(() => {
      const w = window as unknown as { __before: Animation[] };
      w.__before = document.getAnimations();
    });
    await undo.click();
    await expect(page.getByRole("button", { name: LESSON_B, exact: true })).toBeFocused();
    const afterUndo = await page.evaluate(() => {
      const w = window as unknown as { __before: Animation[] };
      return document
        .getAnimations()
        .filter((a) => !w.__before.includes(a) && a instanceof CSSAnimation)
        .map((a) => (a as CSSAnimation).animationName);
    });
    expect(afterUndo).toEqual([]);
    expect(
      await page
        .getByRole("button", { name: LESSON_B, exact: true })
        .locator("xpath=ancestor::tr")

        .locator("td")
        .first()
        .evaluate((td) => getComputedStyle(td).animationName),
    ).toBe("none");

    // Home's four figures fade in once.
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 2, name: "Oldest unpaid lessons" }),
    ).toBeVisible();
    const figures = await motionOf(page, "main dd");
    expect(figures).toHaveLength(4);
    for (const f of figures) expect(f).toMatchObject({ name: "fade-in", count: "1", running: 1 });
    await expectBoundedMotion(page, "/");

    // AC-5 (a, b): the same elements with reduce.
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await longestMotion(page), "/ reduce").toBeLessThanOrEqual(0.01);
    for (const f of await motionOf(page, "main dd")) {
      expect(f).toMatchObject({ name: "none", running: 0, opacity: "1" });
    }
    await openSummary(page);
    const first = await page.evaluate(() => {
      const bar = document.querySelector("[data-metrics-panel] svg")?.getBoundingClientRect();
      const paid = document.querySelector("[data-segment=paid]")?.getBoundingClientRect();
      const values = [
        ...document.querySelectorAll("[data-metrics-panel] dd, [data-metrics-panel] p"),
      ].map((el) => getComputedStyle(el).opacity);
      return {
        ratio: (paid?.width ?? 0) / (bar?.width ?? 1),
        values,
        all: document.getAnimations().length,
      };
    });
    expect(Math.abs(first.ratio - 0.41)).toBeLessThanOrEqual(0.01);
    expect(first.values).toEqual(["1", "1", "1", "1", "1"]);
    expect(first.all).toBe(0);
    expect(await longestMotion(page), "/summary reduce").toBeLessThanOrEqual(0.01);

    await page.getByRole("button", { name: LESSON_B, exact: true }).click();
    await expect(page.getByRole("button", { name: UNDO_B, exact: true })).toBeFocused();
    const grounds = await page.evaluate(() =>
      [...document.querySelectorAll("tbody tr")].map((tr) =>
        [...tr.querySelectorAll("td")].map((td) => getComputedStyle(td).backgroundColor).join(" "),
      ),
    );
    expect(new Set(grounds).size, grounds.join(" | ")).toBe(1);
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  });

  test("AC-4d a failed mark, and Mark as paid on /pending and Home: no highlight, rows leave", async ({
    page,
  }) => {
    await freezeAnimations(page);
    await openSummary(page);
    await page.route("**/api/lessons/*", (route) =>
      route.request().method() === "PATCH"
        ? route.fulfill({ status: 503, body: "" })
        : route.fallback(),
    );
    await page.getByRole("button", { name: LESSON_B, exact: true }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    expect(
      await page.evaluate(() =>
        document.getAnimations().map((a) => (a as CSSAnimation).animationName),
      ),
    ).not.toContain("paid-highlight");
    await page.unroute("**/api/lessons/*");

    for (const path of ["/pending", "/"]) {
      await page.goto(path);
      const mark = page.getByRole("button", { name: LESSON_B, exact: true });
      await expect(mark).toBeVisible();
      await mark.click();
      await expect(mark).toHaveCount(0);
      expect(
        await page.evaluate(() =>
          document.getAnimations().map((a) => (a as CSSAnimation).animationName),
        ),
        path,
      ).not.toContain("paid-highlight");
      // Undo through the API so the next page has lesson B unpaid again.
      const lessons = await page.request.get("/api/lessons?month=2026-11&page=1&page_size=500");
      const b = (await lessons.json()).items.find(
        (l: { student: { name: string }; price: { amount: number } }) =>
          l.student.name === "Adam Lee" && l.price.amount === 6000,
      );
      expect(
        (await page.request.patch(`/api/lessons/${b.id}`, { data: { paid: false } })).status(),
      ).toBe(200);
    }
  });
});

/**
 * F09 AC-4 (ADR-008): one entrance of the signed-out brand panel from 1024 px, never on the form,
 * never replayed by the page's own states, and off under reduced motion. Animations are frozen at
 * their start (as above), so every measurement is the page's first frame.
 */
test.describe("F09 AC-4 entrance of the brand panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  /** The CSS animations running now, with what they animate. */
  async function cssAnimations(page: Page) {
    return page.evaluate(() =>
      document
        .getAnimations()
        .filter((a): a is CSSAnimation => a instanceof CSSAnimation)
        .map((a) => {
          const target = (a.effect as KeyframeEffect).target as Element;
          const s = getComputedStyle(target);
          const properties = new Set(
            (a.effect as KeyframeEffect)
              .getKeyframes()
              .flatMap((k) => Object.keys(k))
              .filter((k) => !["offset", "computedOffset", "easing", "composite"].includes(k)),
          );
          return {
            name: a.animationName,
            inHeader: Boolean(target.closest("header")),
            inForm: Boolean(target.closest("form")),
            count: s.animationIterationCount,
            duration: s.animationDuration,
            easing: s.animationTimingFunction,
            properties: [...properties].sort(),
          };
        }),
    );
  }

  /** The entrance tokens as computed styles print them (resolved through a probe element). */
  async function entranceTokens(page: Page) {
    return page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.animationDuration = "var(--duration-entrance)";
      probe.style.animationTimingFunction = "var(--ease-decelerate)";
      document.body.append(probe);
      const s = getComputedStyle(probe);
      const tokens = { duration: s.animationDuration, easing: s.animationTimingFunction };
      probe.remove();
      return tokens;
    });
  }

  /** Opacity, transform, running animations and box of every field and button of the form. */
  async function controls(page: Page) {
    return page.locator("form input, form button, form a").evaluateAll((els) =>
      els.map((el) => {
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return {
          opacity: s.opacity,
          transform: s.transform,
          running: el.getAnimations().length,
          box: [r.left, r.top, r.width, r.height].map((v) => Math.round(v * 10) / 10),
        };
      }),
    );
  }

  const markAnimations = (page: Page) =>
    page.evaluate(() => {
      const w = window as unknown as { __before: Animation[] };
      w.__before = document.getAnimations();
    });
  const newAnimations = (page: Page) =>
    page.evaluate(() => {
      const w = window as unknown as { __before: Animation[] };
      return document
        .getAnimations()
        .filter((a) => !w.__before.includes(a) && a instanceof CSSAnimation)
        .map((a) => (a as CSSAnimation).animationName);
    });

  for (const [path, heading] of [
    ["/login", "Log in"],
    ["/signup", "Create your account"],
  ] as const) {
    test(`AC-4a,b ${path}: one entrance on the panel; the form final and usable at once`, async ({
      page,
    }) => {
      await freezeAnimations(page);
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();

      // (b) first measurement: the form is final.
      const first = await controls(page);
      expect(first.length).toBeGreaterThanOrEqual(4);
      for (const c of first) {
        expect([c.opacity, c.transform, c.running]).toEqual(["1", "none", 0]);
      }

      // (a) exactly one animation, on the panel, opacity/transform only, from theme tokens.
      const animations = await cssAnimations(page);
      expect(animations).toHaveLength(1);
      const [entrance] = animations;
      const tokens = await entranceTokens(page);
      expect(entrance).toMatchObject({ inHeader: true, inForm: false, count: "1" });
      expect(seconds(entrance?.duration ?? "")).toBeLessThanOrEqual(1000);
      expect(seconds(entrance?.duration ?? "")).toBe(seconds(tokens.duration));
      expect(entrance?.easing).toBe(tokens.easing);
      for (const property of entrance?.properties ?? []) {
        expect(["opacity", "transform"]).toContain(property);
      }
      const animated = await page.evaluate(
        () =>
          [...document.querySelectorAll("*")].filter(
            (el) => getComputedStyle(el).animationName !== "none",
          ).length,
      );
      expect(animated).toBe(1);

      // (b) the boxes after every animation finished equal the first frame's.
      await page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));
      expect(await controls(page)).toEqual(first);

      // (b) usable without waiting.
      await page.getByLabel("Email").focus();
      await page.keyboard.type("someone@example.com");
      await page.keyboard.press("Tab");
      await expect(page.getByLabel("Password")).toBeFocused();
      await expect(page.getByLabel("Email")).toHaveValue("someone@example.com");
    });
  }

  test("AC-4c links replay it once per page; errors, submitting and the notice do not", async ({
    page,
  }) => {
    await freezeAnimations(page);
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1, name: "Log in" })).toBeVisible();

    await markAnimations(page);
    await page.getByRole("link", { name: "Create an account" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Create your account" }),
    ).toBeVisible();
    expect(await newAnimations(page)).toHaveLength(1);
    await markAnimations(page);
    await page.getByRole("link", { name: "Log in" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Log in" })).toBeVisible();
    expect(await newAnimations(page)).toHaveLength(1);

    // Field error, failed log in and the submitting state on the same page: nothing new.
    await markAnimations(page);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("Enter your email.")).toBeVisible();
    await page.getByLabel("Email").fill("nobody@example.com");
    await page.getByLabel("Password").fill(PASSWORD);
    let release = () => {};
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route("**/api/sessions", async (route) => {
      await held;
      await route.fallback();
    });
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByRole("button", { name: "Logging in…" })).toBeDisabled();
    expect(await newAnimations(page)).toEqual([]);
    release();
    await expect(page.getByRole("alert")).toHaveText("Email or password is incorrect.");
    expect(await newAnimations(page)).toEqual([]);
    await page.unrouteAll();

    // The notice appearing after a confirmed log out: the entrance of that page only.
    const email = uniqueEmail();
    try {
      await signUp(page, email, PASSWORD);
      await page.getByRole("button", { name: "Log out" }).click();
      await expect(page.getByRole("heading", { level: 1, name: "Log in" })).toBeVisible();
      await markAnimations(page);
      await expect(
        page.getByRole("status").filter({ hasText: "You have logged out." }),
      ).toBeVisible();
      expect(await newAnimations(page)).toEqual([]);
      expect(
        (await cssAnimations(page)).filter((a) => a.inHeader && a.name !== "none"),
      ).toHaveLength(1);
    } finally {
      forgetTeacher(email);
    }
  });

  test("AC-4d below 1024 px the brand strip does not animate", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await freezeAnimations(page);
    for (const path of ["/login", "/signup"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(await cssAnimations(page), path).toEqual([]);
      const names = await page
        .locator("header, header *")
        .evaluateAll((els) => els.map((el) => getComputedStyle(el).animationName));
      expect(new Set(names), path).toEqual(new Set(["none"]));
    }
  });

  test("AC-4e with reduce: nothing moves at either width and the panel is final at once", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const width of [375, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      for (const path of ["/login", "/signup"]) {
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        // The panel and its parts (the drawing's own shapes keep their SVG transforms).
        const panel = await page
          .locator("header, header > div, header > div > *, header svg")
          .evaluateAll((els) =>
            els.map((el) => [getComputedStyle(el).opacity, getComputedStyle(el).transform]),
          );
        for (const [opacity, transform] of panel) {
          expect([opacity, transform], `${path} ${width}`).toEqual(["1", "none"]);
        }
        expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
        expect(await longestMotion(page), `${path} ${width}`).toBeLessThanOrEqual(0.01);
      }
    }
  });
});
