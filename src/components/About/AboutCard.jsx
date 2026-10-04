import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Container, Section, Chip, Reveal } from "../ui";
import photo from "../../Assets/me-1254.webp";

// Jump links under the intro. Each id is the id of a <Section> further down
// About (see About.jsx); the label keys live under about.toc*. Rendered as
// <Link to="#id">, never as a native anchor: a native fragment jump pushes a
// keyless history entry that React Router reports as a POP to the first entry
// of the visit, which ScrollToTop would read as Back to that page and restore
// its offset. A Link is a keyed PUSH, so ScrollToTop glides to the section,
// focuses it, and Back returns to the chips.
const TOC = [
  ["experience", "about.tocExperience"],
  ["education", "about.tocEducation"],
  ["certifications", "about.tocCertifications"],
  ["skills", "about.tocSkills"],
  ["faq", "about.tocFaq"],
  ["contact", "about.tocContact"],
];

// Work setups listed under "Looking for", as aboutCard.<key>.
const SETUPS = ["workRemote", "workHybrid", "workOnsite"];

// Intro: the page's single h1, the bio prose, the "On this page" jump links,
// and an aside with his photo, location, languages and the kind of role he
// is after. The photo is a square formal headshot at its original's full
// 1254 px, enough for 3x phones (about 340 CSS px wide there) and 2x desktops
// (about 403 px); it sits above the fold on desktop, hence the high fetch
// priority.
function AboutCard() {
  const { t } = useTranslation();

  return (
    <Section className="about-intro" id="intro">
      <Container>
        <div className="about-intro__grid">
          <Reveal className="about-intro__copy">
            <span className="eyebrow">{t("home.aboutEyebrow")}</span>
            <h1>{t("home.aboutTitle")}</h1>
            <div className="prose">
              <p>
                {t("aboutCard.intro_pre")} <em>{t("aboutCard.intro_name")}</em>{" "}
                {t("aboutCard.intro_from")} <em>{t("aboutCard.intro_location")}</em>{" "}
                {t("aboutCard.degree")}
              </p>
              <p>
                {t("aboutCard.currentRole_pre")}{" "}
                <em>{t("aboutCard.currentRole_title")}</em>{" "}
                {t("aboutCard.currentRole_at")}{" "}
                <em>{t("aboutCard.currentRole_company")}</em>{" "}
                {t("aboutCard.currentRole_post")}{" "}
                <em>{t("aboutCard.currentRole_prevCompany")}</em>{" "}
                {t("aboutCard.currentRole_end")}
              </p>
            </div>

            <nav className="about-toc" aria-labelledby="about-toc-label">
              <span
                id="about-toc-label"
                className="eyebrow eyebrow--plain about-toc__label"
              >
                {t("about.tocLabel")}
              </span>
              <ul className="chip-row about-toc__list" role="list">
                {TOC.map(([id, key]) => (
                  <li key={id}>
                    <Link to={`#${id}`} className="chip about-toc__link">
                      {t(key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </Reveal>

          <Reveal delay={0.12} className="surface about-aside">
            <img
              className="about-aside__photo"
              src={photo}
              width="1254"
              height="1254"
              alt={t("aboutCard.intro_name")}
              fetchPriority="high"
              decoding="async"
            />
            <dl className="meta-list">
              <dt>{t("aboutCard.metaLocationLabel")}</dt>
              <dd>{t("aboutCard.metaLocationValue")}</dd>
              <dt>{t("aboutCard.metaLanguagesLabel")}</dt>
              <dd>{t("aboutCard.metaLanguagesValue")}</dd>
            </dl>

            <div className="about-aside__block about-aside__looking">
              <h2 className="eyebrow eyebrow--plain about-aside__label">
                {t("aboutCard.lookingForLabel")}
              </h2>
              <p className="about-aside__role">{t("aboutCard.lookingForRole")}</p>
              <ul className="chip-row" role="list">
                {SETUPS.map((key) => (
                  <li key={key}>
                    <Chip>{t(`aboutCard.${key}`)}</Chip>
                  </li>
                ))}
              </ul>
              <p className="text-3 small">{t("aboutCard.lookingForNotice")}</p>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

export default AboutCard;
