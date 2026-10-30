import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { Container, Section, SectionHeading } from "../ui";
import StoreLinks from "../StoreLinks";
import Timeline from "./Timeline";

// Copy lives under experience.<key>.* in the locale files. `links` marks the
// entry that shows the MyTax store buttons; `caseStudy` points an entry at its
// case study page.
const keys = [
  { key: "zen", bullets: ["b1", "b2", "b3", "b4", "b5", "b6"], links: true },
  { key: "bestinet", bullets: ["b1", "b2", "b3", "b4"], caseStudy: "/bestinet" },
  { key: "pantai", bullets: ["b1", "b2", "b3", "b4"] },
];

function Experience() {
  const { t } = useTranslation();

  const entries = keys.map(({ key, bullets, links, caseStudy }) => ({
    id: key,
    period: t(`experience.${key}.period`),
    role: t(`experience.${key}.role`),
    company: t(`experience.${key}.company`),
    meta: t(`experience.${key}.meta`),
    bullets: bullets.map((b) => t(`experience.${key}.${b}`)),
    extra: links ? (
      <div className="tl__extra">
        <span className="eyebrow eyebrow--plain">{t("about.availableOn")}</span>
        <StoreLinks compact />
      </div>
    ) : caseStudy ? (
      <div className="tl__extra">
        <Link to={caseStudy} className="link-arrow">
          {t("about.readCaseStudy")} <FiArrowRight aria-hidden="true" />
        </Link>
      </div>
    ) : null,
  }));

  return (
    <Section hairline id="experience">
      <Container>
        <SectionHeading
          title={t("about.experienceTitle")}
        />
        <Timeline entries={entries} />
      </Container>
    </Section>
  );
}

export default Experience;
