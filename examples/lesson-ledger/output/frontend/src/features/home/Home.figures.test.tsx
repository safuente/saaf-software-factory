import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { lesson } from "../../test/ledger";
import { ZOE, aliceLike, figures, onNovember18, openHome } from "../../test/home";

onNovember18();

describe("F07 AC-1 month figures", () => {
  it("AC-1a shows Collected, Pending, Lessons and Average per lesson under the month heading", async () => {
    await openHome();

    expect(
      await screen.findByRole("heading", { level: 2, name: "November 2026" }),
    ).toBeInTheDocument();
    expect(figures()).toEqual([
      ["Collected", "$45.00"],
      ["Pending", "$136.25"],
      ["Lessons", "4"],
      ["Average per lesson", "$45.31"],
    ]);
    expect(screen.queryByText(/^No lessons in/)).toBeNull();
  });

  it("AC-1d a month without lessons shows zeros, a dash and 'No lessons in {month}.'", async () => {
    const data = aliceLike();
    data.lessons = data.lessons.filter((l) => !l.date.startsWith("2026-11"));
    await openHome(data);

    await screen.findByRole("heading", { level: 2, name: "November 2026" });
    expect(figures()).toEqual([
      ["Collected", "$0.00"],
      ["Pending", "$0.00"],
      ["Lessons", "0"],
      ["Average per lesson", "—"],
    ]);
    expect(screen.getByText("No lessons in November 2026.")).toBeVisible();
  });

  it("AC-1a the average rounds half up to the cent and counts $0 lessons", async () => {
    await openHome({
      students: [ZOE],
      lessons: [lesson(1, ZOE, "2026-11-02", 45, 1001), lesson(2, ZOE, "2026-11-03", 45, 0)],
    });

    await screen.findByRole("heading", { level: 2, name: "November 2026" });
    expect(figures().at(3)).toEqual(["Average per lesson", "$5.01"]);
  });
});
