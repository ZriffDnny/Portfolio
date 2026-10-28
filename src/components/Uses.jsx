import { useTranslation } from "react-i18next";
import "../styles/uses.css";
import { Container, Section, SectionHeading, Reveal } from "./ui";
import usePageMeta from "../hooks/usePageMeta";
import {
  SiAndroidstudio,
  SiFlutter,
  SiDart,
  SiJavascript,
  SiPhp,
  SiPython,
  SiPostman,
  SiFigma,
  SiNpm,
  SiGradle,
  SiGit,
  SiGithub,
  SiGooglechrome,
  SiArduino,
} from "react-icons/si";
import { VscVscode } from "react-icons/vsc";
import { FaWindows, FaJava, FaTerminal, FaLaptopCode, FaApple } from "react-icons/fa";
import { CgCPlusPlus } from "react-icons/cg";

// Labels are product names and stay as written. Notes are looked up under
// uses.notes.<noteKey> with the English text here as the fallback, so an item
// without a noteKey renders its note verbatim (handles, model numbers).
const sections = [
  {
    key: "editor",
    items: [
      { Icon: VscVscode, label: "VS Code", noteKey: "vscode", note: "Default Dark+ theme" },
      { Icon: SiAndroidstudio, label: "Android Studio", noteKey: "androidStudio", note: "For Flutter & Android builds" },
      { Icon: SiGit, label: "Git", noteKey: "git", note: "Source control" },
      { Icon: SiGithub, label: "GitHub", note: "@ZriffDnny" },
    ],
  },
  {
    key: "languages",
    items: [
      { Icon: SiFlutter, label: "Flutter", noteKey: "flutter", note: "Primary mobile framework" },
      { Icon: SiDart, label: "Dart", noteKey: "dart", note: "Day-to-day language" },
      { Icon: SiJavascript, label: "JavaScript", noteKey: "javascript", note: "Web work & this portfolio" },
      { Icon: CgCPlusPlus, label: "C++", noteKey: "cpp", note: "Embedded / Arduino projects" },
      { Icon: SiPhp, label: "PHP", noteKey: "php", note: "Earlier web projects" },
      { Icon: SiPython, label: "Python", noteKey: "python", note: "Data science / scripting" },
      { Icon: FaJava, label: "Java", noteKey: "java", note: "University & Android basics" },
    ],
  },
  {
    key: "tools",
    items: [
      { Icon: SiPostman, label: "Postman", noteKey: "postman", note: "API testing" },
      { Icon: SiFigma, label: "Figma", noteKey: "figma", note: "UI mockups & handoff" },
      { Icon: SiNpm, label: "npm", noteKey: "npm", note: "JS package manager" },
      { Icon: SiGradle, label: "Gradle", noteKey: "gradle", note: "Android builds" },
      { Icon: SiArduino, label: "Arduino IDE", noteKey: "arduino", note: "Microcontroller projects" },
    ],
  },
  {
    key: "system",
    items: [
      { Icon: FaWindows, label: "Windows 11", noteKey: "windows", note: "Daily driver OS" },
      { Icon: FaTerminal, label: "PowerShell", noteKey: "powershell", note: "Default terminal" },
      { Icon: SiGooglechrome, label: "Chrome", noteKey: "chrome", note: "Primary browser" },
    ],
  },
  {
    key: "hardware",
    items: [
      {
        Icon: FaLaptopCode,
        label: "ASUS ROG Zephyrus G14",
        noteKey: "zephyrus",
        note: "Personal rig, where I built my early projects (the bag lock, the bookstore). Ryzen 9 4900HS · 16 GB RAM · RTX 2060 Max-Q",
      },
      {
        Icon: FaLaptopCode,
        label: "Lenovo IdeaPad 1 (15AMN7)",
        noteKey: "ideapad",
        note: "Work daily driver at Zen for MyTax mobile dev. Ryzen 5 7520U · 16 GB RAM · Windows 11",
      },
      {
        Icon: FaApple,
        label: "Mac mini",
        noteKey: "macmini",
        note: "Shared office machine I use to ship the MyTax iOS releases to the App Store.",
      },
    ],
  },
];

function Uses() {
  const { t } = useTranslation();

  usePageMeta({
    title: t("meta.uses"),
    description: t("meta.usesDesc"),
  });

  return (
    <Section className="uses-section">
      <Container>
        <SectionHeading
          as="h1"
          title={t("uses.headingPre") + " " + t("uses.headingHighlight")}
          lead={t("uses.subtitle")}
        />

        <div className="uses__groups">
          {sections.map((section) => {
            const headingId = `uses-${section.key}`;
            return (
              <Reveal
                key={section.key}
                as="section"
                className="uses__group"
                aria-labelledby={headingId}
              >
                <div className="uses__group-head">
                  <h2 className="eyebrow" id={headingId}>
                    {t(`uses.${section.key}`)}
                  </h2>
                </div>

                <ul className="uses__list">
                  {section.items.map(({ Icon, label, note, noteKey }) => (
                    <li className="uses__row" key={label}>
                      <span className="uses__icon" aria-hidden="true">
                        <Icon />
                      </span>
                      <div className="uses__text">
                        <h3 className="uses__label">{label}</h3>
                        {note && (
                          <p className="uses__note text-2 small">
                            {noteKey ? t(`uses.notes.${noteKey}`, note) : note}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

export default Uses;
