/** Helpers of the F08 specs: icon audit, contrast, and the F03 AC-1 data for a test teacher. */
import { expect, type APIRequestContext, type Locator, type Page } from "@playwright/test";
import { ALICE, BOB } from "./stack";

/** Behavior "Icon map": the glyph each control or alert shows, by its visible text. */
export const ICON_MAP: Record<string, string> = {
  Home: "house",
  Lessons: "music",
  Students: "users",
  "Monthly summary": "chart-column",
  "Pending payments": "clock",
  "Record lesson": "calendar-plus",
  "Add student": "user-plus",
  "Mark as paid": "check",
  "Undo paid": "undo-2",
  "Log out": "log-out",
};

/**
 * Every AC-1 violation on the page: an icon outside the allowed places (AC-1 b), an allowed
 * control or alert without exactly one icon of the right glyph first (AC-1 a), an icon next to
 * another text (AC-1 d), or an icon that is not hidden or is focusable (AC-1 c). The logo mark,
 * the illustrations and the metrics bar are not icons.
 */
export async function iconViolations(page: Page): Promise<string[]> {
  return page.evaluate((map) => {
    const problems: string[] = [];
    const text = (el: Element) => (el.textContent ?? "").trim();
    const nonIcon = (svg: Element) =>
      svg.closest("[data-brand], [data-illustration], [data-metrics-panel]") !== null;
    const iconHolders = new Set<Element>();
    for (const el of document.querySelectorAll(
      'nav[aria-label="Main"] a, button, a[aria-label], [role=alert]',
    )) {
      const glyph = el.matches("[role=alert]") ? "circle-alert" : map[text(el)];
      const svgs = [...el.querySelectorAll("svg")];
      if (!glyph) {
        if (svgs.length) problems.push(`icon next to "${text(el)}"`);
        continue;
      }
      iconHolders.add(el);
      const svg = svgs[0];
      if (svgs.length !== 1 || el.firstChild !== svg || !svg) {
        problems.push(`"${text(el)}": not exactly one leading icon`);
        continue;
      }
      if (!svg.classList.contains(`lucide-${glyph}`)) problems.push(`"${text(el)}": wrong glyph`);
      if (svg.getAttribute("aria-hidden") !== "true") problems.push(`"${text(el)}": not hidden`);
      if (svg.hasAttribute("tabindex") || svg.querySelector("title, desc"))
        problems.push(`"${text(el)}": focusable or titled icon`);
      if (svg.nextSibling?.nodeType !== Node.TEXT_NODE)
        problems.push(`"${text(el)}": text not right after the icon`);
    }
    for (const svg of document.querySelectorAll("svg")) {
      if (nonIcon(svg)) continue;
      const holder = svg.parentElement;
      if (!holder || !iconHolders.has(holder))
        problems.push(`stray icon in ${holder?.tagName ?? "?"} "${holder ? text(holder) : ""}"`);
    }
    return problems;
  }, ICON_MAP);
}

/** WCAG relative-luminance contrast of two rgb() colours. */
export function contrast(a: string, b: string): number {
  const lum = (colour: string) => {
    const [r, g, bl] = (colour.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map((v) => {
      const s = Number(v) / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (bl ?? 0);
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

/** The icon's drawn colour, its control's text colour, and the first opaque background behind
 * the control. */
export async function iconColours(control: Locator) {
  return control.evaluate((el) => {
    const svg = el.querySelector("svg");
    let ground = "rgba(0, 0, 0, 0)";
    for (let node: Element | null = el; node; node = node.parentElement) {
      const bg = getComputedStyle(node).backgroundColor;
      if (bg !== "transparent" && !/rgba\(.*,\s*0\)$/.test(bg)) {
        ground = bg;
        break;
      }
    }
    return {
      icon: svg ? getComputedStyle(svg).stroke : "",
      iconColor: svg ? getComputedStyle(svg).color : "",
      text: getComputedStyle(el).color,
      ground: ground === "rgba(0, 0, 0, 0)" ? "rgb(255, 255, 255)" : ground,
    };
  });
}

export async function addStudent(request: APIRequestContext, name: string): Promise<number> {
  const response = await request.post("/api/students", { data: { name } });
  expect(response.status()).toBe(201);
  return (await response.json()).id;
}

export async function addLesson(
  request: APIRequestContext,
  studentId: number,
  date: string,
  amount: number,
  paid = false,
): Promise<number> {
  const response = await request.post("/api/lessons", {
    data: { student_id: studentId, date, duration_minutes: 45, price: { amount, currency: "USD" } },
  });
  expect(response.status()).toBe(201);
  const id: number = (await response.json()).id;
  if (paid) {
    expect((await request.patch(`/api/lessons/${id}`, { data: { paid: true } })).status()).toBe(
      200,
    );
  }
  return id;
}

/** The F03 AC-1 data (November 2026): lesson A paid 42.50, lesson B 60.00 and C 0.00 unpaid. */
export async function addF03Data(request: APIRequestContext): Promise<void> {
  const zoe = await addStudent(request, "Zoe Park");
  const adam = await addStudent(request, "Adam Lee");
  await addLesson(request, zoe, "2026-11-03", 4250, true);
  await addLesson(request, adam, "2026-11-10", 6000);
  await addLesson(request, zoe, "2026-11-10", 0);
}

export const LESSON_B = "Mark as paid: Adam Lee, Nov 10, 2026";

/** Each state: the account, the path, and the message the illustration sits above. */
export const ILLUSTRATED = [
  { who: BOB, path: "/", message: "main ol", text: "Add your students." },
  {
    who: BOB,
    path: "/students",
    message: "main p",
    text: "You have no students yet. Add your first student with the form above.",
  },
  { who: BOB, path: "/lessons", message: "main p", text: "No lessons recorded yet." },
  { who: BOB, path: "/summary", message: "main p", text: "No lessons in " },
  {
    who: BOB,
    path: "/pending",
    message: "main p",
    text: "Nothing pending. Every lesson is paid.",
  },
  {
    who: ALICE,
    path: "/summary?month=2000-01",
    message: "main p",
    text: "No lessons in January 2000.",
  },
];
