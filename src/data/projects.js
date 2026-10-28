import baglock from "../Assets/Projects/baglock.svg";
import bookstore from "../Assets/Projects/bookstore.webp";
import bestinet from "../Assets/Projects/bestinet.svg";
import { mytaxScreens, silentSupportScreens, halalSajiScreens } from "./screenshots";

// Single source of truth for the project list. Copy lives in the locale
// files as projects.<id>_title and projects.<id>_desc.
//
// Phone shots come from the screenshot registry (data/screenshots.js), so a
// card's image is the same fingerprinted file the case study shows and
// PhoneFrame finds its 300px rendition through srcSetFor().
//
// imgKind: "phone" renders the image inside a PhoneFrame (portrait shots).
// imgFit:  "cover" for card art drawn at 16:10, "contain" for mockup PNGs.
// coursework: "fyp" or "team" labels university work (projects.<kind>Badge).
export const projects = [
  {
    id: "mytax",
    category: "mobile",
    img: mytaxScreens[1],
    imgKind: "phone",
    featured: true,
    production: true,
    caseStudy: "/mytax",
    tags: ["Flutter", "Dart", "Provider", "Firebase", "HMS"],
  },
  {
    id: "silentsupport",
    category: "mobile",
    img: silentSupportScreens[0],
    imgKind: "phone",
    personal: true,
    caseStudy: "/silent-support",
    tags: ["React Native", "Expo", "TypeScript", "Supabase", "Groq"],
    ghLink: "https://github.com/ZriffDnny/Silent-Support-App",
  },
  {
    // Private repository, so the card shows "No public repo".
    id: "halalsaji",
    category: "mobile",
    img: halalSajiScreens[0],
    imgKind: "phone",
    personal: true,
    tags: ["Flutter", "Dart", "Provider", "Firestore", "Geolocator"],
  },
  {
    id: "bestinet",
    category: "mobile",
    img: bestinet,
    imgFit: "cover",
    proprietary: true,
    caseStudy: "/bestinet",
    tags: ["Flutter", "Dart", "GetX", "TOTP", "Secure storage"],
  },
  {
    id: "baglock",
    category: "embedded",
    img: baglock,
    coursework: "fyp",
    caseStudy: "/baglock",
    tags: ["C++", "Arduino", "Fingerprint Sensor", "GPS", "GSM"],
    ghLink: "https://github.com/ZriffDnny/Anti-theft-fingerprint-baglock",
  },
  {
    id: "bookstore",
    category: "web",
    img: bookstore,
    imgFit: "contain",
    coursework: "team",
    tags: ["PHP", "HTML", "MySQL"],
  },
];

export const filters = ["all", "web", "mobile", "embedded"];

// Shown in the "Selected work" section on the home page, in this order.
export const selectedForHome = ["mytax", "silentsupport", "bestinet"];

export const byId = (id) => projects.find((p) => p.id === id);
