import { useTranslation } from "react-i18next";
import { FiGithub } from "react-icons/fi";
import { Container, Section, Reveal } from "./ui";
import {
  Block,
  CaseStudyEnd,
  CaseStudyTop,
  CodeFigure,
  Moment,
  Trace,
} from "./CaseStudy";
import photo from "../Assets/Projects/baglock.jpg";
import schematic from "../Assets/Projects/baglock-schematic.jpg";
import usePageMeta from "../hooks/usePageMeta";
import "../styles/casestudy.css";

const REPO = "https://github.com/ZriffDnny/Anti-theft-fingerprint-baglock";

// The firmware's path from power-on to the owner's phone, in order.
// `chip` is which of the four jobs (lock, detect, alert, locate) a step serves.
const flow = [
  {
    title: "Power on",
    chip: "Lock",
    text:
      "The servo moves to 0° (locked). The Uno checks the fingerprint " +
      "sensor's password and halts if the sensor is missing, then beeps once.",
  },
  {
    title: "Scan",
    chip: "Lock",
    text:
      "With a 50 ms pause between polls, the Uno asks the AS608 for an " +
      "image; when a finger is there, it converts the image to a template " +
      "and searches the stored prints.",
  },
  {
    title: "Match: toggle the latch",
    chip: "Lock",
    text:
      "The enrolled finger (ID #1) unlocks the latch (servo to 90°), and the " +
      "same finger locks it again (0°). Two beeps, and the strike count resets.",
  },
  {
    title: "No match: add a strike",
    chip: "Detect",
    text:
      "A confirmed no-match adds one strike and two short beeps. Smudged or " +
      "unreadable scans do not count.",
  },
  {
    title: "Third strike: raise the alarm",
    chip: "Detect",
    text:
      "Three rapid beeps, then the alert routine starts. Strikes count " +
      "whether the bag is locked or unlocked.",
  },
  {
    title: "Read the location",
    chip: "Locate",
    text:
      "The Uno puts the GSM modem into SMS text mode, then opens the GPS link " +
      "and feeds its NMEA data to TinyGPS++ for latitude and longitude.",
  },
  {
    title: "Text the owner",
    chip: "Alert",
    text:
      "Two texts, a few seconds apart. The first reads, as written in the " +
      "sketch, “Theft alert! Please copy lat/long and paste to google to " +
      "know latest location of bagpack.” The second is just lat,long to six " +
      "decimal places.",
  },
  {
    title: "Re-arm",
    chip: "Lock",
    text: "The fingerprint sensor restarts and scanning resumes.",
  },
];

const parts = [
  {
    name: "Arduino Uno",
    pins: "USB serial · 9600 baud",
    role: "Runs every input and output. Its one hardware serial port stays free for USB debugging.",
  },
  {
    name: "AS608 fingerprint sensor",
    pins: "D2 and D3 · 57600 baud",
    role: "Stores the owner's print and does the matching on the module; the Uno gets back an ID and a confidence score.",
  },
  {
    name: "SIM900A GSM modem",
    pins: "D5 and D6 · 115200 baud",
    role: "Sends the two alert texts with AT commands, through a SIM card and antenna.",
  },
  {
    name: "NEO-6M GPS receiver",
    pins: "D10 and D12 · 9600 baud",
    role: "Supplies latitude and longitude through an external antenna, parsed with TinyGPS++.",
  },
  {
    name: "Servo latch",
    pins: "D8 · Servo library",
    role: "0° locked, 90° unlocked. Always starts locked at power-on.",
  },
  {
    name: "Buzzer",
    pins: "D4",
    role: "Five beep patterns, so the lock gives feedback without a screen.",
  },
  {
    name: "7.4 V battery",
    pins: "Switch · step-down module",
    role: "Portable power for the Uno and every module from one supply.",
  },
];

// Proposal against build, one row per aspect that changed.
const compare = [
  {
    aspect: "Alert threshold",
    proposal: "Five failed attempts in the proposal slides; three in the final report's design",
    built: "Three failed matches",
  },
  {
    aspect: "Lock",
    proposal: "Electromagnet switched by a relay",
    built: "Servo latch, 0° and 90°",
  },
  {
    aspect: "Enrolment",
    proposal: "Register name and IC, store them in a database, generate a bag code",
    built: "Owner's print stored on the AS608 as ID #1, enrolled separately; the lock sketch has no enrolment mode",
  },
  {
    aspect: "Getting the location",
    proposal: "Owner texts the bag and it replies, plus an automatic location text on unauthorised access",
    built: "Only the automatic text, on the third failed match; the bag does not answer incoming texts",
  },
  {
    aspect: "Viewing the location",
    proposal: "A mobile app with a map, with Google Maps also named in the tracing flow",
    built: "Two texts, pasted into Google Maps; the app moved to future work",
  },
];

// Every line stays within 39 characters so the excerpt does not wrap at 390px.
const trigger = `} else if (p == FINGERPRINT_NOTFOUND) {
  // one strike: two short beeps
  count++;
  if (count == 3) {
    // third failed match: three
    // rapid beeps, then
    Serial.println("Send gps signal");
    // read GPS, send both texts
    send_gps();
    count = 0;
  }
  return p;
}`;

function BaglockCaseStudy() {
  const { t } = useTranslation();

  usePageMeta({
    title: t("meta.baglock"),
    description: t("meta.baglockDesc"),
  });

  return (
    <div className="cs-page" lang="en">
      {/* 1. Top bar */}
      <CaseStudyTop />

      {/* 2. Hero */}
      <Section flushTop>
        <Container narrow>
          <header className="cs-hero">
            <span className="eyebrow cs-rise">Case study · Final year project</span>
            <h1 className="display cs-rise">Anti-theft fingerprint bag lock</h1>
            <p className="lead cs-rise">
              A backpack lock that tells its owner when someone else tries it.
              It opens only to the owner&apos;s fingerprint, and after three
              failed matches it texts the owner a theft alert followed by the
              GPS coordinates it reads.
            </p>
            <dl className="meta-list cs-meta cs-rise">
              <div>
                <dt>Role</dt>
                <dd>Individual project: circuit, firmware and testing</dd>
              </div>
              <div>
                <dt>Completed</dt>
                <dd>July 2023</dd>
              </div>
              <div className="cs-meta__span">
                <dt>Programme</dt>
                <dd>Bachelor of Computer Science (Hons.) Netcentric Computing, UiTM</dd>
              </div>
              <div className="cs-meta__span">
                <dt>Stack</dt>
                <dd>Arduino Uno, C++, AT commands, AS608, SIM900A, NEO-6M, TinyGPS++</dd>
              </div>
            </dl>
            <p className="text-3 small cs-caption cs-rise">
              The fingerprint routine builds on Adafruit&apos;s example sketch.
              The prototype no longer exists, so this page works from the final
              report, the proposal slides, the schematic, the code and one
              photo from the project exhibition.
            </p>
          </header>
        </Container>
      </Section>

      {/* 3. Photo band */}
      <Section tone="alt" hairline tight>
        <Container>
          <Reveal as="figure" className="cs-art cs-art--photo">
            <div className="surface cs-art__panel">
              <img
                src={photo}
                alt="The prototype mounted on a black backpack: an Arduino Uno with a perfboard shield, GSM and GPS modules, a battery pack, the fingerprint sensor and the servo latch"
                width="544"
                height="402"
                loading="lazy"
                decoding="async"
              />
            </div>
            <figcaption className="mono cs-art__caption">
              The prototype on a backpack at the final year project exhibition
            </figcaption>
          </Reveal>
        </Container>
      </Section>

      {/* 4. Headline moment */}
      <Moment label="What a stranger at the lock sets off">
        Three failed matches, two texts.
      </Moment>

      {/* 5. Body */}
      <Section hairline>
        <Container narrow>
          <div className="cs-blocks">
            <Block index="01" title="The problem">
              <div className="prose">
                <p>
                  People often lock a backpack with a padlock, if they lock it
                  at all. Padlocks get broken, codes get forgotten, and nobody
                  tells you when someone is working at the lock. Once the bag
                  is gone there is no way to know where it went, and even with
                  a police report, getting it back can take a long time.
                </p>
                <p>
                  A fingerprint lock fixes the forgotten code, but it fails
                  silently too. A stranger can keep trying the sensor and the
                  owner never finds out.
                </p>
              </div>
            </Block>

            <Block index="02" title="A lock that reports">
              <div className="prose">
                <p>
                  So the goal was not just a better lock but a lock that
                  reports. A failed unlock attempt is not just rejected; it is
                  treated as a signal, and three failed matches make the bag
                  text its owner its GPS coordinates.
                </p>
                <p>
                  The closest systems I reviewed either texted the owner about
                  a failed fingerprint but showed the bag&apos;s position only in
                  an Android app backed by cloud storage, or sent a GSM text
                  from a fingerprint-locked gate with no location at all. Mine
                  sends the coordinates in the SMS itself, so the alert reaches
                  the owner with no app, internet connection or server; only
                  looking the coordinates up in Google Maps needs data.
                </p>
              </div>
              <ul className="cs-list text-2">
                <li>
                  <strong>Lock.</strong> Keep the bag shut for everyone except
                  the enrolled owner.
                </li>
                <li>
                  <strong>Detect.</strong> Count failed fingerprint matches.
                </li>
                <li>
                  <strong>Alert.</strong> Text the owner as soon as the third
                  match fails.
                </li>
                <li>
                  <strong>Locate.</strong> Include the bag&apos;s GPS coordinates
                  so the owner can find it.
                </li>
              </ul>
            </Block>

            <Block index="03" title="How it works">
              <div className="prose">
                <p>
                  The firmware is a simple polling loop. One flag holds the lock
                  state, one counter holds failed attempts, and everything else
                  follows from what the sensor reports.
                </p>
              </div>
              <Trace steps={flow} />
              <div className="prose">
                <p>There is no screen, so each event has its own sound:</p>
              </div>
              <ul className="cs-list text-2">
                <li>Boot: one 200 ms beep</li>
                <li>Image captured: a 30 ms blip</li>
                <li>Match: two 200 ms beeps</li>
                <li>No match: two 70 ms beeps</li>
                <li>Alert about to send: three rapid 50 ms beeps</li>
              </ul>
            </Block>

            <Block index="04" title="The hardware">
              <div className="prose">
                <p>
                  Everything runs from one 7.4 V battery through a switch and a
                  step-down module. The Arduino Uno reads the fingerprint
                  sensor, drives the servo latch and buzzer, and talks to the
                  GSM modem and GPS receiver.
                </p>
              </div>
              <ul className="cs-tech" role="list">
                {parts.map((part) => (
                  <li key={part.name} className="surface cs-tech__group">
                    <span className="eyebrow eyebrow--plain">{part.pins}</span>
                    <h3 className="cs-part__name">{part.name}</h3>
                    <p className="text-2 small">{part.role}</p>
                  </li>
                ))}
              </ul>
              <figure className="cs-figure">
                <a
                  href={schematic}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="surface cs-figure__panel"
                  aria-describedby="baglock-schematic-note"
                >
                  <img
                    src={schematic}
                    alt="Wiring schematic: the battery, switch and step-down module feed the Arduino Uno, with the GSM module, fingerprint sensor, buzzer, servo and GPS module on its digital pins"
                    width="1280"
                    height="770"
                    loading="lazy"
                    decoding="async"
                  />
                </a>
                <figcaption className="mono cs-art__caption">
                  Full wiring from the report. It draws the GPS on D11 and D12;
                  the sketch reads it on D10 and D12.{" "}
                  <span id="baglock-schematic-note">
                    Opens the schematic at full size in a new tab.
                  </span>
                </figcaption>
              </figure>
            </Block>

            <Block index="05" title="How the pieces fit together">
              <ul className="cs-list text-2">
                <li>
                  <strong>Three serial devices on one Uno.</strong> The
                  Uno&apos;s only hardware serial port is used for USB
                  debugging, so the fingerprint sensor, GSM modem and GPS all
                  run on SoftwareSerial. Only one of those can listen at a
                  time, so the alert routine takes turns: set up the modem,
                  read the GPS, send both texts, then restart the fingerprint
                  link. The cost is that scanning pauses while the alert runs.
                </li>
                <li>
                  <strong>SMS now, app later.</strong> A text reaches any phone
                  with no internet, app or server, so the alert works without
                  the planned app, which moved to future work.
                </li>
                <li>
                  <strong>Raw AT commands.</strong> AT+CMGF=1 puts the modem in
                  text mode, AT+CMGS addresses the owner&apos;s number, and 0x1A
                  (Ctrl+Z) sends the message.
                </li>
              </ul>
              <CodeFigure caption="The theft trigger, lines 134 to 157 of the sketch (trimmed, comments added)">
                {trigger}
              </CodeFigure>
            </Block>

            <Block index="06" title="Designed against built">
              <div className="prose">
                <p>
                  My proposal was bigger than what I built. The core loop of
                  lock, detect, alert and locate made it into the build, and
                  the report says the prototype met its objectives.
                  Registration, two-way SMS and an app did not.
                </p>
              </div>
              <ul className="cs-compare" role="list">
                {compare.map((row) => (
                  <li key={row.aspect} className="cs-compare__row">
                    <h3 className="cs-compare__aspect">{row.aspect}</h3>
                    <dl className="cs-compare__cells">
                      <div>
                        <dt className="eyebrow eyebrow--plain">Proposal</dt>
                        <dd className="text-2">{row.proposal}</dd>
                      </div>
                      <div>
                        <dt className="eyebrow eyebrow--plain">Built</dt>
                        <dd>{row.built}</dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            </Block>

            <Block index="07" title="Testing and limits">
              <div className="prose">
                <p>
                  I planned the build as a test-and-fix loop: install the Uno,
                  GSM, GPS and fingerprint sensor on one circuit, program them
                  in C++ and AT commands, test the fingerprint sensor, then test
                  SMS, going back to troubleshooting whenever something failed.
                </p>
                <p>
                  My final report describes a working, battery-powered prototype
                  in which the fingerprint lock, failed-attempt alert and SMS
                  location work together, built as one circuit with no separate
                  result for any part. It records no test runs or figures: no
                  false-accept or false-reject rate for matching the owner&apos;s
                  finger, no delivery time for the alert, and for the GPS checks
                  at three places in Shah Alam only that it needs open space and
                  is unreliable indoors or in enclosed spaces. That is the first
                  thing I would change.
                </p>
                <p>The limits I would flag now:</p>
              </div>
              <ul className="cs-list text-2">
                <li>Alerts only work inside the country, because they go over the local GSM network.</li>
                <li>The unit was a little too big for a backpack, and it never moved off perfboard onto a PCB.</li>
                <li>The owner has to copy the coordinates into Google Maps by hand.</li>
                <li>
                  It only reacts to failed scans. A thief who picks up the bag
                  and walks away without touching the sensor triggers nothing.
                </li>
              </ul>
            </Block>

            <Block index="08" title="Looking back at the code">
              <div className="prose">
                <p>
                  Reading the sketch again as a working developer, these are
                  the issues I would raise in a code review.
                </p>
              </div>
              <ul className="cs-list text-2">
                <li>
                  <strong>No check for a real GPS fix.</strong> The isUpdated()
                  block is empty and nothing calls isValid(), so an alert could
                  carry 0.000000,0.000000 if no complete position was parsed.
                  The fix is to check the fix and its age, and send &quot;no
                  fix&quot; when there is not one.
                </li>
                <li>
                  <strong>The modem runs blind.</strong> The code waits a fixed
                  second after each AT command and never reads the replies, so
                  a failed send (no signal, no credit) goes unnoticed and is
                  not retried.
                </li>
                <li>
                  <strong>The alert blocks the lock.</strong> The fixed delays in
                  the alert path add up to about 11 seconds with no scanning. A
                  millis()-based state machine would keep the lock responsive.
                </li>
                <li>
                  <strong>The alert number is baked in.</strong> It is a
                  compile-time constant, so changing the owner&apos;s phone means
                  reflashing the board. It belongs in a setting the owner can
                  change.
                </li>
              </ul>
            </Block>

            <Block index="09" title="What I would build next">
              <ul className="cs-list text-2">
                <li>
                  <strong>Measure it:</strong> owner false rejects over about 20
                  scans, false accepts with other fingers, seconds from the
                  third failed scan to the text arriving, GPS error outdoors
                  against indoors, and battery life.
                </li>
                <li>Send a tap-to-open Google Maps link instead of raw coordinates.</li>
                <li>
                  Let the owner text the bag for its location, and add a
                  movement trigger so a bag carried off untouched still reports.
                </li>
                <li>
                  Replace the blocking delays with a non-blocking state machine,
                  and read the modem&apos;s replies with retries.
                </li>
                <li>Build a companion app that tracks the bag while it moves.</li>
                <li>Move from perfboard to a custom PCB and shrink the unit to fit a backpack.</li>
              </ul>
            </Block>

            <Block index="10" title="The code">
              <div className="prose">
                <p>
                  The sketch, the schematic and a README with the pin map and
                  setup are on GitHub. The alert number is a placeholder to set
                  before uploading.
                </p>
              </div>
              <div className="cs-block__cta">
                <a
                  href={REPO}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-arrow"
                >
                  <FiGithub aria-hidden="true" /> View the code on GitHub
                </a>
              </div>
            </Block>
          </div>

          {/* 6. Contact, next case study and the way back */}
          <CaseStudyEnd current="/baglock" />
        </Container>
      </Section>
    </div>
  );
}

export default BaglockCaseStudy;
