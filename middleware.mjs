// ═══════════════════════════════════════════════════════
//  StreamVault — Routing Middleware (middleware.js)
//  Serves crawler-specific HTML with real OG/Twitter meta
//  tags for share links like /?type=tv&id=125988
//
//  WHY THIS IS NEEDED:
//  WhatsApp / Discord / Instagram / Telegram / iMessage etc.
//  never execute your page's JavaScript. Your current code
//  only updates <meta id="og-title"> etc. client-side
//  (in inline.js shareContent()), which those crawlers never
//  see. This middleware detects the crawler by its
//  User-Agent and returns fully server-rendered meta tags
//  BEFORE your static index.html would otherwise be served.
//
//  Real visitors (normal browsers) are untouched — they still
//  get your app exactly as before.
//
//  Place this file at the ROOT of your project (same level
//  as index.html) and redeploy to Vercel. No other config
//  needed — Vercel auto-detects middleware.js.
// ═══════════════════════════════════════════════════════

export const config = {
  matcher: "/",
};

const TMDB_KEY = "8265bd1679663a7ea12ac168da84d2e8";
const SITE_NAME = "StreamVault";
const FALLBACK_IMAGE = ""; // optional: put a default banner URL here

// Matches the crawlers/bots that generate link previews.
// (Regular browsers never match this, so they pass straight through.)
const BOT_UA_REGEX =
  /(facebookexternalhit|Facebot|WhatsApp|Discordbot|TelegramBot|Twitterbot|LinkedInBot|Slackbot|SkypeUriPreview|Pinterest|redditbot|Applebot|Google-InspectionTool|vkShare|W3C_Validator|Iframely|Embedly)/i;

export default async function middleware(request) {
  const url = new URL(request.url);
  const ua = request.headers.get("user-agent") || "";

  const type = url.searchParams.get("type"); // "movie" | "tv"
  const id = url.searchParams.get("id"); // tmdbId

  // Not a share link, or not a crawler → let the normal static site load.
  if (!type || !id || !BOT_UA_REGEX.test(ua)) {
    return;
  }

  try {
    const kind = type === "tv" ? "tv" : "movie";
    const tmdbUrl = `https://api.themoviedb.org/3/${kind}/${encodeURIComponent(
      id,
    )}?api_key=${TMDB_KEY}&language=en-US`;

    const res = await fetch(tmdbUrl);
    if (!res.ok) return; // fall through to normal site on failure

    const data = await res.json();

    const rawTitle = data.title || data.name || "StreamVault";
    const title = `${rawTitle} — StreamVault`;
    const description = data.overview
      ? data.overview.length > 200
        ? data.overview.slice(0, 200) + "…"
        : data.overview
      : "Discover and track movies & series on StreamVault.";
    const poster = data.poster_path
      ? `https://image.tmdb.org/t/p/w780${data.poster_path}`
      : FALLBACK_IMAGE;
    const pageUrl = url.toString();

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${esc(title)}</title>

<meta property="og:type" content="video.other">
<meta property="og:site_name" content="${esc(SITE_NAME)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
${poster ? `<meta property="og:image" content="${esc(poster)}">` : ""}
<meta property="og:url" content="${esc(pageUrl)}">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
${poster ? `<meta name="twitter:image" content="${esc(poster)}">` : ""}

<!-- Send the (rare) crawler that DOES render the page on to the real app -->
<meta http-equiv="refresh" content="0; url=${esc(pageUrl)}">
</head>
<body></body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=UTF-8",
        "cache-control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (err) {
    // Any failure → don't break the site, just fall through.
    return;
  }
}

function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}