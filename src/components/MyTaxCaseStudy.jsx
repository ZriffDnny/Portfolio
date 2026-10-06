import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { FiArrowUpRight } from "react-icons/fi";
import { FaNewspaper } from "react-icons/fa";
import {
  Container,
  Section,
  Chip,
  Reveal,
  Stagger,
  StaggerItem,
  PhoneFrame,
} from "./ui";
import { Block, CaseStudyEnd, CaseStudyTop, ScreensBand, Trace } from "./CaseStudy";
import StoreLinks from "./StoreLinks";
import { screenshots, lifetimeInstalls, press } from "../data/mytax";
import usePageMeta from "../hooks/usePageMeta";
import { formatMonth } from "../utils/formatMonth";
import "../styles/casestudy.css";

// What each screenshot in data/mytax.js shows, in the same order. Neither
// the alt nor the caption transcribes a value from the screen.
const screenLabels = [
  { alt: "Login screen in Bahasa Malaysia", caption: "Login" },
  { alt: "Tax balance, refund and e-Filing status", caption: "Balance and status" },
  { alt: "ezHASiL services home", caption: "ezHASiL services" },
];

const techStack = [
  { group: "Core", items: ["Flutter", "Dart"] },
  { group: "State Management", items: ["Provider"] },
  { group: "Networking", items: ["Dio", "Retry", "HTTP"] },
  { group: "Authentication", items: ["local_auth (biometric)"] },
  { group: "Storage", items: ["Shared Preferences"] },
  {
    group: "PDF & Documents",
    items: ["Syncfusion PDF Viewer", "pdf"],
  },
  {
    group: "Push (iOS / Android)",
    items: [
      "Firebase Messaging",
      "Flutter Local Notifications",
      "Overlay Support",
    ],
  },
  {
    group: "Push (Huawei)",
    items: ["huawei_push (HMS Push Kit)", "Flutter Local Notifications"],
  },
  {
    group: "Camera & Scanning",
    items: ["mobile_scanner (QR/barcode)", "Camera", "Image Picker"],
  },
  {
    group: "WebViews & HTML",
    items: ["flutter_inappwebview", "webview_flutter", "flutter_html"],
  },
  {
    group: "Location & Maps",
    items: ["Geolocator", "Geocoding", "Map Launcher"],
  },
  {
    group: "Localisation",
    items: ["flutter_localizations", "intl (EN / Bahasa Malaysia)"],
  },
];

// From the three store listings, October 2026 (the caption under the list
// says so; update both together). No-break spaces keep each version with its
// store when the line wraps on a phone.
const facts = [
  ["Live since", "January 2023"],
  ["Min OS", "iOS 15+ · Android 9 (API 28)+"],
  ["Distribution", "iOS · Android · Huawei AppGallery (HMS)"],
  ["App size", "About 190 MB on iOS, 290 MB on AppGallery"],
  ["Current version", "1.0.53 (App Store, AppGallery) · 1.0.54 (Google Play)"],
  ["Latest release", "October 2026"],
  ["Release record", "14 App Store releases, February to October 2026"],
];

// One notification from the server to the phone, before and after the move
// to FCM HTTP v1 (August 2026). `flag: "fixed"` marks the steps where the old
// path went wrong. High level only: approved facts, no code, endpoints, keys
// or configuration.
const pushTrace = [
  {
    title: "Legacy send",
    text:
      "The server sent its iOS and Android messages through Firebase's " +
      "legacy send API, which Google had already retired in 2024, and a bare " +
      "catch around the call meant a failed send left no trace.",
    flag: "fixed",
  },
  {
    title: "HTTP v1",
    text:
      "I moved the sends to FCM HTTP v1 through the Firebase Admin SDK and a " +
      "service account.",
  },
  {
    title: "Both kinds of send",
    text:
      "Messages to one taxpayer's device and broadcasts to every install " +
      "through a topic both moved to v1. The Google send is isolated, so a " +
      "failure there can no longer stop the Huawei broadcast that follows it.",
  },
  {
    title: "Android channel",
    text:
      "Direct messages named an Android notification channel the app never " +
      "registered. I pointed them at the channel the app creates, so Android " +
      "shows them the way the app intends.",
    flag: "fixed",
  },
  {
    title: "Visible failures",
    text:
      "Send errors are logged instead of swallowed, so a problem shows up in " +
      "the server logs.",
  },
  {
    title: "In the app",
    text:
      "The app subscribes to the broadcast topic, and on Android a " +
      "notification can carry an image.",
  },
];

// The two codebases, drawn from the facts on this page. The viewBox is sized
// so the text stays readable at 390px, and the figure is capped on desktop.
const diagramLabel =
  "One Flutter codebase ships to the App Store and Google Play and uses " +
  "Firebase Cloud Messaging for push. A separate HMS codebase ships to " +
  "Huawei AppGallery and uses Huawei Push Kit. Both apps talk to one backend.";

const codebases = [
  {
    x: 0,
    title: "iOS and Android",
    ships: ["App Store", "Google Play"],
    push: ["Firebase Cloud", "Messaging"],
  },
  {
    x: 188,
    title: "Huawei (HMS)",
    ships: ["AppGallery"],
    push: ["Huawei Push Kit"],
  },
];

function CodebaseDiagram() {
  const cardW = 172;
  const cardH = 198;
  const hubY = cardH + 44;
  return (
    <figure className="cs-diagram">
      <svg
        className="cs-diagram__svg"
        viewBox={`0 0 360 ${hubY + 48}`}
        role="img"
        aria-label={diagramLabel}
      >
        {codebases.map((cb) => {
          const left = cb.x + 14;
          const mid = cb.x + cardW / 2;
          return (
            <g key={cb.title}>
              <rect
                className="cs-diagram__card"
                x={cb.x + 0.5}
                y="0.5"
                width={cardW - 1}
                height={cardH}
                rx="12"
              />
              <text className="cs-diagram__title" x={left} y="30">
                {cb.title}
              </text>
              <text className="cs-diagram__sub" x={left} y="50">
                Flutter codebase
              </text>
              <line
                className="cs-diagram__rule"
                x1={left}
                x2={cb.x + cardW - 14}
                y1="64"
                y2="64"
              />
              <text className="cs-diagram__label" x={left} y="86">
                SHIPS TO
              </text>
              {cb.ships.map((line, i) => (
                <text
                  key={line}
                  className="cs-diagram__value"
                  x={left}
                  y={104 + i * 17}
                >
                  {line}
                </text>
              ))}
              <text className="cs-diagram__label" x={left} y="146">
                PUSH
              </text>
              {cb.push.map((line, i) => (
                <text
                  key={line}
                  className="cs-diagram__value"
                  x={left}
                  y={164 + i * 17}
                >
                  {line}
                </text>
              ))}
              <path
                className="cs-diagram__link"
                d={`M${mid} ${cardH + 1} V${cardH + 22} H${cb.x === 0 ? 150 : 210} V${hubY}`}
              />
            </g>
          );
        })}
        <rect
          className="cs-diagram__hub"
          x="60.5"
          y={hubY + 0.5}
          width="239"
          height="46"
          rx="12"
        />
        <text className="cs-diagram__hub-text" x="180" y={hubY + 29} textAnchor="middle">
          One backend
        </text>
      </svg>
      <figcaption className="mono cs-art__caption">
        Two codebases, one backend
      </figcaption>
    </figure>
  );
}

function MyTaxCaseStudy() {
  const { t } = useTranslation();

  usePageMeta({
    title: t("meta.mytax"),
    description: t("meta.mytaxDesc"),
  });

  return (
    <div className="cs-page" lang="en">
      {/* 1. Top bar */}
      <CaseStudyTop />

      {/* 2. Hero */}
      <Section flushTop>
        <Container narrow>
          <header className="cs-hero">
            <span className="eyebrow cs-rise">Case study · Production work</span>
            <h1 className="display cs-rise">MyTax</h1>
            <p className="lead cs-rise">
              Malaysia&apos;s official income tax filing app, used by taxpayers
              nationwide and maintained at Zen Computer Systems for the Inland
              Revenue Board (LHDN). As the 2026 filing season opened, my fixes
              went out in four iOS releases in ten days. This study covers
              those fixes, the server&apos;s push notification path and the
              checks I added to both mobile codebases.
            </p>
            <dl className="meta-list cs-meta cs-rise">
              <div>
                <dt>Client</dt>
                <dd>LHDN Malaysia</dd>
              </div>
              <div>
                <dt>Company</dt>
                <dd>Zen Computer Systems</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>Sole Mobile Developer (MyTax)</dd>
              </div>
              <div>
                <dt>Period</dt>
                <dd>November 2025 to Present</dd>
              </div>
            </dl>
            <div className="cs-stores cs-rise">
              <StoreLinks lng="en" />
            </div>
            <p className="text-3 small cs-caption cs-rise">
              The App Store figure is from App Store Connect analytics,
              May 2026. Google Play and AppGallery figures are the ones
              each store listing shows, September 2026.
            </p>
          </header>
        </Container>
      </Section>

      {/* 3. Screens band */}
      <Section tone="alt" hairline tight>
        <Container>
          <ScreensBand label="MyTax app screenshots">
            {screenshots.map((src, i) => (
              <StaggerItem key={src} as="figure" className="cs-screens__item">
                <PhoneFrame
                  src={src}
                  alt={screenLabels[i]?.alt ?? `MyTax app screen ${i + 1}`}
                  sizes="(max-width: 880px) 138px, 220px"
                />
                {screenLabels[i] && (
                  <figcaption className="mono cs-art__caption cs-screens__caption">
                    {screenLabels[i].caption}
                  </figcaption>
                )}
              </StaggerItem>
            ))}
          </ScreensBand>
        </Container>
      </Section>

      {/* 4. Headline stat */}
      <Section tight>
        <Container>
          <Reveal>
            <div
              className="cs-stat"
              role="figure"
              aria-label="3 million plus lifetime installs across iOS, Android, and Huawei"
            >
              <div className="cs-stat__value tabular">{lifetimeInstalls}</div>
              <span className="eyebrow eyebrow--plain cs-stat__label">
                Lifetime installs across iOS, Android, and Huawei
              </span>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* 5. Body */}
      <Section hairline>
        <Container narrow>
          <div className="cs-blocks">
            <Block index="01" title="Shipped so far">
              <ul className="cs-list text-2">
                <li>
                  <strong>Filing season 2026.</strong>{" "}
                  e-Filing for the 2025 assessment year opened on 1 March
                  2026. My fixes to the refund and audit status screens and
                  login prompts went out in four iOS releases between 10 and
                  19 March, 1.0.41 to 1.0.44.
                </li>
                <li>
                  <strong>Push notifications.</strong>{" "}
                  I moved the server&apos;s push sends to the Firebase Cloud
                  Messaging HTTP v1 API, and added topic broadcasts and
                  Android image notifications in the app.
                </li>
                <li>
                  <strong>A cleaner, checked codebase.</strong>{" "}
                  I cleared more than 200 static analysis warnings in each
                  mobile codebase, and in September 2026 added a CI workflow,
                  a pre-push check and the first unit tests to both of them.
                </li>
              </ul>
            </Block>

            <Block index="02" title="Deep dive: push notifications">
              <div className="prose">
                <p>
                  The path of one notification from the MyTax server to a
                  taxpayer&apos;s phone, as I found it and as it works since
                  August 2026. The steps marked Fixed are where the old path
                  went wrong.
                </p>
              </div>
              <Trace steps={pushTrace} />
            </Block>

            <Block index="03" title="How a change ships">
              <ul className="cs-list text-2">
                <li>
                  <strong>Checked twice.</strong>{" "}
                  Before code leaves my machine, a Git pre-push hook runs
                  static analysis and the unit tests and stops the upload if
                  either fails. GitHub Actions then runs both again and
                  builds a debug APK for pull requests. Both codebases have
                  the same checks.
                </li>
                <li>
                  <strong>Tests are a start, not a suite.</strong>{" "}
                  The unit tests cover small pure functions such as the
                  nearby-branch distance formula and email masking. Before a
                  release I test the build on a device myself.
                </li>
                <li>
                  <strong>I submit every release.</strong>{" "}
                  Once a build passes on the device, I submit it to the
                  App Store, Google Play and AppGallery. The iOS builds go
                  out from a shared Mac mini in the office.
                </li>
              </ul>
            </Block>

            <Block index="04" title="Context">
              <div className="prose">
                <p>
                  MyTax puts LHDN&apos;s e-Filing, payment and refund history,
                  e-KYC onboarding for new taxpayers and biometric login on
                  taxpayers&apos; phones, across iOS, Android and Huawei
                  AppGallery.
                </p>
              </div>
            </Block>

            <Block index="05" title="My role">
              <div className="prose">
                <p>
                  I&apos;m the sole mobile developer assigned to MyTax. The rest
                  of the team on this product focuses on the web platform,
                  so anything that ships to phones for MyTax runs through
                  me: bug fixes, platform-specific adaptations, localisation
                  and feature work, and every release and every store
                  submission across the iOS, Android and Huawei builds. On a
                  multi-platform production app, time management and
                  prioritisation matter as much as the code itself.
                </p>
              </div>
            </Block>

            <Block index="06" title="Two codebases, one product">
              <div className="prose">
                <p>
                  The Huawei build runs without Google Mobile Services, so
                  Firebase Messaging and other Google-dependent plugins are
                  not available there. The app has a separate Flutter
                  codebase for Huawei, which predates me, that swaps in HMS
                  equivalents such as Huawei Push Kit (huawei_push) in place
                  of Firebase Messaging.
                </p>
                <p>
                  Fixes land in the iOS and Android codebase first, and I
                  carry them across to the Huawei one, keeping the two in
                  step on UX, API integration and localisation so users on
                  every platform get the same tax-filing experience.
                </p>
              </div>
              <CodebaseDiagram />
            </Block>

            <Block index="07" title="Technical stack">
              <div className="prose">
                <p>
                  Both codebases are Flutter and Dart. Push is split because
                  the two codebases use different services.
                </p>
              </div>
              <Stagger className="cs-tech" gap={0.05}>
                {techStack.map((group) => (
                  <StaggerItem
                    key={group.group}
                    className="surface cs-tech__group"
                  >
                    <span className="eyebrow eyebrow--plain">
                      {group.group}
                    </span>
                    <div className="chip-row">
                      {group.items.map((item) => (
                        <Chip key={item}>{item}</Chip>
                      ))}
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            </Block>

            <Block index="08" title="Platform & release">
              <figure className="cs-facts-figure">
                <div className="surface cs-facts">
                  <dl className="meta-list">
                    {facts.map(([label, value]) => (
                      <Fragment key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </Fragment>
                    ))}
                  </dl>
                </div>
                <figcaption className="mono cs-art__caption">
                  Store listings as of October 2026
                </figcaption>
              </figure>
            </Block>

            <Block index="09" title="Engineering challenges">
              <ul className="cs-list text-2">
                <li>
                  <strong>Localisation aligned with the web platform.</strong>{" "}
                  The Bahasa Malaysia and English strings have to match the
                  web platform&apos;s copy, and every change is carried across
                  both mobile codebases.
                </li>
                <li>
                  <strong>Production reliability during filing season.</strong>
                  {" "}
                  Traffic spikes hard from March, when e-Filing opens, to
                  the May deadline, and every regression reaches taxpayers
                  at scale.
                </li>
              </ul>
            </Block>

            <Block index="10" title="Press coverage" id="press">
              <div className="prose">
                <p>
                  Malaysian press points taxpayers to the app by name:
                  BERNAMA as a place to keep tax details up to date all
                  year, and filing guides as the place to verify with e-KYC
                  and activate a digital certificate, which checks a MyKad
                  scan against a selfie on the phone.
                </p>
              </div>
              <div className="cs-press-list">
                {press.map((article) => {
                  // A Malay-only article shows its real headline, the English
                  // gloss under it, and its quote.
                  const malayOnly = article.titleOriginal && !article.urlOriginal;
                  const quote = article.quote ?? article.quoteOriginal;
                  return (
                    <a
                      key={article.id}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="surface surface--interactive cs-press"
                    >
                      <span className="cs-press__icon" aria-hidden="true">
                        <FaNewspaper />
                      </span>
                      <span className="cs-press__body">
                        <span className="mono cs-press__source">
                          {article.publication} ·{" "}
                          <time dateTime={article.date}>
                            {formatMonth(article.date, "en")}
                          </time>
                        </span>
                        <strong
                          className="cs-press__title"
                          lang={malayOnly ? "ms" : "en"}
                        >
                          {malayOnly ? article.titleOriginal : article.title}
                        </strong>
                        {malayOnly && (
                          <span className="text-3 small">{article.title}</span>
                        )}
                        <span
                          className="text-2 small"
                          lang={article.quote ? "en" : "ms"}
                        >
                          “{quote}”
                        </span>
                      </span>
                      <span className="cs-press__arrow" aria-hidden="true">
                        <FiArrowUpRight />
                      </span>
                    </a>
                  );
                })}
              </div>
            </Block>

            <Block index="11" title="What I've learned so far">
              <ul className="cs-list text-2">
                <li>
                  <strong>Filing season sets the pace.</strong> Once e-Filing
                  opens, how quickly a fix reaches taxpayers matters as much
                  as the fix itself.
                </li>
                <li>
                  <strong>Read what old code actually does.</strong> The push
                  path compiled and ran without an error, and it was still
                  wrong. A build that passes says nothing about the API it
                  calls or the errors it hides.
                </li>
                <li>
                  <strong>Cross-platform isn&apos;t free.</strong> Every plugin has to be
                  validated on Huawei, not just iOS and Android, and every
                  fix has to be carried across to the second codebase.
                </li>
                <li>
                  <strong>The Android ecosystem is broader than I first thought.</strong>{" "}
                  Different device makers behave differently under the
                  hood, and that&apos;s an area I want to invest more
                  structured testing in as the app evolves.
                </li>
              </ul>
            </Block>
          </div>

          {/* 6. Contact, next case study and the way back */}
          <CaseStudyEnd current="/mytax" />
        </Container>
      </Section>
    </div>
  );
}

export default MyTaxCaseStudy;
