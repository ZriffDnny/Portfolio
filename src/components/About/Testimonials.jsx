import { useTranslation } from "react-i18next";
import { FiLinkedin } from "react-icons/fi";
import { Container, Section, SectionHeading, Reveal } from "../ui";
import nizamPhoto from "../../Assets/nizam.jpg";
import "../../styles/about-sections.css";

// To add a testimonial: append an object with name, role, company, quote, and
// optionally an avatar (a local imported image is preferred over a remote
// URL). Leave the array empty to hide the entire section.
//
// Tip: ask for LinkedIn recommendations from a peer, a manager, and a lecturer
// for the strongest spread.
const testimonials = [
  {
    id: "shazlin-zen",
    name: "Shazlin Nizam A.",
    role: "Mobile Application Developer",
    company: "Zen Computer Systems",
    quote: "Independent developer with ability to learn something new",
    avatar: nizamPhoto,
  },
];

// Full LinkedIn recommendations list, shown as a single "see all" link
// beneath the quote for visitors who want to verify.
const RECOMMENDATIONS_URL =
  "https://www.linkedin.com/in/zariffdanial/details/recommendations/";

function initialOf(name) {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase();
}

function Testimonials() {
  const { t } = useTranslation();

  if (testimonials.length === 0) return null;

  return (
    <Section tone="alt" hairline id="recommendations">
      <Container>
        <SectionHeading
          title={t("about.recommendationsTitle")}
        />
        {testimonials.map((tst, i) => (
          <Reveal key={tst.id} delay={i * 0.08}>
            <figure className="testimonial">
              <span className="testimonial__mark" aria-hidden="true">
                &ldquo;
              </span>
              {/* Quoted as written on LinkedIn, in English in both languages. */}
              <blockquote className="testimonial__quote" lang="en">
                <p>{tst.quote}</p>
              </blockquote>
              <figcaption className="testimonial__author">
                {tst.avatar ? (
                  <img
                    src={tst.avatar}
                    alt={tst.name}
                    className="testimonial__avatar"
                    width="44"
                    height="44"
                    loading="lazy"
                  />
                ) : (
                  <span
                    className="testimonial__avatar testimonial__avatar--placeholder"
                    aria-hidden="true"
                  >
                    {initialOf(tst.name)}
                  </span>
                )}
                <div>
                  <div className="testimonial__name">{tst.name}</div>
                  <div className="testimonial__role text-3 small">
                    {tst.role}
                    {tst.company ? " · " + tst.company : ""}
                  </div>
                </div>
              </figcaption>
            </figure>
          </Reveal>
        ))}
        <Reveal delay={0.15}>
          <div className="testimonial__more">
            <a
              href={RECOMMENDATIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="link-arrow"
            >
              <FiLinkedin aria-hidden="true" />
              {t("about.seeAllRecommendations")}
            </a>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

export default Testimonials;
