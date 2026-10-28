import { useEffect, useMemo, useRef, useState } from "react";
import { GitHubCalendar } from "react-github-calendar";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext";
import { Container, Section, SectionHeading, Reveal } from "../ui";
import "../../styles/about-sections.css";

// Five levels each, from empty to busiest. The calendar takes both palettes
// at once and colorScheme picks the active one.
const palette = {
  dark: [
    "rgba(255,255,255,0.06)",
    "#3b2a5e",
    "#5f3fa3",
    "#8d63e0",
    "#b78cff",
  ],
  light: [
    "rgba(107,47,217,0.08)",
    "#d9c8f5",
    "#a98ae6",
    "#7a4fd1",
    "#4a17a8",
  ],
};

// Narrow screens get smaller blocks so more weeks fit before scrolling.
const COMPACT_QUERY = "(max-width: 480px)";
// The calendar mounts (and fires its request) this far before it scrolls in.
const MOUNT_MARGIN = "400px 0px";
// How often and for how long to look for the rendered svg after mounting.
const SVG_POLL_MS = 100;
const SVG_POLL_LIMIT_MS = 6000;

// Month names for the calendar header in the active language. A fixed
// mid-month UTC date per month keeps every time zone on the same month.
function monthLabels(locale) {
  const format = new Intl.DateTimeFormat(locale, {
    month: "short",
    timeZone: "UTC",
  });
  return Array.from({ length: 12 }, (_, month) =>
    format.format(new Date(Date.UTC(2024, month, 15)))
  );
}

function isCompactViewport() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(COMPACT_QUERY).matches
  );
}

function Github() {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage;
  const surfaceRef = useRef(null);
  // Without IntersectionObserver there is nothing to wait for.
  const [shouldMount, setShouldMount] = useState(
    () => typeof IntersectionObserver === "undefined"
  );
  const [compact, setCompact] = useState(isCompactViewport);
  // Whether the calendar is wider than the surface, which decides if the
  // surface is a Tab stop (see the measuring effect below).
  const [scrolls, setScrolls] = useState(false);
  const calendarLabel = t("about.githubTitle");

  // The calendar fills in {{count}} itself once its data arrives. i18next
  // would otherwise interpolate that placeholder, so it is handed back as a
  // string (a string count also skips plural resolution).
  const labels = useMemo(
    () => ({
      // en-US: en-GB abbreviates September as "Sept".
      months: monthLabels(lang === "ms" ? "ms-MY" : "en-US"),
      totalCount: t("about.calendarTotal", { count: "{{count}}" }),
      legend: {
        less: t("about.calendarLess"),
        more: t("about.calendarMore"),
      },
    }),
    [lang, t]
  );

  // The surface renders at once (its min-height keeps the page stable) but
  // the calendar itself waits until the surface is near the viewport.
  useEffect(() => {
    const node = surfaceRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldMount(true);
          observer.disconnect();
        }
      },
      { rootMargin: MOUNT_MARGIN }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onResize = () => setCompact(isCompactViewport());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Once the calendar has drawn its svg, scroll the surface to its end so the
  // most recent weeks are the ones visible on narrow screens, and note
  // whether it scrolls at all: only then is the surface a Tab stop, since a
  // keyboard user needs to focus a scroller to reach the older weeks (WCAG
  // 2.1.1), while a calendar that fits would make it a dead stop. The library
  // swaps its loading skeleton for the real svg when data arrives, so each
  // new svg node is measured again; the wrapper's ResizeObserver covers later
  // viewport changes (rotation, block size switch, error text).
  useEffect(() => {
    if (!shouldMount) return undefined;
    const node = surfaceRef.current;
    if (!node) return undefined;

    const snapToEnd = () => {
      node.scrollLeft = node.scrollWidth;
      setScrolls(node.scrollWidth - node.clientWidth > 1);
    };

    const started = Date.now();
    let timer = null;
    let lastSvg = null;
    const poll = () => {
      const svg = node.querySelector("svg");
      if (svg && svg !== lastSvg) {
        lastSvg = svg;
        snapToEnd();
      }
      if (Date.now() - started < SVG_POLL_LIMIT_MS) {
        timer = window.setTimeout(poll, SVG_POLL_MS);
      }
    };
    poll();

    let resizeObserver = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(snapToEnd);
      resizeObserver.observe(node);
    }

    return () => {
      if (timer !== null) window.clearTimeout(timer);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [shouldMount]);

  return (
    <Section tight id="github">
      <Container>
        <SectionHeading
          title={calendarLabel}
          lead={t("about.calendarLead")}
        />
        {/* The Reveal is the surface itself: one box that fades in, holds
            the calendar and, while the calendar is wider than it, scrolls
            and is a Tab stop (the same shape as CaseStudy/ScreensBand). */}
        <Reveal
          ref={surfaceRef}
          className="surface gh__surface"
          role="region"
          aria-label={calendarLabel}
          tabIndex={scrolls ? 0 : undefined}
        >
          {shouldMount ? (
            <GitHubCalendar
              username="ZriffDnny"
              blockSize={compact ? 10 : 13}
              blockMargin={compact ? 3 : 4}
              theme={palette}
              colorScheme={theme === "light" ? "light" : "dark"}
              labels={labels}
              errorMessage={t("about.calendarError")}
              fontSize={14}
            />
          ) : null}
        </Reveal>
      </Container>
    </Section>
  );
}

export default Github;
