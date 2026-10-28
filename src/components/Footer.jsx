import { Link } from "react-router-dom";
import {
  FiGithub,
  FiLinkedin,
  FiMail,
  FiAward,
  FiArrowUpRight,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import Wordmark from "./ui/Wordmark";

// `inert` is set while the mobile menu covers the page. resumeIntent holds
// the pointer and focus handlers App gives the Resume link, which warm the
// resume chunk on intent.
function Footer({ inert = false, resumeIntent = {} }) {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="footer" inert={inert}>
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <Wordmark aria-label={t("navbar.wordmarkAria")} />
            <p className="footer__tagline">{t("footer.tagline")}</p>
          </div>

          <div className="footer__col">
            <h2 className="footer__heading">{t("footer.nav")}</h2>
            <ul>
              <li><Link to="/">{t("navbar.home")}</Link></li>
              <li><Link to="/about">{t("navbar.about")}</Link></li>
              <li><Link to="/project">{t("navbar.projects")}</Link></li>
              <li><Link to="/resume" {...resumeIntent}>{t("navbar.resume")}</Link></li>
              <li><Link to="/uses">{t("footer.uses")}</Link></li>
              <li><Link to="/mytax">MyTax</Link></li>
              <li><Link to="/bestinet">{t("footer.bestinet")}</Link></li>
              <li><Link to="/silent-support">{t("footer.silentSupport")}</Link></li>
              <li><Link to="/baglock">{t("footer.baglock")}</Link></li>
            </ul>
          </div>

          <div className="footer__col">
            <h2 className="footer__heading">{t("footer.elsewhere")}</h2>
            <ul>
              <li>
                <a href="https://github.com/ZriffDnny" target="_blank" rel="noopener noreferrer">
                  <FiGithub aria-hidden="true" /> GitHub
                </a>
              </li>
              <li>
                <a href="https://www.linkedin.com/in/zariffdanial/" target="_blank" rel="noopener noreferrer">
                  <FiLinkedin aria-hidden="true" /> LinkedIn
                </a>
              </li>
              <li>
                <a href="https://www.credly.com/users/zariff-danial-bin-zul-azhar" target="_blank" rel="noopener noreferrer">
                  <FiAward aria-hidden="true" /> Credly
                </a>
              </li>
              <li>
                <a href="mailto:zariffdanial.zul@gmail.com">
                  <FiMail aria-hidden="true" /> zariffdanial.zul@<wbr />gmail.com
                </a>
              </li>
              <li>
                <a href="https://github.com/ZriffDnny/Portfolio" target="_blank" rel="noopener noreferrer">
                  <FiArrowUpRight aria-hidden="true" /> {t("footer.viewSource")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <span>© {year} Zariff Danial</span>
          <span>{t("footer.builtWith")}</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
