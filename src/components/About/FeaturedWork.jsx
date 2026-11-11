import { useTranslation } from "react-i18next";
import { FiArrowRight } from "react-icons/fi";
import { Container, Section, Button, Reveal, PhoneFrame } from "../ui";
import { screenshots, lifetimeInstalls } from "../../data/mytax";

// The MyTax panel: label, title, three stats, the case study CTA, and three
// real screenshots in small phone frames. The store buttons sit on the Zen
// entry in Experience, just above, so they are not repeated here, and the
// description names outcomes rather than repeating that entry's role line.
// The install stat reads lifetimeInstalls, so the count is never copied into
// the locale files. Each screenshot's alt text is home.phoneAlt<N>, in
// data/mytax.js order.
function FeaturedWork() {
  const { t } = useTranslation();

  const stats = [
    [lifetimeInstalls, t("home.proofInstallsLabel")],
    [t("about.featuredStat1Value"), t("about.featuredStat1Label")],
    [t("about.featuredStat2Value"), t("about.featuredStat2Label")],
  ];

  return (
    <Section hairline id="featured">
      <Container>
        <Reveal>
          <article className="surface fw-panel">
            <div className="fw-grid">
              <div className="fw-text">
                <span className="eyebrow">{t("about.featuredLabel")}</span>
                <h2>{t("about.featuredTitle")}</h2>
                <p className="lead fw-sub">{t("about.featuredSubtitle")}</p>
                <p className="text-2 fw-desc">{t("about.featuredDescription")}</p>

                <div className="fw-stats">
                  {stats.map(([value, label]) => (
                    <div className="fw-stat" key={label}>
                      <span className="fw-stat__value">{value}</span>
                      <span className="eyebrow eyebrow--plain fw-stat__label">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  to="/mytax"
                  variant="primary"
                  icon={<FiArrowRight />}
                  iconArrow
                  className="fw-cta"
                >
                  {t("about.readCaseStudy")}
                </Button>
              </div>

              <div className="fw-visual">
                {screenshots.map((src, i) => (
                  <PhoneFrame
                    key={src}
                    src={src}
                    size="sm"
                    sizes="(max-width: 767px) 80px, 140px"
                    alt={t(`home.phoneAlt${i + 1}`)}
                  />
                ))}
              </div>
            </div>
          </article>
        </Reveal>
      </Container>
    </Section>
  );
}

export default FeaturedWork;
