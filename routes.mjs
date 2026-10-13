// Every indexable page of the site, in one place.
//
// Read by the route-html plugin in vite.config.mjs (one static shell per
// route with that page's title, description, canonical and Open Graph tags),
// by the browser sweep in tools/qa/sweep.mjs (which pages to open and which
// title each must end up with), and by src/contract.test.js, which checks this
// list against the rewrites in vercel.json, the <loc> entries in
// public/sitemap.xml and the <Route> paths in src/App.jsx. Adding a page means
// an entry here, a rewrite in vercel.json, a sitemap entry, a Route in App.jsx
// and meta.<titleKey> / meta.<descKey> in both locale files; the test names
// whichever one is missing.
//
// Fields:
//   name         short id used by `npm run qa -- --routes=` and in file names
//   path         the URL path; "/" is the home page (dist/index.html), every
//                other path is written to dist/<path>.html
//   titleKey     meta.<titleKey> in the locale files: the document title
//   descKey      meta.<descKey>: the meta description (160 characters at most)
//   type         og:type when it is not "website"
//   englishOnly  the page body stays in English in every language
//   image        Open Graph image under public/, with its alt text and size;
//                a route without one keeps the home page's /og/home.jpg

export const ORIGIN = "https://zariffdanial.vercel.app";

export const ROUTES = [
  { name: "home", path: "/", titleKey: "home", descKey: "homeDesc" },
  { name: "about", path: "/about", titleKey: "about", descKey: "aboutDesc" },
  { name: "projects", path: "/project", titleKey: "projects", descKey: "projectsDesc" },
  { name: "resume", path: "/resume", titleKey: "resume", descKey: "resumeDesc" },
  { name: "uses", path: "/uses", titleKey: "uses", descKey: "usesDesc" },
  {
    name: "mytax",
    path: "/mytax",
    titleKey: "mytax",
    descKey: "mytaxDesc",
    type: "article",
    englishOnly: true,
    image: {
      path: "/og/mytax.jpg",
      alt: "MyTax case study by Zariff Danial, with the app's login screen in Bahasa Malaysia",
      width: 1200,
      height: 630,
    },
  },
  {
    name: "bestinet",
    path: "/bestinet",
    titleKey: "bestinet",
    descKey: "bestinetDesc",
    type: "article",
    englishOnly: true,
    image: {
      path: "/og/bestinet.jpg",
      alt: "TOTP authenticator case study by Zariff Danial, with a countdown ring above a six-digit code",
      width: 1200,
      height: 630,
    },
  },
  {
    name: "silent-support",
    path: "/silent-support",
    titleKey: "silentSupport",
    descKey: "silentSupportDesc",
    type: "article",
    englishOnly: true,
    image: {
      path: "/og/silent-support.jpg",
      alt: "Silent Support case study by Zariff Danial, with the app's check-in screen asking What are you feeling?",
      width: 1200,
      height: 630,
    },
  },
  {
    name: "baglock",
    path: "/baglock",
    titleKey: "baglock",
    descKey: "baglockDesc",
    type: "article",
    englishOnly: true,
    image: {
      path: "/og/baglock.jpg",
      alt: "Anti-theft fingerprint bag lock case study by Zariff Danial, with a drawing of a backpack with a fingerprint sensor",
      width: 1200,
      height: 630,
    },
  },
];

// Any other path. Vercel serves dist/404.html with status 404, noindex and no
// canonical; the app inside it renders the NotFound page. The path is only
// what the sweep opens to reach it.
export const NOT_FOUND = {
  name: "404",
  path: "/this-route-does-not-exist",
  titleKey: "notFound",
  descKey: "notFoundDesc",
};

// The static file the build writes for a route, relative to dist/.
export function htmlFileFor(route) {
  return route.path === "/" ? "index.html" : `${route.path.slice(1)}.html`;
}
