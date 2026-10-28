import { useTranslation } from "react-i18next";
import { AiFillGithub, AiOutlineMail } from "react-icons/ai";
import { FiAward } from "react-icons/fi";
import { FaLinkedinIn } from "react-icons/fa";

const links = [
  {
    href: "https://github.com/ZriffDnny",
    label: "GitHub",
    Icon: AiFillGithub,
    external: true,
  },
  {
    href: "https://www.linkedin.com/in/zariffdanial/",
    label: "LinkedIn",
    Icon: FaLinkedinIn,
    external: true,
  },
  {
    href: "https://www.credly.com/users/zariff-danial-bin-zul-azhar",
    label: "Credly",
    Icon: FiAward,
    external: true,
  },
  {
    href: "mailto:zariffdanial.zul@gmail.com",
    label: "Email",
    ariaKey: "navbar.emailAria",
    Icon: AiOutlineMail,
    external: false,
  },
];

// `inert` is set while the mobile menu covers the page.
function SocialSidebar({ inert = false }) {
  const { t } = useTranslation();
  return (
    <aside
      className="social-sidebar"
      aria-label={t("navbar.socialAria")}
      inert={inert}
    >
      <ul>
        {links.map(({ href, label, ariaKey, Icon, external }) => (
          <li key={label}>
            {external ? (
              <a
                href={href}
                aria-label={ariaKey ? t(ariaKey) : label}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon aria-hidden="true" />
              </a>
            ) : (
              <a href={href} aria-label={ariaKey ? t(ariaKey) : label}>
                <Icon aria-hidden="true" />
              </a>
            )}
          </li>
        ))}
      </ul>
      <span className="social-sidebar-line" aria-hidden="true" />
    </aside>
  );
}

export default SocialSidebar;
