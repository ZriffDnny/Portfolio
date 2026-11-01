// Labels come from the locale files under stats.<label>.
// appsShipped stays at 1: only MyTax is corroborated as in production.
// certifications: 127 as of November 2026, all listed on LinkedIn (linked
// from the Certifications section). technologies: the chips in Stack.jsx.
// yearsCoding counts whole years from May 2019 (Java at Kolej Matrikulasi
// Selangor), so it moves on by itself every May.
const CODING_SINCE = { year: 2019, month: 4 }; // month is 0-based: May

function yearsSince({ year, month }) {
  const now = new Date();
  return Math.floor(((now.getFullYear() - year) * 12 + now.getMonth() - month) / 12);
}

export const stats = [
  { value: 100, suffix: "+", label: "certifications" },
  { value: 30, suffix: "+", label: "technologies" },
  { value: 1, suffix: "", label: "appsShipped" },
  { value: yearsSince(CODING_SINCE), suffix: "+", label: "yearsCoding" },
];
