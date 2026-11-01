import { useTranslation } from "react-i18next";
import { FiArrowUpRight, FiAward, FiLinkedin } from "react-icons/fi";
import { Container, Section, SectionHeading, Stagger, StaggerItem } from "../ui";
import { formatMonth } from "../../utils/formatMonth";
import "../../styles/about-sections.css";

// Zariff Danial holds verified badges on Credly alongside the Coursera
// certificates. Any row whose credentialUrl points at credly.com is labelled
// as a badge to verify rather than a certificate to view.
const CREDLY_PROFILE =
  "https://www.credly.com/users/zariff-danial-bin-zul-azhar";

// The full list (127 as of November 2026) lives on LinkedIn; the rows below
// are the ones that matter most for a mobile role, newest first. It backs the
// 100+ stat.
const LINKEDIN_CERTIFICATIONS =
  "https://www.linkedin.com/in/zariffdanial/details/certifications/";

// To add a cert: append an object with title, issuer, date (ISO "YYYY-MM",
// rendered in the active language), and optional credentialUrl +
// credentialId fields. Leave the array empty to hide the
// entire section.
const certifications = [
  {
    id: "ibm-mobile-pc",
    title: "IBM iOS and Android Mobile App Developer Professional Certificate",
    issuer: "IBM",
    date: "2026-11",
    credentialUrl:
      "https://www.coursera.org/account/accomplishments/specialization/2380YDHXROAO",
    credentialId: "2380YDHXROAO",
  },
  {
    id: "meta-android-pc",
    title: "Meta Android Developer Professional Certificate",
    issuer: "Meta",
    date: "2026-10",
    credentialUrl:
      "https://www.coursera.org/account/accomplishments/specialization/1R1SSPT4SHM0",
    credentialId: "1R1SSPT4SHM0",
  },
  {
    id: "meta-ios-ui-spec",
    title: "Meta iOS UI Development Specialization",
    issuer: "Meta",
    date: "2026-10",
    credentialUrl:
      "https://www.coursera.org/account/accomplishments/specialization/YSFT44L6LTH3",
    credentialId: "YSFT44L6LTH3",
  },
  {
    id: "meta-frontend-spec",
    title: "Meta Front-End Developer Professional Certificate",
    issuer: "Meta",
    date: "2025-10",
    credentialUrl:
      "https://www.coursera.org/account/accomplishments/professional-cert/GBO8HRSDL0IJ",
    credentialId: "GBO8HRSDL0IJ",
  },
  {
    id: "comptia-tech-plus",
    title: "CompTIA Tech+ Certification",
    issuer: "CompTIA",
    date: "2025-10",
    credentialUrl:
      "https://www.credly.com/badges/63fedd61-90a9-4869-bb9d-a5725016c123",
  },
  {
    id: "ibm-flutter-spec",
    title: "Developing Mobile Apps with Flutter Specialization",
    issuer: "IBM",
    date: "2025-07",
    credentialUrl:
      "https://www.coursera.org/account/accomplishments/specialization/UL4M9RW95NWE",
    credentialId: "UL4M9RW95NWE",
  },
];

function Certifications() {
  const { t, i18n } = useTranslation();

  if (certifications.length === 0) return null;

  return (
    <Section hairline id="certifications">
      <Container>
        <SectionHeading
          title={t("about.certsTitle")}
          aside={
            <div className="certs__profiles">
              <a
                href={LINKEDIN_CERTIFICATIONS}
                target="_blank"
                rel="noopener noreferrer"
                className="certs__profile"
              >
                <FiLinkedin aria-hidden="true" className="certs__profile-mark" />
                {t("about.allCertifications")}
                <FiArrowUpRight aria-hidden="true" />
              </a>
              <a
                href={CREDLY_PROFILE}
                target="_blank"
                rel="noopener noreferrer"
                className="certs__profile"
              >
                <FiAward aria-hidden="true" className="certs__profile-mark" />
                {t("about.credlyProfile")}
                <FiArrowUpRight aria-hidden="true" />
              </a>
            </div>
          }
        />
        <Stagger as="ul" role="list" className="certs">
          {certifications.map((c) => (
            <StaggerItem as="li" className="certs__row" key={c.id}>
              <div>
                {/* Certificate titles are English in both languages. */}
                <h3 className="certs__title" lang="en">
                  {c.title}
                </h3>
                {c.credentialId && (
                  <p className="certs__id mono text-3 small">
                    {t("about.credentialId") + " " + c.credentialId}
                  </p>
                )}
              </div>
              <div>
                <p className="certs__issuer">{c.issuer}</p>
                <p className="certs__date text-3 small">
                  <time dateTime={c.date}>
                    {formatMonth(c.date, i18n.resolvedLanguage)}
                  </time>
                </p>
              </div>
              {c.credentialUrl && (
                <a
                  href={c.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-arrow certs__link"
                >
                  {c.credentialUrl.includes("credly.com")
                    ? t("about.verifyOnCredly")
                    : t("about.viewCredential")}
                  <FiArrowUpRight aria-hidden="true" />
                </a>
              )}
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </Section>
  );
}

export default Certifications;
