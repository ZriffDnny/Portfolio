import { StrictMode } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "./i18n";
import App from "./App";
import { ORIGIN } from "../routes.mjs";
import en from "./i18n/locales/en.json";
import { stats } from "./data/stats";
import { dropIfOptedOut } from "./utils/analytics";

// Neither analytics script should run in a test. The stand-ins render
// nothing but keep their props, so the opt-out wiring can be checked.
const vercel = vi.hoisted(() => ({
  analytics: vi.fn(() => null),
  speedInsights: vi.fn(() => null),
}));
vi.mock("@vercel/analytics/react", () => ({ Analytics: vercel.analytics }));
vi.mock("@vercel/speed-insights/react", () => ({ SpeedInsights: vercel.speedInsights }));

// The hero phone's tilt wrapper. The stand-in renders the phone and keeps
// its props, so the reduced-motion wiring can be checked.
const tilt = vi.hoisted(() => vi.fn(({ children }) => children));
vi.mock("react-parallax-tilt", () => ({ default: tilt }));

// The app reads window.location on mount; every test here starts on the
// home page, whatever the previous one navigated to.
beforeEach(() => {
  window.history.replaceState(null, "", "/");
});

test("renders the site chrome", async () => {
  render(<App />);
  expect(await screen.findByRole("navigation")).toBeInTheDocument();
  expect(screen.getByRole("main")).toBeInTheDocument();
  expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  // The home page: one h1, its own title and canonical.
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  await waitFor(() => expect(document.title).toBe(en.meta.home));
  expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute("href", `${ORIGIN}/`);
});

// The About jump chips after a client-side navigation make a keyed React
// Router entry and land focus on their section. A native fragment jump would
// be a keyless POP that ScrollToTop reads as Back to the first page of the
// visit and would restore that page's offset instead.
test("About jump chips scroll to and focus their section", async () => {
  // Warm the lazy About module first, so the wait below covers the app's own
  // navigation and not jsdom transforming the chunk on a busy machine.
  await import("./components/About/About");
  render(<App />);
  const nav = await screen.findByRole("navigation");
  fireEvent.click(nav.querySelector('a[href="/about"]'));
  const chip = await screen.findByRole("link", { name: /experience/i }, { timeout: 15000 });
  await waitFor(() => expect(document.activeElement.tagName).toBe("H1"));
  expect(chip).toHaveAttribute("href", "/about#experience");
  fireEvent.click(chip);
  await waitFor(() =>
    expect(document.activeElement).toBe(document.getElementById("experience"))
  );
  expect(window.location.hash).toBe("#experience");
  expect(window.history.state.key).toBeTruthy();
}, 30000);

// The wordmark preloader is a motion flourish: once per browser session,
// never under reduced motion.
describe("preloader", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  test("shows on the first page of a session and marks the session", async () => {
    render(<App />);
    await screen.findByRole("navigation");
    expect(document.querySelector(".preloader")).not.toBeNull();
    expect(window.sessionStorage.getItem("preloader-seen")).toBe("1");
  });

  test("stays away for the rest of the session", async () => {
    window.sessionStorage.setItem("preloader-seen", "1");
    render(<App />);
    await screen.findByRole("navigation");
    expect(document.querySelector(".preloader")).toBeNull();
  });

  test("never runs under reduced motion", async () => {
    window.setMedia("(prefers-reduced-motion: reduce)", true);
    render(<App />);
    await screen.findByRole("navigation");
    expect(document.querySelector(".preloader")).toBeNull();
    expect(window.sessionStorage.getItem("preloader-seen")).toBeNull();
  });
});

// The theme: the stored choice first, else the OS colour scheme, and dark
// when the OS states no preference.
describe("theme", () => {
  beforeEach(() => {
    window.localStorage.removeItem("theme");
  });

  test("starts dark when the OS states no preference", async () => {
    render(<App />);
    await screen.findByRole("navigation");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem("theme")).toBe("dark");
  });

  test("starts light when the OS asks for it", async () => {
    window.setMedia("(prefers-color-scheme: light)", true);
    render(<App />);
    await screen.findByRole("navigation");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(window.localStorage.getItem("theme")).toBe("light");
  });

  test("keeps a stored choice over the OS", async () => {
    window.localStorage.setItem("theme", "dark");
    window.setMedia("(prefers-color-scheme: light)", true);
    render(<App />);
    await screen.findByRole("navigation");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});

// Both Vercel components drop what an opted-out browser would send (see
// utils/analytics). An ?analytics=off or ?analytics=on that main.jsx applied
// is confirmed with one toast, StrictMode's repeated effects included;
// without one there is none.
describe("analytics opt-out", () => {
  test("both Vercel components get the opt-out", async () => {
    render(<App />);
    await screen.findByRole("navigation");
    expect(vercel.analytics.mock.lastCall[0].beforeSend).toBe(dropIfOptedOut);
    expect(vercel.speedInsights.mock.lastCall[0].beforeSend).toBe(dropIfOptedOut);
  });

  test("confirms the change once", async () => {
    render(
      <StrictMode>
        <App analyticsChange="off" />
      </StrictMode>
    );
    expect(await screen.findByText(en.toast.analyticsOff)).toBeInTheDocument();
    expect(screen.getAllByText(en.toast.analyticsOff)).toHaveLength(1);
  });

  test("stays quiet when nothing changed", async () => {
    render(<App />);
    await screen.findByRole("navigation");
    expect(screen.queryByText(en.toast.analyticsOff)).toBeNull();
    expect(screen.queryByText(en.toast.analyticsOn)).toBeNull();
  });
});

// The stat tiles count up once they scroll into view (which the
// IntersectionObserver shim reports at once); under reduced motion each
// numeral shows its final value on the first frame instead.
test("stat tiles show their final value at once under reduced motion", async () => {
  window.setMedia("(prefers-reduced-motion: reduce)", true);
  render(<App />);
  await screen.findByRole("navigation");
  await waitFor(() => {
    const numerals = [...document.querySelectorAll(".stat-tile .tabular")].map(
      (el) => el.textContent
    );
    expect(numerals).toEqual(stats.map((stat) => String(stat.value)));
  });
});

// The hero phone leans toward the pointer, except under reduced motion.
describe("hero phone tilt", () => {
  beforeEach(() => {
    tilt.mockClear();
  });

  test("follows the pointer by default", async () => {
    render(<App />);
    await screen.findByRole("navigation");
    expect(tilt).toHaveBeenCalled();
    expect(tilt.mock.lastCall[0].tiltEnable).toBe(true);
  });

  test("stays still under reduced motion", async () => {
    window.setMedia("(prefers-reduced-motion: reduce)", true);
    render(<App />);
    await screen.findByRole("navigation");
    expect(tilt).toHaveBeenCalled();
    expect(tilt.mock.lastCall[0].tiltEnable).toBe(false);
  });
});
