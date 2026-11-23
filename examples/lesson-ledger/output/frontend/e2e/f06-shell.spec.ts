/** F06 AC-2 and AC-6 a, b: the dark sidebar (top bar below 1024 px) on every app page, the
 * title, buttons, log out from any page, the auth pages without the shell, contrast on the dark
 * ground and the shell's reach at small, landscape and 200% text sizes. */
import { expect, test, type Page } from "@playwright/test";
import {
  APP_PAGES,
  NAV_LINKS,
  clippedElements,
  expectNoClipOrOverlap,
  expectNoHorizontalScroll,
} from "./support/layout";
import { ALICE, PASSWORD, forgetTeacher, logIn, signUp, uniqueEmail } from "./support/stack";

/** Computed geometry and style of the shell, `main`, the h1 and the nav links. */
async function shell(page: Page) {
  return page.evaluate(() => {
    const box = (el: Element | null) => {
      const r = el?.getBoundingClientRect();
      // A missing element measures NaN, so every comparison with it fails.
      return r
        ? { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom }
        : { x: NaN, y: NaN, width: NaN, height: NaN, bottom: NaN };
    };
    const header = document.querySelector("header");
    const main = document.querySelector("main");
    const nav = document.querySelector('nav[aria-label="Main"]');
    const logOut = [...document.querySelectorAll("button")].find(
      (b) => b.textContent === "Log out",
    );
    const h1 = document.querySelector("main h1");
    const positions = [header, ...(header?.querySelectorAll("*") ?? [])].map(
      (el) => el && getComputedStyle(el).position,
    );
    return {
      header: box(header),
      headerBackground: header ? getComputedStyle(header).backgroundColor : "",
      main: box(main),
      mainBackground: main ? getComputedStyle(main).backgroundColor : "",
      nav: box(nav),
      navInHeader: Boolean(header && nav && header.contains(nav)),
      logOut: box(logOut ?? null),
      logOutInHeader: Boolean(header && logOut && header.contains(logOut)),
      logOutInNav: Boolean(nav && logOut && nav.contains(logOut)),
      links: [...(nav?.querySelectorAll("a") ?? [])].map((a) => ({
        text: a.textContent,
        box: box(a),
        current: a.getAttribute("aria-current"),
        weight: getComputedStyle(a).fontWeight,
        decoration: getComputedStyle(a).textDecorationLine,
        background: getComputedStyle(a).backgroundColor,
      })),
      positions,
      h1Font: h1 ? getComputedStyle(h1).fontFamily : "",
      h1Size: h1 ? parseFloat(getComputedStyle(h1).fontSize) : 0,
      headerScrolls: header
        ? [header, ...header.querySelectorAll("*")].some(
            (el) => el.scrollWidth > el.clientWidth + 1,
          )
        : false,
      viewport: { width: innerWidth, height: innerHeight },
    };
  });
}

/** px of the theme's `title` step. */
const titlePx = (page: Page) =>
  page.evaluate(() => {
    const probe = document.createElement("span");
    probe.className = "text-title";
    document.body.append(probe);
    const px = parseFloat(getComputedStyle(probe).fontSize);
    probe.remove();
    return px;
  });

async function openApp(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Loading…" })).toHaveCount(0);
}

test.describe("F06 AC-2 the shell", () => {
  test.beforeEach(async ({ page }) => {
    await logIn(page, ALICE.email, ALICE.password);
  });

  test("AC-2a,c,e at 1280 px: a dark sidebar left of a white main, at least viewport tall, Log out at its bottom", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const title = await titlePx(page);
    for (const path of APP_PAGES) {
      await openApp(page, path);
      const s = await shell(page);
      expect(s.navInHeader && s.logOutInHeader && !s.logOutInNav, path).toBe(true);
      expect(s.headerBackground, path).toBe("rgb(27, 31, 38)");
      expect(s.mainBackground, path).toBe("rgb(255, 255, 255)");
      expect(s.header.x + s.header.width, `${path}: sidebar left of main`).toBeLessThanOrEqual(
        s.main.x + 0.5,
      );
      expect(s.header.height, `${path}: sidebar height`).toBeGreaterThanOrEqual(800);
      expect(s.links.map((l) => l.text)).toEqual(NAV_LINKS);
      const lastLink = s.links.at(-1)?.box;
      expect(s.logOut.y, `${path}: Log out below the links`).toBeGreaterThan(
        lastLink?.bottom ?? Infinity,
      );
      expect(s.logOut.bottom, `${path}: Log out inside the sidebar`).toBeLessThanOrEqual(
        s.header.bottom,
      );
      expect(
        s.header.bottom - s.logOut.bottom,
        `${path}: Log out at the sidebar's bottom`,
      ).toBeLessThanOrEqual(64);
      expect(
        s.positions.filter((p) => p === "fixed" || p === "sticky"),
        path,
      ).toEqual([]);
      expect(s.h1Font, path).toMatch(/^"?Inter"?,/);
      expect(s.h1Size, path).toBe(title);
    }
  });

  test("AC-2a at 1280 px on a page taller than the viewport: Log out at the bottom of the full sidebar, not of the first screen", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openApp(page, "/lessons");
    await expect(page.getByRole("table")).toBeVisible();
    const s = await shell(page);
    expect(s.header.height, "alice's /lessons is taller than the viewport").toBeGreaterThan(900);
    expect(s.logOut.bottom).toBeLessThanOrEqual(s.header.bottom);
    expect(s.header.bottom - s.logOut.bottom).toBeLessThanOrEqual(64);
  });

  test("AC-2b,c below 1024 px: a full-width dark bar above main, links wrap, no toggle or scroll", async ({
    page,
  }) => {
    for (const width of [320, 375, 768, 1000]) {
      await page.setViewportSize({ width, height: 800 });
      for (const path of APP_PAGES) {
        await openApp(page, path);
        const s = await shell(page);
        const name = `${path} at ${width}`;
        expect(s.header.x, name).toBe(0);
        expect(s.header.width, name).toBe(width);
        expect(s.header.bottom, `${name}: bar above main`).toBeLessThanOrEqual(s.main.y + 0.5);
        expect(s.headerBackground, name).toBe("rgb(27, 31, 38)");
        expect(s.headerScrolls, `${name}: scrolls inside the bar`).toBe(false);
        expect(
          s.positions.filter((p) => p === "fixed" || p === "sticky"),
          name,
        ).toEqual([]);
        for (const link of s.links) {
          expect(link.box.x + link.box.width, `${name}: ${link.text}`).toBeLessThanOrEqual(width);
        }
        expect(s.logOut.x + s.logOut.width, `${name}: Log out`).toBeLessThanOrEqual(width);
        await expect(
          page.getByRole("navigation", { name: "Main" }).getByRole("button"),
        ).toHaveCount(0);
      }
    }
  });

  test("AC-2d the current link has aria-current and a heavier weight and a pill", async ({
    page,
  }) => {
    for (const width of [1280, 375]) {
      await page.setViewportSize({ width, height: 800 });
      for (const [index, path] of APP_PAGES.entries()) {
        await openApp(page, path);
        const { links } = await shell(page);
        const current = links[index] ?? links[0];
        if (!current) throw new Error("no links");
        expect(current.current, path).toBe("page");
        for (const other of links.filter((_, i) => i !== index)) {
          expect(other.current).toBeNull();
          expect(Number(current.weight), `${path}: weight`).toBeGreaterThan(Number(other.weight));
          expect(current.background, `${path}: pill`).not.toBe(other.background);
        }
      }
    }
  });

  test("AC-2f Log out from /pending sends DELETE, disables the button and lands on /login; a failure alerts at the top of main", async ({
    page,
  }) => {
    await openApp(page, "/pending");
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route("**/api/sessions/current", async (route) => {
      if (route.request().method() !== "DELETE") return route.fallback();
      await held;
      await route.fulfill({ status: 503, body: "" });
    });
    const logOut = page.getByRole("button", { name: "Log out" });
    await logOut.click();
    await expect(logOut).toBeDisabled();
    release();
    const alert = page.getByRole("alert");
    await expect(alert).toHaveText("Couldn't log out. Please try again.");
    expect(
      await alert.evaluate(
        (el) => el.parentElement?.tagName === "MAIN" && !el.previousElementSibling,
      ),
    ).toBe(true);
    await expect(logOut).toBeEnabled();
    await expect(page).toHaveURL(/\/pending$/);

    await page.unrouteAll();
    const [request] = await Promise.all([
      page.waitForRequest(
        (r) => r.method() === "DELETE" && r.url().endsWith("/api/sessions/current"),
      ),
      logOut.click(),
    ]);
    expect(request).toBeTruthy();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("AC-2f / still shows the email line and one Log out", async ({ page }) => {
    await openApp(page, "/");
    await expect(page.getByText(`Signed in as ${ALICE.email}`)).toBeVisible();
    await expect(page.getByRole("button", { name: "Log out" })).toHaveCount(1);
  });

  test("AC-2h primary buttons are black with white text; secondary are white or clear, outlined, dark text", async ({
    page,
  }) => {
    const style = (name: string | RegExp) =>
      page
        .getByRole("button", { name, exact: true })
        .first()
        .evaluate((el) => {
          const s = getComputedStyle(el);
          return {
            background: s.backgroundColor,
            color: s.color,
            border: `${s.borderTopWidth} ${s.borderTopStyle}`,
          };
        });
    await openApp(page, "/students");
    expect(await style("Add student")).toMatchObject({
      background: "rgb(0, 0, 0)",
      color: "rgb(255, 255, 255)",
    });
    await openApp(page, "/summary");
    for (const name of ["Previous month", "Next month", "Log out"]) {
      const s = await style(name);
      expect(["rgb(255, 255, 255)", "rgba(0, 0, 0, 0)"], name).toContain(s.background);
      expect(s.border, name).toBe("1px solid");
      expect(s.color, name).toBe("rgb(29, 33, 39)");
    }
    await openApp(page, "/pending");
    const mark = await style(/^Mark as paid: /);
    expect(mark).toEqual({
      background: "rgb(255, 255, 255)",
      color: "rgb(29, 33, 39)",
      border: "1px solid",
    });
  });
});

test("AC-2g /login and /signup: no sidebar navigation, a white page, the title style and the primary button", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const title = await (async () => {
    await page.goto("/login");
    return titlePx(page);
  })();
  for (const [path, submit] of [
    ["/login", "Log in"],
    ["/signup", "Create account"],
  ] as const) {
    await page.goto(path);
    // F09 (ADR-008): the page's header is now the brand panel, without navigation or Log out.
    await expect(page.locator("header")).toHaveCount(1);
    await expect(page.locator("header").locator("a, button")).toHaveCount(0);
    await expect(page.getByRole("navigation")).toHaveCount(0);
    const s = await shell(page);
    expect(s.mainBackground).toBe("rgb(255, 255, 255)");
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toMatch(
      /rgb\(255, 255, 255\)|rgba\(0, 0, 0, 0\)/,
    );
    expect(
      await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor),
    ).toBe("rgb(255, 255, 255)");
    expect(s.h1Size).toBe(title);
    expect(s.h1Font).toMatch(/^"?Inter"?,/);
    const button = await page.getByRole("button", { name: submit }).evaluate((el) => ({
      background: getComputedStyle(el).backgroundColor,
      color: getComputedStyle(el).color,
    }));
    expect(button).toEqual({ background: "rgb(0, 0, 0)", color: "rgb(255, 255, 255)" });
  }
});

/** WCAG relative-luminance contrast of two computed `rgb()` colours. */
function contrast(a: string, b: string): number {
  const lum = (c: string) => {
    const [r, g, bl] = (c.match(/[\d.]+/g) ?? []).slice(0, 3).map((v) => {
      const s = Number(v) / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (bl ?? 0);
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

test("AC-6a shell text >= 4.5:1 on the dark ground; the focus ring >= 3:1 on the dark ground and on white", async ({
  page,
}) => {
  await logIn(page, ALICE.email, ALICE.password);
  for (const width of [1280, 375]) {
    await page.setViewportSize({ width, height: 800 });
    await openApp(page, "/lessons");
    const pairs = await page.evaluate(() => {
      const ground = (el: Element | null): string => {
        for (let e = el; e; e = e.parentElement) {
          const bg = getComputedStyle(e).backgroundColor;
          if (bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return bg;
        }
        return "rgb(255, 255, 255)";
      };
      return [...document.querySelectorAll("header a, header button")].map((el) => ({
        name: el.textContent,
        color: getComputedStyle(el).color,
        background: ground(el),
        shell: getComputedStyle(document.querySelector("header") ?? document.body).backgroundColor,
      }));
    });
    expect(pairs.length).toBe(NAV_LINKS.length + 1);
    for (const pair of pairs) {
      expect(
        contrast(pair.color, pair.background),
        `${pair.name} at ${width}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
    for (const target of [
      page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Students" }),
      page.getByRole("button", { name: "Log out" }),
      page.getByRole("button", { name: "Record lesson" }),
    ]) {
      await target.focus();
      const ring = await target.evaluate((el) => {
        const outline = getComputedStyle(el).outlineColor;
        const visible = getComputedStyle(el).outlineStyle !== "none";
        let ground = "rgb(255, 255, 255)";
        // The ring sits outside the element, on its parent's ground.
        for (let e = el.parentElement; e; e = e.parentElement) {
          const bg = getComputedStyle(e).backgroundColor;
          if (bg !== "rgba(0, 0, 0, 0)") {
            ground = bg;
            break;
          }
        }
        return { outline, visible, ground };
      });
      expect(ring.visible).toBe(true);
      expect(contrast(ring.outline, ring.ground), `ring at ${width}`).toBeGreaterThanOrEqual(3);
    }
    const shellGround = pairs[0]?.shell ?? "";
    const ringColour = await page
      .getByRole("button", { name: "Record lesson" })
      .evaluate((el) => getComputedStyle(el).outlineColor);
    expect(contrast(ringColour, shellGround)).toBeGreaterThanOrEqual(3);
    expect(contrast(ringColour, "rgb(255, 255, 255)")).toBeGreaterThanOrEqual(3);
  }
});

test.describe("AC-6b every link and Log out reachable by Tab and tap, inside the viewport, not clipped", () => {
  const SIZES = [
    { name: "320x568", viewport: { width: 320, height: 568 }, double: false },
    { name: "667x375", viewport: { width: 667, height: 375 }, double: false },
    { name: "1280x800 at 200% text", viewport: { width: 1280, height: 800 }, double: true },
  ];

  for (const size of SIZES) {
    test(`AC-6b ${size.name}`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: size.viewport, hasTouch: true });
      const page = await context.newPage();
      const email = uniqueEmail();
      try {
        await signUp(page, email, PASSWORD);
        const targets = [...NAV_LINKS, "Log out"];
        for (const path of APP_PAGES) {
          await openApp(page, path);
          if (size.double) {
            await page.evaluate(() => {
              const root = parseFloat(getComputedStyle(document.documentElement).fontSize);
              document.documentElement.style.fontSize = `${root * 2}px`;
            });
          }
          const reached: string[] = [];
          await page.getByRole("heading", { level: 1 }).focus();
          for (let i = 0; i < 12 && reached.length < targets.length; i++) {
            await page.keyboard.press("Shift+Tab");
            const name = await page.evaluate(() => document.activeElement?.textContent ?? "");
            if (targets.includes(name) && !reached.includes(name)) reached.push(name);
          }
          expect(new Set(reached), `${path}: reached by keyboard`).toEqual(new Set(targets));
          const width = size.viewport.width;
          for (const name of targets) {
            const box = await page.locator("header").getByText(name, { exact: true }).boundingBox();
            if (!box) throw new Error(`${path}: ${name} has no box`);
            expect(box.x, `${path}: ${name} left`).toBeGreaterThanOrEqual(0);
            expect(box.x + box.width, `${path}: ${name} right`).toBeLessThanOrEqual(width);
          }
          expect(await clippedElements(page, "header"), path).toEqual([]);
        }
        // Tap: each link takes the teacher to its page; Log out ends on /login.
        const nav = page.getByRole("navigation", { name: "Main" });
        for (const [index, name] of NAV_LINKS.entries()) {
          await nav.getByRole("link", { name, exact: true }).tap();
          await expect(page).toHaveURL(
            new RegExp(`${(APP_PAGES[index] ?? "").replace("/", "\\/")}$`),
          );
        }
        await page.getByRole("button", { name: "Log out" }).tap();
        await expect(page).toHaveURL(/\/login$/);
      } finally {
        await context.close();
        forgetTeacher(email);
      }
    });
  }
});

test("AC-6 /login and /signup in default, field-error and form-error states: no scroll, clipping or overlap at 375, 768 and 1280 px", async ({
  page,
}) => {
  const states = [
    ["/login", "Log in", "**/api/sessions"],
    ["/signup", "Create account", "**/api/teachers"],
  ] as const;
  const check = async (name: string) => {
    for (const width of [375, 768, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      await expectNoHorizontalScroll(page, `${name} at ${width}`);
      await expectNoClipOrOverlap(page, "body", `${name} at ${width}`);
    }
  };
  for (const [path, submit, api] of states) {
    await page.goto(path);
    await check(`${path} default`);
    await page.getByRole("button", { name: submit }).click();
    await expect(page.getByLabel("Email")).toHaveAttribute("aria-invalid", "true");
    await check(`${path} field errors`);
    await page.route(api, (route) => route.fulfill({ status: 503, body: "" }));
    await page.getByLabel("Email").fill("someone@example.com");
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: submit }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await check(`${path} form error`);
    await page.unrouteAll();
  }
});
