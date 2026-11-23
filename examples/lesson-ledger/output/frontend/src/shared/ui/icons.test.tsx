/** F08 AC-1: decorative Lucide icons in the shared components (sidebar links, Log out, alerts),
 * with names and texts unchanged, and none where AC-1 (b) forbids them. */
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { expectLeadingIcon, expectNoIcon, svgsIn } from "../../test/icons";
import { Alert } from "./Alert";
import { TextLink } from "./Form";
import { LoadError } from "./LoadError";
import { MainNav } from "./MainNav";
import { Page } from "./Page";
import { ShellContext, type Shell } from "./shell";
import { StatusMessage } from "./StatusMessage";

const NAV_ICONS: [string, string][] = [
  ["Home", "house"],
  ["Lessons", "music"],
  ["Students", "users"],
  ["Monthly summary", "chart-column"],
  ["Pending payments", "clock"],
];

function renderShell(shell: Shell) {
  return render(
    <MemoryRouter initialEntries={["/lessons"]}>
      <ShellContext.Provider value={shell}>
        <Page title="Lessons" heading="Lessons" nav>
          <p>Body</p>
        </Page>
      </ShellContext.Provider>
    </MemoryRouter>,
  );
}

describe("F08 AC-1 icons in shared components", () => {
  it("AC-1a,c each sidebar link shows its icon before its unchanged text and name", () => {
    render(
      <MemoryRouter initialEntries={["/summary"]}>
        <MainNav />
      </MemoryRouter>,
    );
    const nav = screen.getByRole("navigation", { name: "Main" });
    for (const [label, glyph] of NAV_ICONS) {
      const link = within(nav).getByRole("link", { name: label });
      expectLeadingIcon(link, glyph, label);
    }
  });

  it("AC-1f the current link's icon is the same element as on other links, apart from colour", () => {
    render(
      <MemoryRouter initialEntries={["/summary"]}>
        <MainNav />
      </MemoryRouter>,
    );
    const nav = screen.getByRole("navigation", { name: "Main" });
    const current = within(nav).getByRole("link", { name: "Monthly summary" });
    const other = within(nav).getByRole("link", { name: "Lessons" });
    expect(current).toHaveAttribute("aria-current", "page");
    const [currentIcon] = svgsIn(current);
    const [otherIcon] = svgsIn(other);
    const shape = (svg: SVGSVGElement | undefined) =>
      [...(svg?.classList ?? [])].filter((c) => !c.startsWith("lucide-")).join(" ");
    expect(shape(currentIcon)).toBe(shape(otherIcon));
    expect(currentIcon?.getAttribute("stroke")).toBe("currentColor");
    expect(otherIcon?.getAttribute("stroke")).toBe("currentColor");
  });

  it("AC-1a,c Log out shows its icon, also while logging out (disabled, label unchanged)", () => {
    const { rerender } = renderShell({ logOut: () => {}, loggingOut: false, logOutFailed: false });
    expectLeadingIcon(screen.getByRole("button", { name: "Log out" }), "log-out");
    rerender(
      <MemoryRouter initialEntries={["/lessons"]}>
        <ShellContext.Provider value={{ logOut: () => {}, loggingOut: true, logOutFailed: false }}>
          <Page title="Lessons" heading="Lessons" nav>
            <p>Body</p>
          </Page>
        </ShellContext.Provider>
      </MemoryRouter>,
    );
    const button = screen.getByRole("button", { name: "Log out" });
    expect(button).toBeDisabled();
    expectLeadingIcon(button, "log-out");
  });

  it("AC-1a,c the log-out error alert shows the alert icon and keeps its exact text", () => {
    renderShell({ logOut: () => {}, loggingOut: false, logOutFailed: true });
    expectLeadingIcon(
      screen.getByRole("alert"),
      "circle-alert",
      "Couldn't log out. Please try again.",
    );
  });

  it("AC-1a,c every shared alert shows the alert icon before its exact text", () => {
    render(<Alert>Enter a name.</Alert>);
    expectLeadingIcon(screen.getByRole("alert"), "circle-alert", "Enter a name.");
  });

  it("AC-1b no icon on Try again, text links, status messages or headings", () => {
    render(
      <MemoryRouter>
        <LoadError onRetry={() => {}} />
        <TextLink to="/signup">Create an account</TextLink>
        <StatusMessage>Saved.</StatusMessage>
      </MemoryRouter>,
    );
    expectNoIcon(screen.getByRole("button", { name: "Try again" }));
    expectNoIcon(screen.getByRole("link", { name: "Create an account" }));
    expectNoIcon(screen.getByRole("status"));
    expectLeadingIcon(screen.getByRole("alert"), "circle-alert");
  });

  it("AC-1b,c the shell's headings and title row carry no icon", () => {
    renderShell({ logOut: () => {}, loggingOut: false, logOutFailed: false });
    expectNoIcon(screen.getByRole("heading", { level: 1 }));
  });
});
