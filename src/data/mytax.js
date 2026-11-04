import { FaApple, FaGooglePlay } from "react-icons/fa";
import Huawei from "../components/icons/Huawei";
import { mytaxScreens } from "./screenshots";

// The responsive-image helpers live in data/screenshots.js now; they are
// re-exported here so existing imports keep working.
export {
  screenshotWidth,
  screenshotSmallWidth,
  screenshotSizes,
  srcSetFor,
} from "./screenshots";

// Everything MyTax-related that more than one page shows.
export const screenshots = mytaxScreens;

export const lifetimeInstalls = "3.7M+";

// First-time installs only, so people who reinstall MyTax each filing season
// count once. App Store: App Store Connect's First-Time Downloads, 31 January
// 2023 to 2 November 2026. Google Play: the Play Console's User acquisition
// for New users over Last 5 years (its first install was 18 January 2023),
// to 31 October 2026. AppGallery: the count its listing shows, 4 November
// 2026. Each figure is a floor at three significant figures, and 1.59M +
// 1.83M + 339K gives the 3.7M+ lifetime floor above.
export const storeLinks = [
  {
    kind: "appstore",
    url: "https://apps.apple.com/my/app/mytax/id1632195676",
    Icon: FaApple,
    small: "Download on the",
    big: "App Store",
    aria: "Download MyTax on the App Store",
    count: "1.59M+ installs",
  },
  {
    kind: "playstore",
    url: "https://play.google.com/store/apps/details?id=com.lhdn.mytax",
    Icon: FaGooglePlay,
    small: "Get it on",
    big: "Google Play",
    aria: "Get MyTax on Google Play",
    count: "1.83M+ installs",
  },
  {
    kind: "appgallery",
    url: "https://appgallery.cloud.huawei.com/ag/n/app/C106575285",
    Icon: Huawei,
    small: "Explore it on",
    big: "AppGallery",
    aria: "Explore MyTax on AppGallery",
    count: "339K+ installs",
  },
];

// Press that names the MyTax mobile app itself, not only the MyTax web portal,
// from November 2025 on (each was checked for an app sentence in September
// 2026). `quote` is that sentence as published. The case study is English
// only, so for an article with an English and a Malay edition, titleOriginal,
// urlOriginal and quoteOriginal record the Malay one for provenance and are
// not rendered; a urlOriginal is also how the page tells that the article has
// an English edition. For a Malay-only article (no urlOriginal), the page
// shows titleOriginal as the headline with `title`, an English gloss, under
// it, and quoteOriginal as the quote.
export const press = [
  {
    id: "bernama-kemas-kini-2026",
    publication: "BERNAMA",
    title:
      "Taxpayers urged to update their information regularly, not only in e-Filing season",
    titleOriginal:
      "Pembayar Cukai Disaran Kemas Kini Maklumat Secara Berkala, Bukan Hanya Musim e-Filing",
    quoteOriginal:
      "Ramai masyarakat hanya membuka aplikasi MyTax atau portal hasil.gov.my apabila ingin mengemukakan e-Filing…",
    url: "https://www.bernama.com/bm/news.php?id=2547380",
    date: "2026-04",
  },
  {
    id: "thestar-filing-guide-2026",
    publication: "The Star",
    title:
      "Personal income tax deadline is May 15; here's how to file tax returns online with LHDN",
    quote:
      "Alternatively, e-KYC would be the faster option, but it can only be performed through the MyTax app on a smartphone.",
    url: "https://www.thestar.com.my/tech/tech-news/2026/04/15/personal-income-tax-deadline-is-may-15-here039s-how-to-file-tax-returns-online-with-lhdn",
    date: "2026-04",
  },
  {
    id: "ringgitplus-first-time-2026",
    publication: "RinggitPlus",
    title: "How To File Your Taxes For The First Time",
    titleOriginal: "Cara Failkan Cukai Pendapatan Untuk Kali Pertama",
    quote:
      "If you'd prefer to skip the e-CP55D form, you can use e-KYC through the MyTax mobile app instead.",
    quoteOriginal:
      "Jika anda tidak mahu menggunakan borang e-CP55D, anda boleh gunakan e-KYC melalui aplikasi mudah alih MyTax.",
    url: "https://ringgitplus.com/en/blog/tax/how-to-file-your-taxes-for-the-first-time-2.html",
    urlOriginal:
      "https://ringgitplus.com/ms/blog/cukai-pendapatan/cara-failkan-cukai-pendapatan-untuk-kali-pertama.html",
    date: "2026-03",
  },
];
