// Quality sweep for the built site.
//
// Opens every route in routes.mjs, plus a 404, in headless Chromium, in both
// themes and both viewports in English, plus Bahasa Malaysia at desktop dark
// and mobile dark, and checks what the site was reviewed against: no console
// or page errors, no Content-Security-Policy violation, no horizontal
// overflow, exactly one h1, the html lang the pass asked for, the document
// title from meta.* in that language's locale file, the canonical (or, on the
// 404, robots noindex), lang="en" on the English-only case studies, the three
// self-hosted web fonts loaded, the resume drawn by the PDF viewer rather
// than its load error, the contribution calendar on /about drawn from its
// data, every page answering 200 (the 404 answering 404: a failure with
// --serve, whose preview mirrors Vercel, and a note against any other
// server), and no serious or critical axe violation (WCAG 2.0 A and AA,
// WCAG 2.1 AA). A full-page screenshot and the complete axe result for every
// page land in tools/qa/output/ next to report.json, so a red run can be
// inspected without re-running it.
//
// Everything the site loads is its own, fonts included, so any failed load or
// script error fails the page. The one exception is the contribution
// calendar's third-party API on /about, which is rate limited, sometimes
// down and slow on a cold request: an HTTP error, a network failure or no
// answer in time there is reported without failing, and after an error the
// calendar must show its error text. A request the CSP refused is never
// excused.
//
// The script builds nothing. It expects `dist/` to exist and a server to be
// serving it:
//
//   node tools/qa/sweep.mjs                sweep http://localhost:4173 (already running)
//   node tools/qa/sweep.mjs --serve        start `vite preview` on 4173 first, stop it after
//   node tools/qa/sweep.mjs --url=http://localhost:3000
//   node tools/qa/sweep.mjs --routes=home,about
//
// With --serve the port has to be free: if something already answers there
// the sweep aborts instead of measuring whatever that server holds. Passing
// --url alongside --serve skips that probe; the preview still refuses a taken
// port and its output is printed.
//
// PW_CHANNEL=chrome (or msedge) launches the installed browser instead of
// Playwright's bundled Chromium, so nothing needs downloading locally. CI
// leaves it unset and installs Playwright's Chromium, cached per Playwright
// version (see .github/workflows/quality.yml).
//
// Node 22 or newer (global fetch, ESM).

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stripVTControlCharacters } from "node:util";
import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";
import { ORIGIN, ROUTES as SITE_ROUTES, NOT_FOUND } from "../../routes.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const OUT = path.join(HERE, "output");

const ROUTES = [...SITE_ROUTES, { ...NOT_FOUND, notFound: true }];

// The locale files the build read, for the title each page must end up with.
const LOCALES = Object.fromEntries(
  ["en", "ms"].map((lang) => [
    lang,
    JSON.parse(fs.readFileSync(path.join(ROOT, "src", "i18n", "locales", `${lang}.json`), "utf8")),
  ])
);

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

const THEMES = ["dark", "light"];

// Every theme and viewport in English, plus Bahasa Malaysia on the dark theme
// at both viewports: its strings run longer (see docs/DESIGN.md), so the
// 390px overflow rule has to hold in that language too.
const PASSES = [];
for (const viewport of Object.keys(VIEWPORTS)) {
  for (const theme of THEMES) PASSES.push({ viewport, theme, lang: "en" });
}
for (const viewport of Object.keys(VIEWPORTS)) PASSES.push({ viewport, theme: "dark", lang: "ms" });

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21aa"];
const BLOCKING_IMPACTS = new Set(["serious", "critical"]);

// The self-hosted families in src/styles/fonts.css. Each must have a loaded
// face before the page is measured, or the numbers describe fallback fonts;
// with the files on the site's own origin, a missing one is a failure.
const FONT_FAMILIES = ["Bricolage Grotesque", "Inter", "JetBrains Mono"];

// The contribution calendar on /about fetches from this third-party API, which
// is rate limited and sometimes down. The component renders its own error
// text then, so a failed request there says nothing about the site. A request
// the Content-Security-Policy refused says something, and is never excused.
const CALENDAR_API = "https://github-contributions-api.jogruber.de/";

// Present once the calendar has drawn real data: the loading skeleton is an
// svg too, but has neither the total count nor the month labels.
const CALENDAR_DATA = ".gh__surface :is(.react-activity-calendar__count, .react-activity-calendar__legend-month)";

// The app loads Vercel's analytics and speed-insights scripts from /_vercel/
// on its own origin at run time. A local server (http) has no such paths
// (the preview answers them 404, which Chrome logs as a console error), so
// there the sweep serves an empty script for them instead. A deployment
// (https) has them, and the real scripts then load and run under the page's
// CSP, which the stub can never test. The weekly production check confirms
// the live site serves them and that the CSP allows them.
const STUBBED_REQUESTS = "**/_vercel/**";

const PRELOADER_TIMEOUT = 15000;
const NAVIGATION_TIMEOUT = 60000;
const FONTS_TIMEOUT = 10000;
const PDF_TIMEOUT = 30000;
// How long the calendar API gets to answer once asked (a cold request has
// taken 9 s), then how long the calendar gets to draw what it got.
const CALENDAR_API_TIMEOUT = 20000;
const CALENDAR_TIMEOUT = 8000;
const SERVER_TIMEOUT = 60000;

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const match = arg.match(/^--([^=]+)(?:=(.*))?$/);
    return match ? [match[1], match[2] === undefined ? true : match[2]] : [arg, true];
  })
);

const BASE = String(args.url || process.env.QA_URL || "http://localhost:4173").replace(/\/+$/, "");
const SERVE = Boolean(args.serve);
const STUB_VERCEL = !BASE.startsWith("https:");

// An expected stop (a mistake on the command line, a port in use, no dist),
// reported without a stack trace.
class AbortError extends Error {}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const firstLine = (error) => String((error && error.message) || error).split("\n")[0];

function selectRoutes(spec) {
  if (spec === undefined) return ROUTES;
  const known = ROUTES.map((route) => route.name);
  const names =
    spec === true
      ? []
      : String(spec)
          .split(",")
          .map((name) => name.trim())
          .filter(Boolean);
  const unknown = names.filter((name) => !known.includes(name));
  if (unknown.length) {
    throw new AbortError(
      `unknown route${unknown.length === 1 ? "" : "s"} in --routes: ${unknown.join(", ")}. ` +
        `Known routes: ${known.join(", ")}`
    );
  }
  const selected = ROUTES.filter((route) => names.includes(route.name));
  if (!selected.length) {
    throw new AbortError(`--routes selected no pages. Known routes: ${known.join(", ")}`);
  }
  return selected;
}

function originOf(url) {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

// Chrome quotes the failing url in its CORS messages ("Access to fetch at
// 'https://...' from origin ... has been blocked by CORS policy"), where the
// message location is the document rather than the resource.
function quotedUrl(text) {
  const match = /https?:\/\/[^\s'"`<>()[\]]+/i.exec(text);
  return match ? match[0] : null;
}

// A failed request to the calendar API, reported by Chrome as "Failed to load
// resource" (the url is then the message location) or as a CORS or network
// failure (the url is quoted in the text). Anything mentioning the
// Content-Security-Policy, or a refusal, is not one of these.
function isCalendarApiFailure(text, source) {
  if (/content[- ]security[- ]policy|refused to/i.test(text)) return false;
  if (!/failed to load|failed to fetch|blocked by CORS|net::ERR_/i.test(text)) return false;
  return [source, quotedUrl(text)].some((url) => Boolean(url) && url.startsWith(CALENDAR_API));
}

// ---------------------------------------------------------------------------
// Preview server (only with --serve)
// ---------------------------------------------------------------------------

// HTTP status of a GET on the url, or 0 when nothing answers.
async function probe(url) {
  try {
    const res = await fetch(url, { redirect: "manual" });
    return res.status;
  } catch {
    return 0;
  }
}

// Resolves once the child has printed vite's "Local:" line and the url
// answers; rejects as soon as the child exits or the timeout passes.
async function waitForServer(url, child) {
  const started = Date.now();
  while (Date.now() - started < SERVER_TIMEOUT) {
    if (child.exit() !== null) throw new AbortError(`preview server exited before answering (${child.exit()})`);
    if (child.printedLocal() && (await probe(url)) > 0) return;
    await sleep(250);
  }
  throw new AbortError(`preview server did not answer on ${url} within ${SERVER_TIMEOUT / 1000}s`);
}

async function startPreview(url) {
  if (!fs.existsSync(path.join(ROOT, "dist", "index.html"))) {
    throw new AbortError("dist/index.html is missing; run `npm run build` before the sweep");
  }

  // A server already on the port would be swept in place of the fresh dist
  // while the preview child died on --strictPort. An explicit --url is the
  // caller's own address and skips this probe; the child still refuses a
  // taken port and its output is printed below.
  if (!args.url) {
    const status = await probe(url);
    if (status > 0) {
      throw new AbortError(
        `port already in use: ${url} answered HTTP ${status} before the preview server was started. ` +
          "Stop that server, or run without --serve to sweep it as it is."
      );
    }
  }

  const port = new URL(url).port || "4173";
  const previewArgs = ["preview", "--port", port, "--strictPort"];

  // Spawning vite's own bin with the current node keeps this free of a shell
  // on every platform (npx on Windows needs cmd.exe, and killing cmd.exe does
  // not kill the server it started). npx is only the fallback.
  const localBin = path.join(ROOT, "node_modules", "vite", "bin", "vite.js");
  const child = fs.existsSync(localBin)
    ? spawn(process.execPath, [localBin, ...previewArgs], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] })
    : spawn("npx", ["vite", ...previewArgs], {
        cwd: ROOT,
        stdio: ["ignore", "pipe", "pipe"],
        shell: process.platform === "win32",
      });

  let exit = null;
  let log = "";
  child.on("exit", (code, signal) => {
    exit = signal ? `signal ${signal}` : `code ${code}`;
  });
  child.stdout.on("data", (chunk) => {
    log += chunk;
  });
  child.stderr.on("data", (chunk) => {
    log += chunk;
  });

  // vite colours its banner even into a pipe, so strip the escapes first.
  const output = () => stripVTControlCharacters(log).trim();
  const printedLocal = () => /Local:\s+\S+/.test(output());

  const stop = () => {
    if (exit === null) child.kill();
  };
  process.on("exit", stop);

  try {
    await waitForServer(url, { exit: () => exit, printedLocal });
    if (exit !== null) throw new AbortError(`preview server exited right after answering (${exit})`);
  } catch (error) {
    stop();
    const text = output();
    throw new AbortError(`${error.message}${text ? `\npreview server output:\n${text}` : ""}`);
  }
  console.log(`preview server on ${url}`);
  return stop;
}

// ---------------------------------------------------------------------------
// Per-page work
// ---------------------------------------------------------------------------

// Rethrow anything but a timeout so a broken selector cannot pass as a slow
// page.
function timedOut(error) {
  if (error && error.name === "TimeoutError") return false;
  throw error;
}

// Waits for the web fonts, but never longer than FONTS_TIMEOUT: a stalled
// download keeps document.fonts.ready pending forever. Each family is also
// requested explicitly, so a face the page has not needed yet is fetched
// rather than skipped. Returns which families still have no loaded face.
async function waitForFonts(page) {
  return page.evaluate(
    async ({ families, timeout }) => {
      const normalise = (family) => String(family).replace(/^["']|["']$/g, "").trim().toLowerCase();
      if (!document.fonts) return { timedOut: false, missing: families.slice() };
      const settled = (async () => {
        await document.fonts.ready;
        await Promise.all(families.map((family) => document.fonts.load(`1em "${family}"`).catch(() => [])));
      })();
      const lost = await Promise.race([
        settled.then(() => false),
        new Promise((resolve) => setTimeout(() => resolve(true), timeout)),
      ]);
      const loaded = new Set();
      for (const face of Array.from(document.fonts)) {
        if (face.status === "loaded") loaded.add(normalise(face.family));
      }
      return { timedOut: lost, missing: families.filter((family) => !loaded.has(normalise(family))) };
    },
    { families: FONT_FAMILIES, timeout: FONTS_TIMEOUT }
  );
}

// Navigate, wait for the app to mount and for the fonts. "domcontentloaded"
// rather than "load" so a stalled request cannot turn into a 60s navigation
// timeout; the wait below is what proves the app is up: <main> is rendered
// and the wordmark preloader, which only the first page of a browser session
// shows, is gone (Pre.jsx unmounts it when its fade ends).
async function openPage(page, url, notes) {
  const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAVIGATION_TIMEOUT });
  await page.waitForFunction(
    () => document.querySelector("#main") && !document.querySelector(".preloader"),
    null,
    { timeout: PRELOADER_TIMEOUT }
  );
  const fonts = await waitForFonts(page);
  if (fonts.timedOut) notes.push(`web fonts did not settle within ${FONTS_TIMEOUT / 1000}s`);
  return { fonts, status: response ? response.status() : null };
}

// What the resume viewer on /resume ended up showing: "rendered" once pdf.js
// has drawn a page, "error" for the viewer's own load-error text, "none"
// when neither appeared in time.
async function pdfState(page) {
  return page
    .waitForFunction(
      () => {
        if (document.querySelector(".react-pdf__Page canvas")) return "rendered";
        if (document.querySelector('.resume__placeholder[role="alert"]')) return "error";
        return null;
      },
      null,
      { timeout: PDF_TIMEOUT }
    )
    .then((handle) => handle.jsonValue(), (error) => (timedOut(error), "none"));
}

// Waits for the calendar API's answer or failure, but never longer than
// CALENDAR_API_TIMEOUT. The calendar asks only once its section has been
// scrolled near and its chunk has loaded, so the request itself may still be
// on its way when this starts.
async function waitForCalendarApi(calendarApi) {
  const started = Date.now();
  while (calendarApi.status === null && calendarApi.failure === null) {
    if (Date.now() - started >= CALENDAR_API_TIMEOUT) return;
    await sleep(100);
  }
}

// What the contribution calendar on /about ended up showing: "data" once it
// has drawn the contributions, "error" for its error text, "none" otherwise.
async function calendarState(page) {
  return page
    .waitForFunction(
      (dataSelector) => {
        const surface = document.querySelector(".gh__surface");
        if (!surface) return null;
        if (surface.querySelector(dataSelector)) return "data";
        if (!surface.querySelector("svg") && surface.textContent.trim()) return "error";
        return null;
      },
      CALENDAR_DATA,
      { timeout: CALENDAR_TIMEOUT }
    )
    .then((handle) => handle.jsonValue(), (error) => (timedOut(error), "none"));
}

// The title, canonical and robots tags, and the lang of the case study body.
async function pageMeta(page) {
  return page.evaluate(() => {
    const canonical = document.head.querySelector('link[rel="canonical"]');
    const robots = document.head.querySelector('meta[name="robots"]');
    const caseStudy = document.querySelector(".cs-page");
    return {
      title: document.title,
      canonical: canonical ? canonical.getAttribute("href") : null,
      robots: robots ? robots.getAttribute("content") : null,
      caseStudyLang: caseStudy ? caseStudy.getAttribute("lang") : null,
    };
  });
}

// Everything the page's own metadata must say for this route and language.
function metaFailures(route, pass, meta) {
  const failures = [];
  const expected = LOCALES[pass.lang].meta && LOCALES[pass.lang].meta[route.titleKey];
  if (typeof expected !== "string") {
    failures.push(`meta.${route.titleKey} is missing from ${pass.lang}.json`);
  } else if (meta.title !== expected) {
    failures.push(`title is "${meta.title}", expected "${expected}"`);
  }
  if (route.notFound) {
    if (!/\bnoindex\b/i.test(meta.robots || "")) failures.push("the 404 page has no robots noindex");
    if (meta.canonical !== null) failures.push(`the 404 page has a canonical (${meta.canonical})`);
  } else {
    if (/\bnoindex\b/i.test(meta.robots || "")) failures.push("robots noindex on an indexable page");
    const canonical = ORIGIN + route.path;
    if (meta.canonical !== canonical) failures.push(`canonical is ${meta.canonical}, expected ${canonical}`);
  }
  if (route.englishOnly && meta.caseStudyLang !== "en") {
    failures.push(`.cs-page lang is ${meta.caseStudyLang === null ? "missing" : `"${meta.caseStudyLang}"`}, expected "en"`);
  }
  return failures;
}

// Scroll the whole page in steps so every whileInView reveal and every
// IntersectionObserver fires, then return to the top so the fixed chrome
// sits where a visitor sees it. base.css sets scroll-behavior: smooth, which
// would make each step a tween that has not landed when the next begins.
async function primeReveals(page) {
  await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = "auto";
    const step = Math.max(400, Math.floor(window.innerHeight * 0.7));
    const total = document.documentElement.scrollHeight;
    for (let y = 0; y <= total + step; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    window.scrollTo(0, 0);
  });
  await sleep(700);
}

function fileStem(route, pass) {
  return `${route.name}-${pass.theme}-${pass.viewport}${pass.lang === "ms" ? "-ms" : ""}`;
}

function emptyResult(route, pass) {
  return {
    route: route ? route.path : null,
    name: route ? route.name : "(pass)",
    theme: pass.theme,
    viewport: pass.viewport,
    lang: pass.lang,
    screenshot: null,
    axeReport: null,
    status: null,
    h1: null,
    overflowX: null,
    htmlLang: null,
    title: null,
    pdf: null,
    calendar: null,
    fontsMissing: [],
    errors: [],
    cspViolations: [],
    external: [],
    axeBlocking: [],
    notes: [],
    failures: [],
    ms: 0,
  };
}

async function sweepPage(context, route, pass) {
  const result = emptyResult(route, pass);
  const { errors, external, notes } = result;
  const started = Date.now();
  let page = null;

  // The calendar API on /about: whether the page asked it, and its answer, an
  // HTTP status or the network error.
  const calendarApi = { requested: false, status: null, failure: null };

  try {
    page = await context.newPage();
    page.on("console", (message) => {
      if (message.type() !== "error") return;
      const text = message.text();
      const source = (message.location() && message.location().url) || "";
      const entry = `console: ${text.slice(0, 300)}${source ? ` [${source.slice(0, 200)}]` : ""}`;
      // On Vercel the 404 page is served with status 404, which Chrome logs
      // against the document itself. That is the page working as intended.
      if (route.notFound && source === BASE + route.path && /status of 404/.test(text)) {
        notes.push("document answered 404, as intended");
        return;
      }
      (isCalendarApiFailure(text, source) ? external : errors).push(entry);
    });
    page.on("pageerror", (error) => {
      errors.push(`pageerror: ${String((error && error.message) || error).slice(0, 400)}`);
    });
    page.on("request", (request) => {
      if (request.url().startsWith(CALENDAR_API)) calendarApi.requested = true;
    });
    page.on("response", (response) => {
      if (response.url().startsWith(CALENDAR_API)) calendarApi.status = response.status();
    });
    page.on("requestfailed", (request) => {
      if (!request.url().startsWith(CALENDAR_API)) return;
      calendarApi.failure = (request.failure() && request.failure().errorText) || "failed";
    });
    if (STUB_VERCEL) {
      await page.route(STUBBED_REQUESTS, (handler) =>
        handler.fulfill({ status: 200, contentType: "application/javascript", body: "" })
      );
    }

    const { fonts, status } = await openPage(page, BASE + route.path, notes);
    result.fontsMissing = fonts.missing;
    result.status = status;

    if (route.name === "resume") result.pdf = await pdfState(page);

    await primeReveals(page);

    if (route.name === "about") {
      // The calendar mounts once its surface scrolls near and asks the API,
      // which can be slow on a cold request. Wait for the answer, then for
      // the calendar to draw either the contributions or, when the API
      // failed, a plain div holding the error text, so the screenshot shows
      // the settled page.
      await waitForCalendarApi(calendarApi);
      result.calendar = await calendarState(page);
      await sleep(300);
    }

    const metrics = await page.evaluate(() => ({
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      h1: document.querySelectorAll("h1").length,
      lang: document.documentElement.lang,
    }));
    result.h1 = metrics.h1;
    result.overflowX = metrics.overflowX;
    result.htmlLang = metrics.lang;
    const meta = await pageMeta(page);
    result.title = meta.title;

    const stem = fileStem(route, pass);
    result.screenshot = `${stem}.png`;
    await page.screenshot({ path: path.join(OUT, result.screenshot), fullPage: true });

    const axe = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    result.axeReport = `${stem}.axe.json`;
    fs.writeFileSync(path.join(OUT, result.axeReport), JSON.stringify(axe, null, 2));
    result.axeBlocking = axe.violations
      .filter((violation) => BLOCKING_IMPACTS.has(violation.impact))
      .map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        nodes: violation.nodes.slice(0, 5).map((node) => node.target.join(" ")),
        count: violation.nodes.length,
      }));

    // Collected by the listener the context's init script adds to every page.
    result.cspViolations = await page.evaluate(() => window.__qaCspViolations || []);

    if (fonts.missing.length) {
      result.failures.push(`no loaded face for ${fonts.missing.join(", ")}, measured in fallback fonts`);
    }
    // The 404 page must answer 404, as Vercel and the preview-like-vercel
    // plugin in vite.config.mjs do; a server the sweep did not start (the dev
    // server answers 200 there) is only reported.
    if (route.notFound) {
      if (status !== 404) {
        const message = `the 404 page answered ${status === null ? "no status" : `HTTP ${status}`}, not 404`;
        (SERVE ? result.failures : notes).push(message);
      }
    } else if (status !== 200) {
      result.failures.push(`the page answered ${status === null ? "no status" : `HTTP ${status}`}, not 200`);
    }
    if (route.name === "resume" && result.pdf !== "rendered") {
      result.failures.push(
        result.pdf === "error"
          ? "the resume viewer showed its load error instead of the PDF"
          : `the resume viewer drew no page within ${PDF_TIMEOUT / 1000}s`
      );
    }
    if (metrics.lang !== pass.lang) result.failures.push(`html lang is "${metrics.lang}", expected "${pass.lang}"`);
    if (metrics.overflowX) result.failures.push("horizontal overflow");
    if (metrics.h1 !== 1) result.failures.push(`${metrics.h1} h1 elements`);
    result.failures.push(...metaFailures(route, pass, meta));
    if (result.cspViolations.length) {
      result.failures.push(`${result.cspViolations.length} Content-Security-Policy violation(s)`);
    }
    // The calendar must draw its data unless its API failed on its own; a
    // request the CSP (or anything else in the browser) blocked is not that.
    if (route.name === "about" && result.calendar !== "data") {
      const apiDown =
        calendarApi.failure !== null || (calendarApi.status !== null && (calendarApi.status < 200 || calendarApi.status > 299));
      if (apiDown && !/ERR_BLOCKED/i.test(calendarApi.failure || "")) {
        const why = calendarApi.failure || `HTTP ${calendarApi.status}`;
        notes.push(`contribution calendar API unavailable (${why}); the calendar showed ${result.calendar === "error" ? "its error text" : "nothing"}`);
        if (result.calendar !== "error") result.failures.push("the calendar showed neither its data nor its error text");
      } else if (calendarApi.status !== null) {
        result.failures.push(`the calendar API answered HTTP ${calendarApi.status} but the calendar did not draw its data`);
      } else if (calendarApi.requested) {
        // The request went out and nothing came back in time: the API's
        // problem, not the page's.
        notes.push(
          `contribution calendar API did not answer within ${CALENDAR_API_TIMEOUT / 1000}s; ` +
            `the calendar showed ${result.calendar === "error" ? "its error text" : "nothing"}`
        );
      } else {
        result.failures.push(
          `the calendar never got its data (${calendarApi.failure || "no request reached the network"}); blocked by the Content-Security-Policy or never mounted`
        );
      }
    }
    if (errors.length) result.failures.push(`${errors.length} console/page error(s)`);
    if (result.axeBlocking.length) {
      result.failures.push(`${result.axeBlocking.length} serious/critical axe violation(s)`);
    }
  } catch (error) {
    result.failures.push(`crashed: ${firstLine(error)}`);
  } finally {
    result.ms = Date.now() - started;
    if (page) await page.close().catch(() => {});
  }
  return result;
}

function progress(result) {
  process.stdout.write(
    `${result.failures.length ? "FAIL" : "ok  "} ${result.viewport.padEnd(7)} ${result.theme.padEnd(5)} ` +
      `${result.lang} ${(result.route || result.name).padEnd(26)} ${result.ms}ms\n`
  );
}

// One browser context per pass. A crash outside the per-page work (creating
// the context, its init script) is recorded as a failure of the pass rather
// than aborting the run, so the pages already swept still get reported.
async function sweepPass(browser, pass, routes, results) {
  const started = Date.now();
  let context = null;
  try {
    context = await browser.newContext({
      viewport: VIEWPORTS[pass.viewport],
      deviceScaleFactor: 1,
      colorScheme: pass.theme,
      isMobile: pass.viewport === "mobile",
      hasTouch: pass.viewport === "mobile",
    });
    await context.addInitScript(
      ([theme, lang]) => {
        try {
          window.localStorage.setItem("theme", theme);
          window.localStorage.setItem("language", lang);
        } catch {
          // storage blocked; the app falls back to its defaults
        }
        // Every Content-Security-Policy violation on the page, whether or not
        // Chrome also logs it to the console.
        window.__qaCspViolations = [];
        document.addEventListener("securitypolicyviolation", (event) => {
          window.__qaCspViolations.push(
            `${event.effectiveDirective || event.violatedDirective} blocked ${event.blockedURI || "(inline)"}` +
              (event.sourceFile ? ` in ${event.sourceFile}:${event.lineNumber}` : "")
          );
        });
      },
      [pass.theme, pass.lang]
    );

    for (const route of routes) {
      const result = await sweepPage(context, route, pass);
      results.push(result);
      progress(result);
    }
  } catch (error) {
    const result = emptyResult(null, pass);
    result.failures.push(`pass crashed: ${firstLine(error)}`);
    result.ms = Date.now() - started;
    results.push(result);
    progress(result);
  } finally {
    if (context) await context.close().catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

function pad(value, width) {
  return String(value).padEnd(width);
}

function label(result) {
  return `${result.name} ${result.theme} ${result.viewport} ${result.lang}`;
}

function printTable(results) {
  const header = [
    pad("route", 10),
    pad("theme", 6),
    pad("viewport", 9),
    pad("lang", 5),
    pad("h1", 3),
    pad("overflow", 9),
    pad("errors", 7),
    pad("ext", 4),
    pad("axe", 4),
    pad("notes", 6),
    pad("ms", 6),
    "result",
  ].join(" ");
  console.log("");
  console.log(header);
  console.log("-".repeat(header.length));
  for (const r of results) {
    console.log(
      [
        pad(r.name, 10),
        pad(r.theme, 6),
        pad(r.viewport, 9),
        pad(r.lang, 5),
        pad(r.h1 === null ? "-" : r.h1, 3),
        pad(r.overflowX === null ? "-" : r.overflowX ? "YES" : "no", 9),
        pad(r.errors.length, 7),
        pad(r.external.length, 4),
        pad(r.axeBlocking.length, 4),
        pad(r.notes.length, 6),
        pad(r.ms, 6),
        r.failures.length ? `FAIL ${r.failures.join("; ")}` : "ok",
      ].join(" ")
    );
  }
}

function printDetails(results) {
  const failed = results.filter((r) => r.failures.length);
  if (failed.length) console.log("");
  for (const r of failed) {
    console.log(`${label(r)}  (${r.screenshot || "no screenshot"})`);
    for (const failure of r.failures) console.log(`  ${failure}`);
    for (const violation of r.cspViolations) console.log(`  csp: ${violation}`);
    for (const error of r.errors) console.log(`  ${error}`);
    for (const v of r.axeBlocking) {
      console.log(`  axe ${v.impact} ${v.id}: ${v.help} (${v.count} node${v.count === 1 ? "" : "s"})`);
      for (const target of v.nodes) console.log(`    ${target}`);
    }
  }

  const noted = results.filter((r) => r.notes.length);
  if (noted.length) {
    console.log("");
    console.log("Notes (reported, not failing):");
    for (const r of noted) {
      for (const note of r.notes) console.log(`  ${label(r)}: ${note}`);
    }
  }

  const flaky = results.filter((r) => r.external.length);
  if (flaky.length) {
    console.log("");
    console.log("Contribution calendar API failures (reported, not failing):");
    for (const r of flaky) {
      for (const entry of r.external) console.log(`  ${label(r)}: ${entry}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const routes = selectRoutes(args.routes);
  if (!originOf(BASE)) throw new AbortError(`not a valid url: ${BASE}`);

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const report = {
    base: BASE,
    browser: null,
    channel: process.env.PW_CHANNEL || null,
    commit: process.env.GITHUB_SHA || null,
    stubbedVercelScripts: STUB_VERCEL,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    pages: [],
    failed: 0,
    aborted: null,
  };
  const results = report.pages;

  let stopServer = () => {};
  let browser = null;
  try {
    if (SERVE) stopServer = await startPreview(BASE);

    const launchOptions = { headless: true };
    if (report.channel) launchOptions.channel = report.channel;
    browser = await chromium.launch(launchOptions);
    report.browser = `${browser.browserType().name()} ${browser.version()}`;
    console.log(
      `${report.browser}${report.channel ? ` (channel ${report.channel})` : ""} against ${BASE}: ` +
        `${PASSES.length} passes x ${routes.length} routes`
    );

    for (const pass of PASSES) await sweepPass(browser, pass, routes, results);
  } catch (error) {
    report.aborted = firstLine(error);
    throw error;
  } finally {
    if (browser) await browser.close().catch(() => {});
    stopServer();

    // Written whatever happened, so a crash after some pages still leaves
    // their results next to the screenshots.
    report.finishedAt = new Date().toISOString();
    report.failed = results.filter((r) => r.failures.length).length;
    fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));

    if (results.length) {
      printTable(results);
      printDetails(results);
      console.log("");
      console.log(
        `${results.length} pages, ${report.failed} failed. ` +
          `Screenshots, axe reports and report.json in ${path.relative(ROOT, OUT)}/`
      );
    }
  }
  process.exitCode = report.failed ? 1 : 0;
}

main().catch((error) => {
  console.error(`sweep aborted: ${error instanceof AbortError ? error.message : (error && error.stack) || error}`);
  process.exitCode = 1;
});
