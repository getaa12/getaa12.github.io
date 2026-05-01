/* ================================================================
   inline.js — extracted from index.html
   All inline <script> blocks merged in document order
================================================================ */

// Loader control — available globally before firebase loads
window._svLoader = {
  advance(i, msg) {
    ["svlS0", "svlS1", "svlS2"].forEach((id, s) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.className = "svl-step" + (s < i ? " done" : s === i ? " active" : "");
    });
    const m = document.getElementById("svlMsg");
    if (m && msg) m.textContent = msg;
  },
  dismiss() {
    const bar = document.querySelector(".svl-bar");
    if (bar) {
      bar.style.animation = "none";
      bar.style.transition = "width .1s ease";
      bar.style.width = "100%";
    }
    this.advance(3, "");
    setTimeout(() => {
      const el = document.getElementById("sv-loader");
      if (el) el.classList.add("out");
      setTimeout(() => {
        const el2 = document.getElementById("sv-loader");
        if (el2) el2.remove();
      }, 220);
    }, 80);
  },
};
// Keep backward compat with firebase-config.js references
window._svLoaderAdvance = (i, msg) => window._svLoader.advance(i, msg);
window._svLoaderDismiss = () => window._svLoader.dismiss();
// Hard fallback: if Firebase never calls dismiss (network error etc), remove loader after 5s
setTimeout(() => {
  if (document.getElementById("sv-loader")) window._svLoader.dismiss();
}, 5000);

/* ─────────────── next block ─────────────── */

// The simplest fix: authScreen starts display:none (set on the element).
// firebase-config.js will call authScreen.style.display = 'flex' if no user is found.
// That still works fine. The flash is gone because we no longer start visible.

/* ─────────────── next block ─────────────── */

/* ── AUTH SCREEN JS — must be global, outside _svAppReady ── */
function switchAuthTab(tab) {
  document
    .getElementById("authTabLogin")
    .classList.toggle("active", tab === "login");
  document
    .getElementById("authTabSignup")
    .classList.toggle("active", tab === "signup");
  document.getElementById("authLoginForm").style.display =
    tab === "login" ? "flex" : "none";
  document.getElementById("authSignupForm").style.display =
    tab === "signup" ? "flex" : "none";
  document.getElementById("authError").classList.remove("visible");
}

function showAuthError(msg) {
  const el = document.getElementById("authError");
  el.textContent = msg;
  el.classList.add("visible");
}

async function doSignIn() {
  const email = document.getElementById("loginEmail").value.trim();
  const pw = document.getElementById("loginPassword").value;
  if (!email || !pw) {
    showAuthError("Please fill in all fields.");
    return;
  }
  const btn = document.getElementById("loginBtn");
  btn.disabled = true;
  btn.textContent = "Signing in…";
  try {
    await window._fbSignIn(email, pw);
  } catch (e) {
    let msg = "Sign-in failed. Check your credentials.";
    if (
      e.code === "auth/user-not-found" ||
      e.code === "auth/wrong-password" ||
      e.code === "auth/invalid-credential"
    )
      msg = "Invalid email or password.";
    if (e.code === "auth/too-many-requests")
      msg = "Too many attempts. Try again later.";
    showAuthError(msg);
    btn.disabled = false;
    btn.textContent = "Sign In to StreamVault";
  }
}

async function doSignUp() {
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const pw = document.getElementById("signupPassword").value;
  if (!name || !email || !pw) {
    showAuthError("Please fill in all fields.");
    return;
  }
  if (pw.length < 6) {
    showAuthError("Password must be at least 6 characters.");
    return;
  }
  const btn = document.getElementById("signupBtn");
  btn.disabled = true;
  btn.textContent = "Creating account…";
  try {
    await window._fbSignUp(email, pw, name);
  } catch (e) {
    let msg = "Sign-up failed.";
    if (e.code === "auth/email-already-in-use")
      msg = "This email is already registered.";
    else if (e.code === "auth/invalid-email") msg = "Invalid email address.";
    else if (e.code === "auth/weak-password")
      msg = "Password is too weak (min 6 characters).";
    else if (e.code === "auth/network-request-failed")
      msg = "Network error. Check your connection.";
    else if (e.code === "auth/operation-not-allowed")
      msg = "Email sign-up is not enabled. Contact the site owner.";
    else msg = "Sign-up failed: " + (e.code || e.message || "Unknown error");
    showAuthError(msg);
    btn.disabled = false;
    btn.textContent = "Create Account";
  }
}

async function doSignOut() {
  await window._fbSignOut();
  if (typeof closeProfileModal === "function") closeProfileModal();
  if (typeof showToast === "function")
    showToast("👋 Signed out. See you soon!");
}

async function doGoogleSignIn() {
  const btns = ["googleSignInBtn", "googleSignUpBtn"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  btns.forEach((b) => {
    b.disabled = true;
    b.querySelector("span").textContent = "Connecting…";
  });
  document.getElementById("authError").classList.remove("visible");
  try {
    await window._fbGoogleSignIn();
  } catch (e) {
    let msg = "Google sign-in failed. Please try again.";
    if (
      e.code === "auth/popup-closed-by-user" ||
      e.code === "auth/cancelled-popup-request"
    )
      msg = "Sign-in window was closed.";
    else if (e.code === "auth/popup-blocked")
      msg = "Pop-up blocked — please allow pop-ups for this site.";
    else if (e.code === "auth/network-request-failed")
      msg = "Network error. Check your connection.";
    showAuthError(msg);
    btns.forEach((b) => {
      b.disabled = false;
      b.querySelector("span").textContent = "Continue with Google";
    });
  }
}

document.addEventListener("keydown", (e) => {
  if (
    e.key === "Enter" &&
    document.getElementById("authScreen").style.display !== "none"
  ) {
    const loginActive = document
      .getElementById("authTabLogin")
      .classList.contains("active");
    if (loginActive) doSignIn();
    else doSignUp();
  }
});

/* ─────────────── next block ─────────────── */

function toggleNavMenu() {
  const wrap = document.getElementById("navMenuWrap");
  const btn = document.getElementById("navHamburgerBtn");
  const isOpen = wrap.classList.toggle("open");
  btn.setAttribute("aria-expanded", isOpen);
}
function closeNavMenu() {
  document.getElementById("navMenuWrap").classList.remove("open");
  document
    .getElementById("navHamburgerBtn")
    .setAttribute("aria-expanded", "false");
}
document.addEventListener("click", function (e) {
  const wrap = document.getElementById("navMenuWrap");
  if (wrap && !wrap.contains(e.target)) closeNavMenu();
  // Close sticky mobile search results when clicking outside both bar AND results
  const stickySearch = document.getElementById("mobileStickySearch");
  const mobileResults = document.getElementById("mobileNavResults");
  if (mobileResults && mobileResults.style.display === "block") {
    if (
      (!stickySearch || !stickySearch.contains(e.target)) &&
      !mobileResults.contains(e.target)
    ) {
      mobileResults.style.display = "none";
    }
  }
});

// (Results are now fixed-position, no need to hide on scroll)

// Mobile sticky search now uses handleSearch() directly

function clearMobileNavSearch() {
  var input = document.getElementById("mobileNavSearchInput");
  var results = document.getElementById("mobileNavResults");
  var clearBtn = document.getElementById("mobileNavClearBtn");
  var box = document.getElementById("searchResults");
  if (input) {
    input.value = "";
    input.focus();
  }
  if (results) results.style.display = "none";
  if (box) box.style.display = "none";
  if (clearBtn) clearBtn.style.display = "none";
}

/* ─────────────── next block ─────────────── */

/* ── Netflix-style hero backdrop loader ── */
(function initHeroBackdrop() {
  const TMDB_KEY = "8265bd1679663a7ea12ac168da84d2e8";
  const BASE = "https://api.themoviedb.org/3";
  const IMG_W1280 = "https://image.tmdb.org/t/p/w1280";
  const CACHE_KEY = "sv_hero_backdrop_v2";

  /* Try to read the featured movie from the app catalog.
     Falls back to fetching today's top trending movie from TMDB. */
  async function getFeaturedTmdbId() {
    // Give app.js a moment to populate window._svFeaturedMovie
    if (window._svFeaturedMovie && window._svFeaturedMovie.tmdbId) {
      return {
        id: window._svFeaturedMovie.tmdbId,
        type: window._svFeaturedMovie.type || "movie",
        title: window._svFeaturedMovie.title,
        year: window._svFeaturedMovie.year,
        rating: window._svFeaturedMovie.rating,
        genres: window._svFeaturedMovie.genres,
      };
    }
    return null;
  }

  async function fetchBackdropForId(tmdbId, type) {
    const endpoint =
      type === "tv"
        ? `${BASE}/tv/${tmdbId}?api_key=${TMDB_KEY}&language=en-US`
        : `${BASE}/movie/${tmdbId}?api_key=${TMDB_KEY}&language=en-US`;
    const r = await fetch(endpoint);
    if (!r.ok) return null;
    const d = await r.json();
    return {
      backdropPath: d.backdrop_path || null,
      overview: d.overview || "",
      title: d.title || d.name || "",
      year: (d.release_date || d.first_air_date || "").slice(0, 4),
      rating: d.vote_average ? d.vote_average.toFixed(1) : null,
      genres: (d.genres || [])
        .slice(0, 2)
        .map((g) => g.name)
        .join(" · "),
    };
  }

  async function fetchTrendingFallback() {
    const r = await fetch(
      `${BASE}/trending/movie/day?api_key=${TMDB_KEY}&language=en-US`,
    );
    if (!r.ok) return null;
    const d = await r.json();
    const m = (d.results || []).find((x) => x.backdrop_path);
    if (!m) return null;
    return {
      backdropPath: m.backdrop_path,
      overview: m.overview || "",
      title: m.title || "",
      year: (m.release_date || "").slice(0, 4),
      rating: m.vote_average ? m.vote_average.toFixed(1) : null,
      genres: "",
    };
  }

  function applyBackdrop(info) {
    if (!info || !info.backdropPath) return;
    const img = document.getElementById("heroBackdrop");
    const titleEl = document.getElementById("heroTitle");
    const overviewEl = document.getElementById("heroOverview");
    const metaEl = document.getElementById("heroMeta");

    /* preload image, then fade in */
    const preload = new Image();
    preload.onload = () => {
      img.src = IMG_W1280 + info.backdropPath;
      img.classList.add("loaded");
    };
    preload.src = IMG_W1280 + info.backdropPath;

    /* Update hero copy if we have real movie data */
    if (info.title) {
      titleEl.innerHTML = info.title
        .replace(/([:–—])/g, "<br/>$1")
        .replace(/<br\/>[:–—]/, "<br/>");
      // Simpler: just set text cleanly
      titleEl.textContent = info.title;
      titleEl.classList.add("hero-title-film");
    }
    if (info.overview) {
      overviewEl.textContent =
        info.overview.length > 180
          ? info.overview.slice(0, 177) + "…"
          : info.overview;
    }
    if (metaEl && (info.rating || info.year || info.genres)) {
      metaEl.innerHTML = [
        info.rating
          ? `<span><span class="star">★</span> ${info.rating} TMDB</span>`
          : "",
        info.year ? `<span class="tag">${info.year}</span>` : "",
        info.genres ? `<span class="tag">${info.genres}</span>` : "",
      ]
        .filter(Boolean)
        .join("");
    }
  }

  async function load() {
    const today = new Date().toISOString().slice(0, 10);
    /* check session cache */
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
      if (cached && cached.date === today && cached.backdropPath) {
        applyBackdrop(cached);
        return;
      }
    } catch {}

    try {
      let info = null;
      const featured = await getFeaturedTmdbId();
      if (featured) {
        info = await fetchBackdropForId(featured.id, featured.type);
        /* fill from catalog if TMDB didn't return some fields */
        if (info) {
          info.title = info.title || featured.title || "";
          info.year = info.year || featured.year || "";
          info.genres =
            info.genres ||
            (Array.isArray(featured.genres)
              ? featured.genres.slice(0, 2).join(" · ")
              : featured.genres || "");
          info.rating = info.rating || featured.rating || null;
        }
      }
      if (!info || !info.backdropPath) {
        info = await fetchTrendingFallback();
      }
      if (info && info.backdropPath) {
        sessionStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ ...info, date: today }),
        );
        applyBackdrop(info);
      }
    } catch (e) {
      /* silently fail — hero keeps gradient BG */
    }
  }

  /* Run after a short delay so app.js can set _svFeaturedMovie first */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(load, 800));
  } else {
    setTimeout(load, 800);
  }
})();

/* ─────────────── next block ─────────────── */

const IMG = "https://image.tmdb.org/t/p/w342";

// Mutable catalog arrays — populated async by loadCatalog()
let catalogMovies = [];
let catalogSeries = [];
let allContent = [];

(function () {
  const API_KEY = "8265bd1679663a7ea12ac168da84d2e8";
  const BASE = "https://api.themoviedb.org/3";
  const CACHE_KEY = "sv_catalog_v3";
  const CACHE_TTL = 60 * 60 * 1000; // 1 hour

  const GENRE_MAP = {
    28: "Action",
    12: "Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    14: "Fantasy",
    36: "History",
    27: "Horror",
    10402: "Music",
    9648: "Mystery",
    10749: "Romance",
    878: "Sci-Fi",
    53: "Thriller",
    10752: "War",
    37: "Western",
    10759: "Action",
    10762: "Kids",
    10763: "News",
    10764: "Reality",
    10765: "Sci-Fi",
    10766: "Soap",
    10767: "Talk",
    10768: "War",
  };

  function normalize(item, type) {
    if (item.adult) return null;
    if (!item.poster_path) return null;
    const title = type === "movie" ? item.title : item.name;
    const dateStr = type === "movie" ? item.release_date : item.first_air_date;
    if (!title) return null;
    return {
      tmdbId: String(item.id),
      type,
      title,
      year: parseInt((dateStr || "0").slice(0, 4)) || 0,
      rating: Math.round((item.vote_average || 0) * 10) / 10,
      genres: (item.genre_ids || []).map((id) => GENRE_MAP[id]).filter(Boolean),
      poster: item.poster_path,
      desc: item.overview || "",
    };
  }

  async function fetchPages(type, pages) {
    const endpoint =
      type === "movie"
        ? "/discover/movie?sort_by=popularity.desc&vote_count.gte=100&include_adult=false"
        : "/discover/tv?sort_by=popularity.desc&vote_count.gte=50&include_adult=false";
    const results = [];
    const seen = new Set();
    for (let p = 1; p <= pages; p++) {
      try {
        const res = await fetch(
          `${BASE}${endpoint}&api_key=${API_KEY}&page=${p}`,
        );
        if (!res.ok) break;
        const data = await res.json();
        if (!data.results) break;
        for (const item of data.results) {
          const n = normalize(item, type);
          if (n && !seen.has(n.tmdbId)) {
            seen.add(n.tmdbId);
            results.push(n);
          }
        }
      } catch (e) {
        break;
      }
    }
    return results;
  }

  async function loadCatalog() {
    // Check session cache first
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { ts, movies, series } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) {
          return { movies, series };
        }
      }
    } catch (e) {}

    // Fetch 20 pages each = ~400 movies + ~400 TV shows
    const [movies, series] = await Promise.all([
      fetchPages("movie", 20),
      fetchPages("tv", 20),
    ]);

    try {
      sessionStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ ts: Date.now(), movies, series }),
      );
    } catch (e) {}

    return { movies, series };
  }

  window._loadCatalog = loadCatalog;
})();

/* ─────────────── next block ─────────────── */

(function () {
  const GRID_IDS = ["grid-trending", "grid-top", "grid-series", "grid-movies"];
  const SKEL_HTML = Array(8)
    .fill(
      '<div class="card skeleton-card">' +
        '<div class="skeleton-poster"></div>' +
        '<div class="skeleton-body">' +
        '<div class="skeleton-line"></div>' +
        '<div class="skeleton-line short"></div>' +
        "</div></div>",
    )
    .join("");
  function injectSkeletons() {
    GRID_IDS.forEach((id) => {
      const g = document.getElementById(id);
      if (g && g.children.length === 0) g.innerHTML = SKEL_HTML;
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectSkeletons);
  } else {
    injectSkeletons();
  }
})();

/* ─────────────── next block ─────────────── */

/* =============================================================
   ===== FIREBASE BOOT WRAPPER =====
   All code below uses FirebaseDB which is backed by the
   in-memory cache. We defer execution until FirebaseDB.hydrate()
   has populated that cache from Firebase Realtime Database.
   _svAppReady() is called by the module script once hydration
   completes (or immediately if hydration already finished).
============================================================= */
window._svAppReady = function () {
  /* =========================================
   ===== 1. DAILY LOGIN BONUS =====
========================================== */
  function handleDailyLogin() {
    const today = new Date().toDateString();
    const lastLogin = FirebaseDB.getItem("sv_last_login");
    if (lastLogin !== today) {
      FirebaseDB.setItem("sv_last_login", today);
      setTimeout(() => {
        showToast("🎁 Daily Bonus: +10 Points earned!");
      }, 1500);
    }
  }

  /* =========================================
   ===== 2. KEYBOARD SHORTCUTS =====
========================================== */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAll();
      closeEarnModal();
      closeSeeAll();
      toggleWatchlist(true);
      closeRoulette();
      closeProfileModal();
      if (document.body.classList.contains("theater-mode")) toggleTheaterMode();
    }
    if (e.key === "/" && document.activeElement.nodeName !== "INPUT") {
      e.preventDefault();
      document.getElementById("searchInput").focus();
    }
    // L = toggle lights/theater mode when player is open
    if (
      (e.key === "l" || e.key === "L") &&
      document.getElementById("playerModal").classList.contains("open") &&
      document.activeElement.nodeName !== "INPUT"
    ) {
      toggleTheaterMode();
    }
  });

  /* =========================================
   ===== 3. USER PROFILE AVATAR =====
========================================== */
  let username =
    (window._svProfile && window._svProfile.name) ||
    FirebaseDB.getItem("sv_username") ||
    "Guest";

  function initProfile() {
    const p = window._svProfile;
    if (!p) return;
    username = p.name || "Guest";
    updateNavAvatar(p);
  }

  function updateNavAvatar(p) {
    if (!p) return;
    const nameEl = document.getElementById("navAvatarName");
    const badgeEl = document.getElementById("navAvatarBadge");
    const innerEl = document.getElementById("navAvatarInner");
    if (nameEl) nameEl.textContent = p.name || "Guest";
    if (badgeEl) badgeEl.textContent = p.badge || "🎬";
    if (innerEl) {
      innerEl.style.background = p.color || "var(--accent)";
      if (p.avatarUrl) {
        innerEl.innerHTML = `<img src="${p.avatarUrl}" alt="${p.name}"/>`;
      } else {
        innerEl.textContent = (p.name || "G").charAt(0).toUpperCase();
      }
    }
  }

  function renameUser() {
    openProfileModal();
  }

  /* ── PROFILE MODAL JS ────────────────────────────────────── */
  const BADGES = [
    "🎬",
    "🎥",
    "🍿",
    "⭐",
    "🏆",
    "🎭",
    "🎞️",
    "🦁",
    "🐉",
    "🌙",
    "🔥",
    "💎",
    "🚀",
    "🎮",
    "🎵",
    "🌟",
    "👾",
    "🦊",
    "🎪",
    "💀",
  ];
  const COLORS = [
    "#e8622a",
    "#f59060",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#06b6d4",
    "#84cc16",
    "#fff",
    "#a78bfa",
  ];

  function openProfileModal() {
    // Always close mobile search results first
    if (typeof closeMobileNavSearch === "function") closeMobileNavSearch();
    const p = window._svProfile || {
      name: username,
      badge: "🎬",
      color: "var(--accent)",
      bio: "",
    };
    // Fill form
    document.getElementById("profileNameInput").value = p.name || "";
    document.getElementById("profileBioInput").value = p.bio || "";
    // Avatar preview
    const bigAvatar = document.getElementById("profileAvatarBig");
    const emojiEl = document.getElementById("profileAvatarEmoji");
    bigAvatar.style.background = p.color || "#e8622a";
    if (p.avatarUrl) {
      emojiEl.innerHTML = `<img src="${p.avatarUrl}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`;
    } else {
      emojiEl.textContent = (p.name || "G").charAt(0).toUpperCase();
      emojiEl.style.fontSize = "2rem";
    }
    document.getElementById("profileDisplayName").textContent =
      p.name || "Guest";
    document.getElementById("profileHandle").textContent = window._svUser
      ? window._svUser.email
      : "";
    document.getElementById("profileBadgeDisplay").textContent =
      p.badge || "🎬";

    // Stats
    const allWl = Object.values(
      JSON.parse(
        FirebaseDB.getItem("sv_mwl") || '{"want":[],"watching":[],"done":[]}',
      ),
    );
    const wlCount = allWl.flat().length;
    const cwCount = Object.keys(
      Object.fromEntries(
        Array.from({ length: FirebaseDB.length }, (_, i) => [
          FirebaseDB.key(i),
          null,
        ]).filter(([k]) => k && k.startsWith("cw_")),
      ),
    ).length;
    const ratingCount = Object.keys(
      JSON.parse(FirebaseDB.getItem("sv_ratings") || "{}"),
    ).length;
    document.getElementById("statWatched").textContent = cwCount;
    document.getElementById("statWatchlist").textContent = wlCount;
    document.getElementById("statRated").textContent = ratingCount;

    // Badge picker
    const bp = document.getElementById("badgePicker");
    bp.innerHTML = BADGES.map(
      (b) => `
    <div class="badge-opt ${b === (p.badge || "🎬") ? "selected" : ""}" onclick="selectBadge('${b}',this)">${b}</div>
  `,
    ).join("");
    window._selectedBadge = p.badge || "🎬";

    // Color picker
    const cp = document.getElementById("colorPicker");
    cp.innerHTML = COLORS.map(
      (c) => `
    <div class="color-opt ${c === (p.color || "#e8622a") ? "selected" : ""}" style="background:${c}" onclick="selectColor('${c}',this)" title="${c}"></div>
  `,
    ).join("");
    window._selectedColor = p.color || "#e8622a";

    document.getElementById("profileModal").classList.add("open");
  }

  function closeProfileModal() {
    document.getElementById("profileModal").classList.remove("open");
  }

  function selectBadge(b, el) {
    document
      .querySelectorAll(".badge-opt")
      .forEach((x) => x.classList.remove("selected"));
    el.classList.add("selected");
    window._selectedBadge = b;
    document.getElementById("profileBadgeDisplay").textContent = b;
  }

  function selectColor(c, el) {
    document
      .querySelectorAll(".color-opt")
      .forEach((x) => x.classList.remove("selected"));
    el.classList.add("selected");
    window._selectedColor = c;
    const bg = document.getElementById("profileAvatarBig");
    bg.style.background = c;
  }

  function triggerAvatarUpload() {
    document.getElementById("avatarFileInput").click();
  }

  function handleAvatarUpload(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target.result;
      window._pendingAvatarUrl = url;
      const emojiEl = document.getElementById("profileAvatarEmoji");
      emojiEl.innerHTML = `<img src="${url}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`;
      showToast("📸 Avatar ready — click Save to apply");
    };
    reader.readAsDataURL(file);
  }

  async function saveProfile() {
    const name =
      document.getElementById("profileNameInput").value.trim() || "Guest";
    const bio = document.getElementById("profileBioInput").value.trim();
    const badge = window._selectedBadge || "🎬";
    const color = window._selectedColor || "#e8622a";
    const avatarUrl =
      window._pendingAvatarUrl ||
      (window._svProfile && window._svProfile.avatarUrl) ||
      "";

    const profile = { name, bio, badge, color, avatarUrl };
    window._svProfile = profile;
    username = name;

    try {
      await window.FirebaseProfile.save(profile);
      FirebaseDB.setItem("sv_username", name);
      updateNavAvatar(profile);
      closeProfileModal();
      showToast(`✅ Profile saved! Welcome, ${name} ${badge}`);
    } catch (e) {
      showToast("❌ Failed to save profile.");
    }
  }

  /* ── COMMENTS JS ─────────────────────────────────────────── */
  let _commentsUnsubscribe = null;

  function getContentKey(item) {
    return (item.type + "_" + item.tmdbId).replace(/[^a-zA-Z0-9_]/g, "_");
  }

  function injectCommentsSection(item) {
    // Remove existing
    const existing = document.getElementById("commentsSection");
    if (existing) existing.remove();
    if (_commentsUnsubscribe) {
      _commentsUnsubscribe();
      _commentsUnsubscribe = null;
    }

    const ck = getContentKey(item);
    const section = document.createElement("div");
    section.className = "comments-section";
    section.id = "commentsSection";

    const user = window._svUser;
    const p = window._svProfile;

    const inputArea = user
      ? `
    <div class="comment-input-area">
      <div class="comment-input-avatar" style="background:${p && p.color ? p.color : "var(--accent)"}">
        ${p && p.avatarUrl ? `<img src="${p.avatarUrl}" alt=""/>` : p ? (p.name || "G").charAt(0).toUpperCase() : "G"}
      </div>
      <div class="comment-input-box">
        <textarea class="comment-textarea" id="commentInput" placeholder="Share your thoughts on ${item.title}…" maxlength="500" rows="2"></textarea>
        <div class="comment-submit-row">
          <button class="comment-submit-btn" id="commentSubmitBtn" onclick="submitComment('${ck}')">Post Comment</button>
        </div>
      </div>
    </div>
  `
      : `<div class="comment-login-cta">Sign in to leave a comment. <a onclick="doSignOut();closeAll()">Sign in</a></div>`;

    section.innerHTML = `
    <div class="comments-title">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      Comments <span class="comments-count" id="commentsCount">0</span>
    </div>
    ${inputArea}
    <div class="comments-list" id="commentsList">
      <div class="comments-loading">Loading comments…</div>
    </div>
  `;

    // Inject before closing of detail body
    const simContainer = document.getElementById("commentsSection");
    const detailBody = document.getElementById("detailBody");
    if (detailBody) detailBody.appendChild(section);

    // Subscribe to real-time comments
    if (window.FirebaseComments) {
      _commentsUnsubscribe = window.FirebaseComments.listen(ck, (comments) => {
        renderComments(comments, ck);
      });
    }
  }

  function renderComments(comments, ck) {
    const list = document.getElementById("commentsList");
    const countEl = document.getElementById("commentsCount");
    if (!list) return;
    if (countEl) countEl.textContent = comments.length;
    if (!comments.length) {
      list.innerHTML =
        '<div class="comments-empty">🍿 No comments yet. Be the first to share!</div>';
      return;
    }
    const myUid = window._svUser && window._svUser.uid;
    list.innerHTML = comments
      .map((c) => {
        const time = c.ts
          ? new Date(c.ts).toLocaleDateString([], {
              month: "short",
              day: "numeric",
            }) +
            " " +
            new Date(c.ts).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";
        const avatarContent = c.avatarUrl
          ? `<img src="${c.avatarUrl}" alt="${c.author}"/>`
          : (c.author || "A").charAt(0).toUpperCase();
        const isOwn = myUid && c.uid === myUid;
        return `
      <div class="comment-item">
        <div class="comment-avatar" style="background:${c.color || "#e8622a"}">${avatarContent}</div>
        <div class="comment-body">
          <div class="comment-meta">
            <span class="comment-author">${escHtml(c.author || "Anonymous")}</span>
            <span class="comment-author-badge">${c.badge || "🎬"}</span>
            <span class="comment-time">${time}</span>
            ${isOwn ? `<button class="comment-delete" onclick="deleteComment('${ck}','${c.id}')" title="Delete">🗑</button>` : ""}
          </div>
          <div class="comment-text">${escHtml(c.text || "")}</div>
        </div>
      </div>
    `;
      })
      .join("");
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  async function submitComment(ck) {
    const textarea = document.getElementById("commentInput");
    const btn = document.getElementById("commentSubmitBtn");
    if (!textarea || !btn) return;
    const text = textarea.value.trim();
    if (!text) return;
    if (!window._svUser) {
      showToast("Sign in to comment");
      return;
    }
    btn.disabled = true;
    btn.textContent = "Posting…";
    const p = window._svProfile;
    try {
      await window.FirebaseComments.post(
        ck,
        text,
        p && p.name,
        p && p.color,
        p && p.badge,
      );
      textarea.value = "";
      showToast("💬 Comment posted!");
    } catch (e) {
      showToast("❌ Failed to post comment.");
    }
    btn.disabled = false;
    btn.textContent = "Post Comment";
  }

  async function deleteComment(ck, id) {
    if (!confirm("Delete this comment?")) return;
    try {
      await window.FirebaseComments.delete(ck, id);
      showToast("🗑 Comment deleted.");
    } catch (e) {
      showToast("❌ Failed to delete comment.");
    }
  }

  /* =========================================
   ===== 4. SCROLL TO TOP =====
========================================== */
  window.addEventListener("scroll", () => {
    const btn = document.getElementById("scrollTopBtn");
    if (window.scrollY > 400) btn.classList.add("visible");
    else btn.classList.remove("visible");
  });

  /* =========================================
   ===== 5. SHARE & COMPLETED CONTENT =====
========================================== */
  let completedContent = JSON.parse(FirebaseDB.getItem("sv_completed") || "{}");

  function shareContent() {
    if (!currentItem) return;
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?type=${currentItem.type}&id=${currentItem.tmdbId}`;
    const text = `Watching ${currentItem.title} on StreamVault!`;

    // Use native Web Share API if available (mobile browsers)
    if (navigator.share) {
      navigator
        .share({
          title: currentItem.title,
          text: text,
          url: shareUrl,
        })
        .then(() => {
          showToast("🔗 Shared successfully!");
          FirebaseDB.setItem("sv_shared", "1");
          addNotif(`🔗 Shared <strong>${currentItem.title}</strong>`);
        })
        .catch((err) => {
          // User cancelled — not an error worth toasting
          if (err.name !== "AbortError") showToast("Could not share.");
        });
      return;
    }

    // Fallback: clipboard API
    const fullText = `${text}\n🎥 ${shareUrl}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(fullText)
        .then(() => {
          showToast("🔗 Link copied to clipboard!");
          FirebaseDB.setItem("sv_shared", "1");
          addNotif(`🔗 Shared <strong>${currentItem.title}</strong>`);
        })
        .catch(() => {
          // Last resort: prompt
          prompt("Copy this link to share:", shareUrl);
        });
    } else {
      prompt("Copy this link to share:", shareUrl);
    }
  }

  function toggleCompleted() {
    if (!currentItem) return;
    const key = currentItem.type + "_" + currentItem.tmdbId;
    if (completedContent[key]) {
      delete completedContent[key];
      showToast("Unmarked as Completed.");
    } else {
      completedContent[key] = true;
      showToast("✅ Marked as Completed!");
    }
    FirebaseDB.setItem("sv_completed", JSON.stringify(completedContent));

    const btn = document.getElementById("detailDoneBtn");
    if (btn)
      btn.innerHTML = completedContent[key] ? "✅ Completed" : "✓ Mark Done";

    // Re-render grids to show badge
    filterGenre(currentGenre, null);
    renderContinueWatching();
  }

  /* =========================================
   ===== POINTS SYSTEM CONFIGURATION =====
========================================== */

  /* =========================================
   ===== CORE STREAMVAULT LOGIC =====
========================================== */
  let currentItem = null,
    currentSeason = 1,
    currentEpisode = 1;
  let currentSortMode = "default";
  let quick90Active = false;

  function toggleQuick90(btn) {
    quick90Active = !quick90Active;
    btn.classList.toggle("active", quick90Active);
    if (quick90Active) showToast("⚡ Showing films under 90 min");
    else showToast("Filter cleared");
    filterGenre(currentGenre, null);
  }
  let watchlist = JSON.parse(FirebaseDB.getItem("sv_watchlist") || "[]");

  function setSortMode(mode, btn) {
    currentSortMode = mode;
    document
      .querySelectorAll(".sort-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    filterGenre(currentGenre, null);
  }

  let currentGenre = "All";
  function applySortToArray(arr) {
    const a = [...arr];
    if (currentSortMode === "rating")
      return a.sort((x, y) => y.rating - x.rating);
    if (currentSortMode === "year") return a.sort((x, y) => y.year - x.year);
    if (currentSortMode === "az")
      return a.sort((x, y) => x.title.localeCompare(y.title));
    return a;
  }

  // Fisher-Yates shuffle — produces a new randomised copy each call
  function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function getUnique(arr) {
    const seen = new Set();
    return arr.filter((i) => {
      if (!i) return false;
      const k = i.type + "_" + i.tmdbId;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  function showToast(msg) {
    const c = document.getElementById("toast-container");
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  function saveWatchlist() {
    FirebaseDB.setItem("sv_watchlist", JSON.stringify(watchlist));
    updateWatchlistUI();
  }

  function isInWatchlist(item) {
    return watchlist.some(
      (w) => w.tmdbId === item.tmdbId && w.type === item.type,
    );
  }

  function toggleWishlist(item, btn, e) {
    e && e.stopPropagation();
    if (isInWatchlist(item)) {
      watchlist = watchlist.filter(
        (w) => !(w.tmdbId === item.tmdbId && w.type === item.type),
      );
      btn && btn.classList.remove("active");
      showToast("✕ Removed from list");
    } else {
      watchlist.push(item);
      btn && btn.classList.add("active");
      showToast("✔ Added to watchlist!");
    }
    saveWatchlist();
  }

  function updateWatchlistUI() {
    document.getElementById("wlCount").textContent = watchlist.length;
    const list = document.getElementById("wl-list");
    if (!watchlist.length) {
      list.innerHTML = `<div class="wl-empty">[ EMPTY ]<br><br>Click the ♡ on<br>any title to save it.</div>`;
      return;
    }
    list.innerHTML = watchlist
      .map(
        (item, i) => `
    <div class="wl-item" onclick="openContent(${JSON.stringify(item).replace(/"/g, "&quot;")})">
      <img class="wl-thumb" src="${IMG + item.poster}" alt="${item.title}" 
        onerror="(function(el,id,type){el.onerror=null;fetch('https://api.themoviedb.org/3/'+(type==='tv'?'tv':'movie')+'/'+id+'?api_key=8265bd1679663a7ea12ac168da84d2e8').then(res=>res.json()).then(d=>{if(d.poster_path){el.src='https://image.tmdb.org/t/p/w342'+d.poster_path;}else{el.style.opacity=0.2;}}).catch(()=>{el.style.opacity=0.2;})})(this,'${item.tmdbId}','${item.type}')"/>
      <div class="wl-info">
        <div class="wl-name">${item.title}</div>
        <div class="wl-sub">${item.year} · ★${item.rating}</div>
      </div>
      <button class="wl-remove" onclick="removeFromWatchlistByIndex(${i},event)" title="Remove">✕</button>
    </div>`,
      )
      .join("");
  }

  function removeFromWatchlistByIndex(i, e) {
    e.stopPropagation();
    watchlist.splice(i, 1);
    showToast("✕ Removed");
    saveWatchlist();
  }

  function toggleWatchlist(forceClose = false) {
    const panel = document.getElementById("watchlist-panel");
    const overlay = document.getElementById("panel-overlay");
    if (forceClose === true && !panel.classList.contains("open")) return;
    panel.classList.toggle("open");
    overlay.classList.toggle("open");
    updateWatchlistUI();
  }

  function openRandom() {
    const item = allContent[Math.floor(Math.random() * allContent.length)];
    showToast("🎲 Random: " + item.title);
    openContent(item);
  }

  function buildCard(item) {
    const d = document.createElement("div");
    d.className = "card";
    d.onclick = () => openContent(item);

    const img = document.createElement("img");
    img.className = "card-poster";
    img.setAttribute("data-loading", "1");
    img.alt = item.title;
    img.loading = "lazy";
    img.onload = () => img.removeAttribute("data-loading");
    img.onerror = () => {
      img.onerror = null;
      const endpoint =
        item.type === "tv"
          ? `https://api.themoviedb.org/3/tv/${item.tmdbId}?api_key=8265bd1679663a7ea12ac168da84d2e8`
          : `https://api.themoviedb.org/3/movie/${item.tmdbId}?api_key=8265bd1679663a7ea12ac168da84d2e8`;
      fetch(endpoint)
        .then((r) => r.json())
        .then((data) => {
          const newPath = data.poster_path;
          if (newPath) {
            item.poster = newPath;
            img.src = IMG + newPath;
            img.removeAttribute("data-loading");
          } else {
            showPlaceholder();
          }
        })
        .catch(() => showPlaceholder());
      function showPlaceholder() {
        img.removeAttribute("data-loading");
        img.style.minHeight = "220px";
        img.style.opacity = "0";
        const ph = document.createElement("div");
        ph.style.cssText =
          "position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg3);color:var(--muted);font-family:var(--font-display);gap:8px;padding:12px;text-align:center;";
        ph.innerHTML =
          '<span style="font-size:2rem">🎬</span><span style="font-size:12px;font-weight:600;color:var(--white);line-height:1.3">' +
          item.title +
          '</span><span style="font-size:11px">' +
          item.year +
          "</span>";
        img.parentNode.style.position = "relative";
        img.parentNode.insertBefore(ph, img.nextSibling);
      }
    };
    img.src = IMG + item.poster;

    const wlActive = isInWatchlist(item) ? "active" : "";
    const isDone = completedContent[item.type + "_" + item.tmdbId];
    const isNew = parseInt(item.year) >= 2024;

    // ── Episode Progress: "Continue S2E4" button ──────────────────
    let continueChip = "";
    let cardEpProgress = "";
    if (item.type === "tv") {
      const cw = getCW(item);
      if (cw && !isDone) {
        const s = cw.season,
          e = cw.ep;
        const totalEps = (item.seasons || 1) * 10;
        const watchedEps = (s - 1) * 10 + e;
        const pct = Math.min(97, Math.round((watchedEps / totalEps) * 100));
        continueChip = `<button class="card-continue-btn" onclick="event.stopPropagation();resumeContent('${item.tmdbId}','tv')">▶ Continue S${s}E${e}</button>`;
        cardEpProgress = `<div class="card-ep-progress"><div class="card-ep-progress-fill" style="width:${pct}%"></div></div>`;
      }
    }

    // ── Live Viewer Count (seeded random, popular titles only) ──────
    function seededRand(seed) {
      let s = seed % 2147483647;
      if (s <= 0) s += 2147483646;
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    }
    const ratingThreshold = 6.8;
    const isPopular = parseFloat(item.rating) >= ratingThreshold;
    let liveViewerBadgeHtml = "";
    if (isPopular) {
      const seed =
        parseInt(String(item.tmdbId).replace(/\D/g, "").slice(0, 8)) || 12345;
      // Base count: 40–600 depending on rating
      const ratingFactor = Math.max(
        0,
        Math.min(
          1,
          (parseFloat(item.rating) - ratingThreshold) / (9.5 - ratingThreshold),
        ),
      );
      const baseCount = Math.round(
        40 + seededRand(seed) * 560 * (0.3 + 0.7 * ratingFactor),
      );
      liveViewerBadgeHtml = `<div class="card-live-badge" data-base="${baseCount}" data-seed="${seed}"><span class="card-live-dot"></span><span class="card-live-num">${baseCount}</span> watching</div>`;
    }

    const overlay = `
    <div class="card-overlay">
      <button class="card-play">▶</button>
      <div class="card-overlay-title">${item.title}</div>
      <div class="card-overlay-sub">${item.year} &nbsp;·&nbsp; ★ ${item.rating}</div>
      ${continueChip}
    </div>
    ${cardEpProgress}
    <div class="card-done-badge" style="display:${isDone ? "block" : "none"}">✓ DONE</div>
    ${isNew ? `<div class="card-new-badge">NEW</div>` : ""}
    ${liveViewerBadgeHtml}
    <button class="card-wishlist ${wlActive}" id="wl-${item.type}-${item.tmdbId}" onclick="wishlistCardClick(this,event)" data-idx="${allContent.indexOf(item)}">${isInWatchlist(item) ? "♥" : "♡"}</button>`;
    const runtimeDisplay = item.runtime
      ? `<span class="card-runtime">⏱ ${item.runtime} min</span>`
      : item.type === "tv" && item.seasons
        ? `<span class="card-runtime">📺 ${item.seasons} season${item.seasons > 1 ? "s" : ""}</span>`
        : "";
    const body = `
    <div class="card-body">
      <div class="card-title">${item.title}</div>
      <div class="card-meta">
        <span class="card-rating">★ ${item.rating}</span>
        <span>${item.year}</span>
        <span class="card-type ${item.type === "tv" ? "series" : "movie"}">${item.type === "tv" ? "Series" : "Movie"}</span>
        ${runtimeDisplay}
      </div>
      <div class="list-desc">${item.desc || ""}</div>
    </div>`;
    d.insertAdjacentHTML("beforeend", overlay + body);
    d.insertBefore(img, d.firstChild);

    // ── Trailer Autoplay on Hover (1.5s delay) ──────────────────────
    let hoverTimer = null;
    let trailerIframe = null;
    let trailerKey = null; // cached YouTube key

    async function fetchTrailerKey() {
      if (trailerKey) return trailerKey;
      try {
        const type = item.type === "tv" ? "tv" : "movie";
        const res = await fetch(
          `https://api.themoviedb.org/3/${type}/${item.tmdbId}/videos?api_key=8265bd1679663a7ea12ac168da84d2e8&language=en-US`,
        );
        const data = await res.json();
        const vid = (data.results || []).find(
          (v) =>
            v.site === "YouTube" &&
            (v.type === "Trailer" || v.type === "Teaser"),
        );
        trailerKey = vid ? vid.key : null;
      } catch {
        trailerKey = null;
      }
      return trailerKey;
    }

    function injectTrailer(key) {
      if (trailerIframe) return; // already injected
      const wrap = document.createElement("div");
      wrap.className = "card-trailer-wrap";
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube.com/embed/${key}?autoplay=1&mute=1&controls=0&loop=1&playlist=${key}&modestbranding=1&rel=0&playsinline=1`;
      iframe.allow = "autoplay; encrypted-media";
      iframe.allowFullscreen = false;
      iframe.className = "card-trailer-iframe";
      wrap.appendChild(iframe);
      d.insertBefore(wrap, d.querySelector(".card-overlay"));
      trailerIframe = wrap;
      requestAnimationFrame(() => wrap.classList.add("visible"));
    }

    function removeTrailer() {
      if (!trailerIframe) return;
      trailerIframe.classList.remove("visible");
      setTimeout(() => {
        trailerIframe && trailerIframe.remove();
        trailerIframe = null;
      }, 350);
    }

    d.addEventListener("mouseenter", () => {
      hoverTimer = setTimeout(async () => {
        const key = await fetchTrailerKey();
        if (key) injectTrailer(key);
      }, 1500);
    });

    d.addEventListener("mouseleave", () => {
      clearTimeout(hoverTimer);
      removeTrailer();
    });

    return d;
  }

  function wishlistCardClick(btn, e) {
    e.stopPropagation();
    const idx = parseInt(btn.dataset.idx);
    const item = allContent[idx];
    toggleWishlist(item, btn, e);
    btn.textContent = isInWatchlist(item) ? "♥" : "♡";
  }

  // ── Live Viewer Count Ticker ─────────────────────────────────────
  (function initLiveViewerTicker() {
    let tick = 0;
    function updateAll() {
      tick++;
      document.querySelectorAll(".card-live-badge").forEach((badge) => {
        const base = parseInt(badge.dataset.base) || 100;
        const seed = parseInt(badge.dataset.seed) || 1;
        const drift = Math.sin(tick * 0.7 + seed * 0.003) * 0.03;
        const noise = (Math.random() - 0.5) * 0.04;
        const count = Math.max(1, Math.round(base * (1 + drift + noise)));
        const numEl = badge.querySelector(".card-live-num");
        if (numEl) {
          const prev =
            parseInt(numEl.textContent.replace(/[,k]/g, "")) || count;
          if (prev !== count) {
            numEl.classList.add("card-live-num-bump");
            setTimeout(() => numEl.classList.remove("card-live-num-bump"), 400);
          }
          numEl.textContent =
            count >= 1000
              ? (count / 1000).toFixed(1).replace(/\.0$/, "") + "k"
              : count;
        }
      });
    }
    setTimeout(() => {
      updateAll();
      setInterval(updateAll, 5500);
    }, 2000);
  })();

  function renderGrid(id, items) {
    const g = document.getElementById(id);
    if (!g) return;
    g.innerHTML = "";
    const sorted = applySortToArray(items);
    sorted.forEach((i) => g.appendChild(buildCard(i)));
    if (currentViewMode === "list") g.classList.add("list-view");
    else g.classList.remove("list-view");
  }

  function openContent(item) {
    currentItem = item;
    currentSeason = 1;
    currentEpisode = 1;
    renderDetail(item);
    document.getElementById("detailModal").classList.add("open");
    document.getElementById("detailBody").scrollTo(0, 0);
    document.body.style.overflow = "hidden";
    window.history.replaceState(
      null,
      "",
      `?type=${item.type}&id=${item.tmdbId}`,
    );
    setAmbientGlow(item);
  }

  /* ===== DYNAMIC FETCH ADDITIONAL TMDB DETAILS ===== */
  async function fetchDetailedInfo(item) {
    const type = item.type === "tv" ? "tv" : "movie";
    const url = `https://api.themoviedb.org/3/${type}/${item.tmdbId}?api_key=8265bd1679663a7ea12ac168da84d2e8&include_adult=false&append_to_response=credits,videos`;
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error("Failed to fetch detailed info", e);
      return null;
    }
  }

  /* ===== 6. WATCH TRAILER ===== */
  function playTrailer(ytKey) {
    const overlay = document.getElementById("trailerOverlay");
    if (overlay) {
      const tb = document.getElementById("trailerTitleBar");
      if (tb)
        tb.textContent = currentItem
          ? currentItem.title + " — Trailer"
          : "Trailer";
      document.getElementById("trailerFrame").src =
        `https://www.youtube.com/embed/${ytKey}?autoplay=1`;
      overlay.classList.add("open");
      document.body.style.overflow = "hidden";
    } else {
      document.getElementById("playerModal").classList.add("open");
      document.getElementById("detailModal").classList.remove("open");
      document.getElementById("modalTitle").textContent = currentItem
        ? currentItem.title + " — Trailer"
        : "Trailer";
      document.getElementById("playerFrame").src =
        `https://www.youtube.com/embed/${ytKey}?autoplay=1`;
    }
  }

  /* ===== 7. SIMILAR CONTENT ===== */
  function renderSimilarContent(targetItem) {
    if (!targetItem.genres || targetItem.genres.length === 0) return "";
    const targetGenre = targetItem.genres[0]; // grab primary genre

    // Find up to 6 unique similar items that aren't the target item
    const similarItems = getUnique(allContent)
      .filter(
        (i) => i.tmdbId !== targetItem.tmdbId && i.genres.includes(targetGenre),
      )
      .sort(() => 0.5 - Math.random())
      .slice(0, 6); // Randomize slighty

    if (similarItems.length === 0) return "";

    const gridHtml = similarItems
      .map(
        (si) => `
    <div class="similar-card" onclick='openContent(${JSON.stringify(si).replace(/'/g, "&#39;")})'>
      <img src="${IMG + si.poster}" onerror="this.style.opacity=0.2" alt="${si.title}"/>
      <div class="similar-card-title" title="${si.title.replace(/"/g, "&quot;")}">${si.title}</div>
    </div>
  `,
      )
      .join("");

    return `
    <div class="similar-section">
      <div class="similar-title">More Like This</div>
      <div class="similar-grid">${gridHtml}</div>
    </div>
  `;
  }

  /* ===== RENDER DETAIL PAGE ===== */
  function renderDetail(it) {
    document.getElementById("detailTitle").textContent =
      it.title + " (" + it.year + ")";
    const genres = (it.genres || [])
      .map((g) => `<span class="pill">${g}</span>`)
      .join("");
    const wlLabel = isInWatchlist(it) ? "♥ In Watchlist" : "♡ Watchlist";
    const typeLabel =
      it.type === "tv"
        ? `Series · ${it.seasons} season${it.seasons > 1 ? "s" : ""}`
        : "Movie";

    const itemKey = it.type === "movie" ? `movie_${it.tmdbId}` : null;
    const playLabel = it.type === "movie" ? "▶ Play Movie" : "";

    const isDone = completedContent[it.type + "_" + it.tmdbId];
    const doneLabel = isDone ? "✅ Completed" : "✓ Mark Done";

    const heroBg = IMG + it.poster;

    document.getElementById("detailBody").innerHTML = `
    <div class="detail-hero">
      <div class="detail-hero-bg" id="detailHeroBg" style="background-image:url('${heroBg}')"></div>
      <div class="detail-hero-grad"></div>
      <div class="detail-hero-content">
        <img class="detail-poster" src="${heroBg}" alt="${it.title}" onerror="this.style.opacity=0.2"/>
        <div class="detail-hero-info">
          <div class="detail-hero-title">${it.title}</div>
          
          <div class="detail-tagline" id="detailTagline" style="display:none;"></div>
          
          <div class="detail-meta-row">
            <span class="pill accent">★ ${it.rating}</span>
            <span class="pill">${it.year}</span>
            <span class="pill">${typeLabel}</span>
            <span class="pill" id="detailRuntime" style="display:none;background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.2)"></span>
            ${genres}
          </div>

          <div class="detail-crew" id="detailCrew" style="display:none;">
             <div class="crew-item"><span class="crew-label">Director</span> <span id="detailDirector">—</span></div>
             <div class="crew-item"><span class="crew-label">Cast</span> <span id="detailCast">—</span></div>
          </div>

          <p class="detail-desc" id="detailDesc">${it.desc || ""}</p>
          
          <div class="detail-actions">
            ${
              it.type === "movie"
                ? `<button class="btn btn-primary" onclick="playNow()">${playLabel}</button>`
                : getContinueBtn(it)
            }
            <div id="dynamicDetailActions" style="display:contents"></div>
            <button class="btn btn-ghost" id="detailWlBtn" onclick="toggleWishlistDetail()">${wlLabel}</button>
            <button class="btn btn-ghost" id="detailDoneBtn" onclick="toggleCompleted()">${doneLabel}</button>
            <button class="btn btn-ghost" onclick="shareContent()">🔗 Share</button>
            <button class="btn btn-ghost" onclick="openIMDb('${it.title.replace(/'/g, "\\'")}')">🔍 IMDb</button>
          </div>
          <!-- FEATURE 2: PERSONAL STAR RATING -->
          <div class="user-rating-row">
            <span class="user-rating-label">Your rating:</span>
            <div class="star-picker" id="starPicker">
              ${[1, 2, 3, 4, 5].map((n) => `<span class="star-pick" data-val="${n}" onclick="setUserRating(${n})">★</span>`).join("")}
            </div>
            <span id="userRatingLabel" style="font-size:13px;color:var(--muted);font-family:var(--font-display);margin-left:6px;"></span>
          </div>
        </div>
      </div>
    </div>
    ${it.type === "tv" ? `<div class="ep-browser" id="epBrowser">${buildEpSection(it, 1)}</div>` : ""}
    <div id="similarContentContainer"></div>
  `;

    // Inject Similar Content
    document.getElementById("similarContentContainer").innerHTML =
      renderSimilarContent(it);

    // FEATURE 2: init star rating display
    initUserRatingUI(it);

    // Inject comments section
    setTimeout(() => injectCommentsSection(it), 80);

    // Fetch TMDB
    fetchDetailedInfo(it).then((data) => {
      if (!data) return;

      // Guard against adult/mismatched TMDB results
      if (
        data.adult === true ||
        (data.title &&
          it.type === "movie" &&
          data.title.toLowerCase() !== it.title.toLowerCase() &&
          !data.title
            .toLowerCase()
            .includes(it.title.toLowerCase().slice(0, 6)))
      ) {
        console.warn(
          "TMDB adult or title mismatch — skipping metadata for",
          it.title,
        );
        return;
      }

      if (data.backdrop_path) {
        const bgEl = document.getElementById("detailHeroBg");
        const img = new Image();
        img.src = `https://image.tmdb.org/t/p/w1280${data.backdrop_path}`;
        img.onload = () => {
          bgEl.style.backgroundImage = `url('${img.src}')`;
          bgEl.style.filter = "brightness(0.35) saturate(1.1) blur(0px)";
        };
      }

      if (data.tagline) {
        const tl = document.getElementById("detailTagline");
        tl.textContent = `"${data.tagline}"`;
        tl.style.display = "block";
      }

      const runtime =
        it.type === "movie"
          ? data.runtime
          : data.episode_run_time && data.episode_run_time[0];
      if (runtime) {
        const rt = document.getElementById("detailRuntime");
        rt.innerHTML = `⏱ ${runtime} min`;
        rt.style.display = "inline-block";
        // Store runtime on item so cards show it
        it.runtime = runtime;
        _refreshCardInGrids(it);
      }

      if (data.overview && data.overview.length > (it.desc?.length || 0)) {
        document.getElementById("detailDesc").textContent = data.overview;
      }

      if (data.credits) {
        const crewContainer = document.getElementById("detailCrew");
        let directorStr = "N/A";
        if (it.type === "movie") {
          const directorObj = data.credits.crew.find(
            (c) => c.job === "Director",
          );
          if (directorObj) directorStr = directorObj.name;
        } else {
          if (data.created_by && data.created_by.length > 0) {
            directorStr = data.created_by.map((c) => c.name).join(", ");
          }
        }
        const castStr = data.credits.cast
          .slice(0, 4)
          .map((c) => c.name)
          .join(", ");
        if (directorStr !== "N/A" || castStr.length > 0) {
          document.getElementById("detailDirector").textContent = directorStr;
          document.getElementById("detailCast").textContent = castStr || "N/A";
          crewContainer.style.display = "flex";
        }
      }

      // SEASONS FIX — /discover/tv never returns number_of_seasons,
      // but /tv/{id} does. Update the item and rebuild the season tabs.
      if (
        it.type === "tv" &&
        data.number_of_seasons &&
        data.number_of_seasons > (it.seasons || 1)
      ) {
        it.seasons = data.number_of_seasons;
        // Also patch the same item inside the catalog arrays so re-opens are correct
        const catalogMatch = (
          typeof catalogSeries !== "undefined" ? catalogSeries : []
        ).find((c) => c.tmdbId === it.tmdbId);
        if (catalogMatch) catalogMatch.seasons = data.number_of_seasons;

        const epBrowser = document.getElementById("epBrowser");
        if (epBrowser) epBrowser.innerHTML = buildEpSection(it, 1);
      }

      // Check for Trailer
      if (data.videos && data.videos.results) {
        const trailer = data.videos.results.find(
          (v) => v.type === "Trailer" && v.site === "YouTube",
        );
        if (trailer) {
          document.getElementById("dynamicDetailActions").innerHTML = `
          <button class="btn btn-ghost" onclick="playTrailer('${trailer.key}')">🎥 Trailer</button>
        `;
        }
      }

      // FEATURE 5: CAST CARDS
      if (data.credits && data.credits.cast && data.credits.cast.length > 0) {
        const castHtml = data.credits.cast
          .slice(0, 12)
          .map((c) => {
            const photo = c.profile_path
              ? `https://image.tmdb.org/t/p/w185${c.profile_path}`
              : "";
            const initials = c.name
              .split(" ")
              .map((x) => x[0])
              .join("")
              .slice(0, 2);
            const imgEl = photo
              ? `<img class="cast-avatar" src="${photo}" alt="${c.name}" onerror="this.style.display='none'">`
              : `<div class="cast-avatar" style="display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:700;color:var(--muted);font-size:1.2rem">${initials}</div>`;
            return `<div class="cast-card" title="${c.name} as ${c.character || ""}">
          ${imgEl}
          <div class="cast-name">${c.name}</div>
          <div class="cast-char">${(c.character || "").slice(0, 20)}</div>
        </div>`;
          })
          .join("");
        // Insert cast section before similar content
        const simContainer = document.getElementById("similarContentContainer");
        const castSection = document.createElement("div");
        castSection.className = "cast-section";
        castSection.innerHTML = `<div class="similar-title" style="margin-bottom:12px"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> Cast</div><div class="cast-scroll">${castHtml}</div>`;
        simContainer.parentNode.insertBefore(castSection, simContainer);
      }
    });
    // Inject extra UI elements after DOM settles
    setTimeout(() => {
      const desc = document.getElementById("detailDesc");
      if (desc && desc.parentNode) {
        // Remove any existing AI review panel before re-injecting
        const existingReview =
          desc.parentNode.querySelector(".ai-review-panel");
        if (existingReview) existingReview.remove();
        const review = document.createElement("div");
        review.className = "ai-review-panel";
        review.innerHTML = `
        <div class="ai-review-label">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          AI Summary
        </div>
        <div class="ai-review-text">${getAIReview(it)}</div>`;
        desc.parentNode.insertBefore(review, desc.nextSibling);
      }
      // Reactions row
      const simContainer = document.getElementById("similarContentContainer");
      if (simContainer) {
        const existing = document.getElementById("reactionsRow");
        if (existing) existing.remove();
        const reactDiv = document.createElement("div");
        reactDiv.className = "reactions-row";
        reactDiv.id = "reactionsRow";
        simContainer.parentNode.insertBefore(reactDiv, simContainer);
        renderReactions();
      }
      // Extra action buttons in detail actions
      const dynActions = document.getElementById("dynamicDetailActions");
      if (dynActions && !dynActions.querySelector(".coll-toggle-btn")) {
        const collBtn = document.createElement("button");
        collBtn.className = "btn btn-ghost coll-toggle-btn";
        collBtn.innerHTML =
          '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> Add to List';
        collBtn.onclick = () => addToCollection(it);
        dynActions.appendChild(collBtn);

        const wpBtn = document.createElement("button");
        wpBtn.className = "btn btn-ghost";
        wpBtn.innerHTML =
          '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> Watch Party';
        wpBtn.onclick = () => openWatchParty();
        dynActions.appendChild(wpBtn);
      }
      // Watchtime goal in detail body
      const heroContent = document.querySelector(".detail-hero-info");
      if (heroContent && !heroContent.querySelector(".goal-bar-wrap")) {
        const progress = getGoalProgress();
        const goalDiv = document.createElement("div");
        goalDiv.className = "goal-bar-wrap";
        goalDiv.innerHTML = `
        <div class="goal-header">
          <span class="goal-label">Weekly Watchtime Goal (${watchGoalHours}h)</span>
          <span class="goal-pct">${progress}%</span>
        </div>
        <div class="goal-track"><div class="goal-fill" style="width:${progress}%"></div></div>`;
        heroContent.appendChild(goalDiv);
      }
    }, 100);
  }

  function toggleWishlistDetail() {
    const btn = document.getElementById("detailWlBtn");
    toggleWishlist(currentItem, btn, null);
    btn.textContent = isInWatchlist(currentItem)
      ? "♥ In Watchlist"
      : "♡ Watchlist";
  }

  /* ===== DYNAMIC TMDB EPISODE FETCHING ===== */
  async function fetchSeasonEpisodes(tmdbId, season) {
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/tv/${tmdbId}/season/${season}?api_key=8265bd1679663a7ea12ac168da84d2e8`,
      );
      const data = await res.json();
      if (data.episodes) return data.episodes;
    } catch (e) {}
    return null;
  }

  async function renderEpisodesToGrid(tmdbId, season, gridId, fallbackPoster) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = `<div style="color:var(--muted);padding:20px;grid-column:1/-1;text-align:center;font-family:var(--font-display);">Fetching episodes...</div>`;

    let episodes = await fetchSeasonEpisodes(tmdbId, season);
    if (!episodes || episodes.length === 0) {
      episodes = Array.from({ length: 12 }, (_, i) => ({
        episode_number: i + 1,
        name: `Episode ${i + 1}`,
        still_path: fallbackPoster,
        overview: "Click to watch this episode",
      }));
    }

    let html = "";
    episodes.forEach((ep) => {
      const epNum = ep.episode_number;
      const title = ep.name || `Episode ${epNum}`;
      const desc = ep.overview || "Click to watch this episode";

      let thumbUrl = `https://image.tmdb.org/t/p/w300${fallbackPoster}`;
      if (ep.still_path)
        thumbUrl = `https://image.tmdb.org/t/p/w300${ep.still_path}`;

      const epKey = `tv_${tmdbId}_s${season}e${epNum}`;
      const epRuntime = ep.runtime
        ? `<span class="ep-runtime">⏱ ${ep.runtime} min</span>`
        : "";
      const airDate = ep.air_date
        ? `<span class="ep-airdate">${ep.air_date.slice(0, 4)}</span>`
        : "";

      html += `
      <div class="ep-card" onclick="playEpisodeFromDetail(${season},${epNum})">
        <div class="ep-card-thumb-wrap">
          <img class="ep-card-thumb" src="${thumbUrl}" alt="S${season}E${epNum}" loading="lazy" onerror="this.style.opacity=0.15"/>
        </div>
        <div class="ep-card-body">
          <div class="ep-card-num" style="display:flex;justify-content:space-between;align-items:center">
            <span>S${season} · E${epNum}</span>
            <span style="display:flex;gap:6px;align-items:center">${airDate}${epRuntime}</span>
          </div>
          <div class="ep-card-title" title="${title.replace(/"/g, "&quot;")}">${title}</div>
          <div class="ep-card-desc" title="${desc.replace(/"/g, "&quot;")}">${desc}</div>
        </div>
      </div>`;
    });
    grid.innerHTML = html;
  }

  function buildEpSection(it, activeSeason) {
    const sn = it.seasons || 1;
    const seasonTabs = Array.from({ length: sn }, (_, i) => {
      const s = i + 1;
      return `<button class="ep-season-tab ${s === activeSeason ? "active" : ""}" onclick="switchSeason(${s},this)">${sn > 1 ? "Season " + s : "Season 1"}</button>`;
    }).join("");
    setTimeout(
      () =>
        renderEpisodesToGrid(it.tmdbId, activeSeason, "epCardsGrid", it.poster),
      0,
    );
    return `<div class="ep-season-bar"><span class="ep-season-label">Season:</span>${seasonTabs}</div><div class="ep-cards-grid" id="epCardsGrid"></div>`;
  }

  function switchSeason(s, btn) {
    currentSeason = s;
    document
      .querySelectorAll(".ep-season-tab")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    renderEpisodesToGrid(
      currentItem.tmdbId,
      s,
      "epCardsGrid",
      currentItem.poster,
    );
  }

  /* ===== CONTINUE WATCHING ===== */
  function getCWKey(item) {
    return "cw_" + item.type + "_" + item.tmdbId;
  }

  function saveCW(item, season, ep) {
    const key = getCWKey(item);
    const data = {
      tmdbId: item.tmdbId,
      type: item.type,
      title: item.title,
      poster: item.poster,
      season,
      ep,
      ts: Date.now(),
    };
    FirebaseDB.setItem(key, JSON.stringify(data));
    renderContinueWatching();
    _refreshCardInGrids(item);
  }

  function _refreshCardInGrids(item) {
    const selector = "#wl-" + item.type + "-" + item.tmdbId;
    document.querySelectorAll(selector).forEach((wlBtn) => {
      const card = wlBtn.closest(".card");
      if (card && !card.classList.contains("cw-card")) {
        const newCard = buildCard(item);
        card.parentNode.replaceChild(newCard, card);
      }
    });
  }

  function getCW(item) {
    try {
      return JSON.parse(FirebaseDB.getItem(getCWKey(item)) || "null");
    } catch {
      return null;
    }
  }

  function getAllCW() {
    const items = [];
    for (let i = 0; i < FirebaseDB.length; i++) {
      const k = FirebaseDB.key(i);
      if (k && k.startsWith("cw_")) {
        try {
          items.push(JSON.parse(FirebaseDB.getItem(k)));
        } catch {}
      }
    }
    return items.sort((a, b) => b.ts - a.ts).slice(0, 8);
  }

  function removeCW(tmdbId, type, e) {
    e && e.stopPropagation();
    FirebaseDB.removeItem("cw_" + type + "_" + tmdbId);
    renderContinueWatching();
    showToast("✕ Removed from Continue Watching");
  }

  /* ===== 8. CLEAR WATCH HISTORY ===== */
  function clearAllCW() {
    if (!confirm("Are you sure you want to clear your entire Watch History?"))
      return;
    for (let i = FirebaseDB.length - 1; i >= 0; i--) {
      const k = FirebaseDB.key(i);
      if (k && k.startsWith("cw_")) FirebaseDB.removeItem(k);
    }
    renderContinueWatching();
    showToast("🗑 Watch History cleared.");
  }

  function renderContinueWatching() {
    const section = document.getElementById("sec-continue");
    const grid = document.getElementById("grid-continue");
    if (!section || !grid) return;
    const cw = getAllCW();
    if (!cw.length) {
      section.style.display = "none";
      return;
    }
    section.style.display = "block";
    grid.innerHTML = cw
      .map((item) => {
        const found = allContent.find(
          (a) => a.tmdbId === item.tmdbId && a.type === item.type,
        );
        if (!found) return "";
        const label =
          item.type === "tv" ? `S${item.season} · E${item.ep}` : "Movie";
        // Progress simulation: use episode/season as rough proxy; movies get 40–75% range
        let pct = 45;
        if (item.type === "tv") {
          const totalEps = (found.seasons || 1) * 10;
          const watchedEps = (item.season - 1) * 10 + item.ep;
          pct = Math.min(95, Math.round((watchedEps / totalEps) * 100));
        } else {
          // Use stored video time if available
          const vk = FirebaseDB.getItem(`vk_movie_${item.tmdbId}`);
          pct = vk
            ? Math.min(95, Math.round((parseFloat(vk) / 7200) * 100))
            : 42;
        }
        return `<div class="card cw-card" onclick="resumeContent('${item.tmdbId}','${item.type}')" style="position:relative">
      <img class="card-poster" src="${IMG}${item.poster}" alt="${item.title}" loading="lazy" onerror="this.style.opacity=0.2"/>
      <div class="card-overlay" style="opacity:1;background:linear-gradient(to top,rgba(0,0,0,.9) 0%,transparent 60%)">
        <button class="card-play" style="opacity:1;transform:translate(-50%,-50%) scale(1)">▶</button>
        <div class="card-overlay-title">${item.title}</div>
        <div class="card-overlay-sub">${label}</div>
      </div>
      <button class="card-wishlist" style="top:7px;left:7px;right:auto;font-size:12px;width:24px;height:24px" onclick="removeCW('${item.tmdbId}','${item.type}',event)" title="Remove">✕</button>
      <!-- PROGRESS BAR -->
      <div class="cw-progress-wrap"><div class="cw-progress-fill" style="width:${pct}%"></div></div>
      <div class="card-body">
        <div class="card-title">${item.title}</div>
        <div class="card-meta">
          <span class="card-type ${item.type === "tv" ? "series" : "movie"}">${label}</span>
          <span style="font-size:11px;color:var(--accent);font-family:var(--font-mono);margin-left:auto">${pct}%</span>
        </div>
      </div>
    </div>`;
      })
      .join("");
  }

  function resumeContent(tmdbId, type) {
    const found = allContent.find(
      (a) => a.tmdbId === tmdbId && a.type === type,
    );
    if (!found) return;
    const cw = getCW(found);
    currentItem = found;
    currentSeason = cw ? cw.season : 1;
    currentEpisode = cw ? cw.ep : 1;
    renderDetail(found);
    document.getElementById("detailModal").classList.add("open");
    document.getElementById("detailBody").scrollTo(0, 0);
    document.body.style.overflow = "hidden";
  }

  function getContinueBtn(it) {
    const cw = getCW(it);
    let season = 1,
      ep = 1;
    if (cw && it.type === "tv") {
      season = cw.season;
      ep = cw.ep;
    }

    const epKey = `tv_${it.tmdbId}_s${season}e${ep}`;
    const playLabel = `▶ Resume S${season}E${ep}`;

    return `<button class="btn btn-primary" onclick="playEpisodeFromDetail(${season},${ep})">${playLabel}</button>`;
  }

  /* ===== PLAY FUNCTIONS ===== */
  function playNow() {
    const movieKey = `movie_${currentItem.tmdbId}`;
    if (!checkAndUnlock(movieKey)) return;
    saveCW(currentItem, 1, 1);
    showMiniPlayer(currentItem, "Movie");
    addNotif(`▶ Started watching <strong>${currentItem.title}</strong>`);
    openFullPage();
  }

  function playEpisodeFromDetail(season, ep) {
    const epKey = `tv_${currentItem.tmdbId}_s${season}e${ep}`;
    if (!checkAndUnlock(epKey)) return;
    currentSeason = season;
    currentEpisode = ep;
    saveCW(currentItem, season, ep);
    showMiniPlayer(currentItem, `S${season} E${ep}`);
    addNotif(
      `▶ Started watching <strong>${currentItem.title}</strong> S${season}E${ep}`,
    );
    openFullPage();
  }

  /* ── PLAYER SOURCES — ordered by least ads first ─────────────── */
  const PLAYER_SOURCES = [
    {
      id: "vidking",
      label: "VidKing",
      movie: (id) => `https://www.vidking.net/embed/movie/${id}`,
      tv: (id, s, e) => `https://www.vidking.net/embed/tv/${id}/${s}/${e}`,
    },
    {
      id: "embedsu",
      label: "Embed.su",
      movie: (id) => `https://embed.su/embed/movie/${id}`,
      tv: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}`,
    },
    {
      id: "vidsrcme",
      label: "VidSrc.me",
      movie: (id) => `https://vidsrc.me/embed/movie?tmdb=${id}`,
      tv: (id, s, e) =>
        `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
    },
    {
      id: "multiembed",
      label: "MultiEmbed",
      movie: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
      tv: (id, s, e) =>
        `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
    },
  ];

  let _currentSourceIdx = 0;

  function loadPlayer(startOffsetSec) {
    const it = currentItem;
    const src = PLAYER_SOURCES[_currentSourceIdx];
    // Some embeds accept a start/t param for seek-on-load
    const t =
      startOffsetSec && startOffsetSec > 3 ? Math.floor(startOffsetSec) : 0;
    function addT(url) {
      if (!t) return url;
      const sep = url.includes("?") ? "&" : "?";
      return url + sep + "t=" + t + "&start=" + t;
    }
    const url =
      it.type === "movie"
        ? addT(src.movie(it.tmdbId))
        : addT(src.tv(it.tmdbId, currentSeason, currentEpisode));
    document.getElementById("playerFrame").src = url;
    // Update source button labels
    document.querySelectorAll(".src-btn").forEach((btn, i) => {
      btn.classList.toggle("active", i === _currentSourceIdx);
      if (PLAYER_SOURCES[i]) btn.textContent = PLAYER_SOURCES[i].label;
    });
  }

  function switchSource(idx) {
    _currentSourceIdx = idx;
    loadPlayer();
  }

  function openFullPage() {
    const it = currentItem;
    if (!it) return;

    // Serialise sources so the popup can rebuild them
    const sourcesJson = JSON.stringify(
      PLAYER_SOURCES.map((s) => ({
        id: s.id,
        label: s.label,
        movieTpl: s.movie("__ID__"),
        tvTpl: s.tv("__ID__", "__S__", "__E__"),
      })),
    );

    const isTv = it.type === "tv";
    const tmdbId = it.tmdbId;
    const season = currentSeason || 1;
    const ep = currentEpisode || 1;
    const srcIdx = _currentSourceIdx || 0;
    const titleSafe = (it.title || "")
      .replace(/</g, "&lt;")
      .replace(/'/g, "\\'");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no"/>
<title>${titleSafe} — StreamVault</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  :root{--acc:#e8622a;--bg:#0a0a0e;--bar:#111118;--muted:#888;--white:#f0f0f5}
  html,body{width:100%;height:100%;background:var(--bg);overflow:hidden;font-family:system-ui,sans-serif;color:var(--white)}

  /* ── layout ── */
  #wrap{display:flex;flex-direction:column;width:100vw;height:100vh}
  #player-area{flex:1;position:relative;background:#000;overflow:hidden}
  iframe{width:100%;height:100%;border:none;display:block}

  /* ── top bar ── */
  #top-bar{
    display:flex;align-items:center;justify-content:space-between;
    padding:8px 14px;background:var(--bar);gap:10px;flex-shrink:0;
    border-bottom:1px solid rgba(255,255,255,.07);
    transition:opacity .3s;
  }
  #top-bar.hidden{opacity:0;pointer-events:none}
  #bar-title{font-size:13px;font-weight:700;letter-spacing:-.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0}
  .bar-btn{
    font-size:11px;padding:5px 11px;background:rgba(255,255,255,.07);
    border:1px solid rgba(255,255,255,.13);border-radius:6px;
    color:var(--muted);cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:5px;
    transition:background .15s,color .15s;
  }
  .bar-btn:hover{background:rgba(255,255,255,.16);color:var(--white)}

  /* ── bottom bar ── */
  #bot-bar{
    display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;
    padding:7px 14px;gap:8px;background:var(--bar);
    border-top:1px solid rgba(255,255,255,.07);flex-shrink:0;
    transition:opacity .3s;
  }
  #bot-bar.hidden{opacity:0;pointer-events:none}

  /* server buttons */
  .srv-btn{
    font-size:11px;padding:4px 10px;background:rgba(255,255,255,.07);
    border:1px solid rgba(255,255,255,.12);border-radius:5px;
    color:var(--muted);cursor:pointer;transition:background .15s,color .15s,border-color .15s;
    white-space:nowrap;
  }
  .srv-btn:hover{background:rgba(255,255,255,.14);color:var(--white)}
  .srv-btn.active{background:rgba(232,98,42,.18);border-color:var(--acc);color:var(--acc)}

  /* ep nav */
  #ep-nav{display:flex;align-items:center;gap:6px}
  .ep-btn{
    font-size:12px;padding:5px 12px;background:rgba(255,255,255,.08);
    border:1px solid rgba(255,255,255,.13);border-radius:6px;
    color:var(--white);cursor:pointer;transition:background .15s;white-space:nowrap;
  }
  .ep-btn:hover{background:rgba(255,255,255,.18)}
  #ep-label{
    font-size:12px;font-weight:700;padding:4px 12px;
    background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
    border-radius:6px;white-space:nowrap;letter-spacing:.02em;
  }

  /* fullscreen btn glow */
  #fs-btn{color:var(--acc);border-color:rgba(232,98,42,.4)}
  #fs-btn:hover{background:rgba(232,98,42,.18)}

  /* hide-UI toggle */
  #hide-ui-btn{margin-left:4px}

  /* ── loading spinner overlay ── */
  #loader{
    position:absolute;inset:0;background:#000;
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;
    z-index:10;pointer-events:none;
    transition:opacity .4s;
  }
  #loader.gone{opacity:0}
  .spin{width:40px;height:40px;border:3px solid rgba(232,98,42,.25);border-top-color:var(--acc);border-radius:50%;animation:spin .85s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  #loader-txt{font-size:13px;color:rgba(255,255,255,.5);letter-spacing:.03em}
<\/style>
<\/head>
<body>
<div id="wrap">

  <!-- TOP BAR -->
  <div id="top-bar">
    <div id="bar-title">Loading…<\/div>
    <div style="display:flex;gap:6px;flex-shrink:0">
      <button class="bar-btn" id="fs-btn" onclick="goFS()" title="Enter fullscreen">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/><\/svg>
        Fullscreen
      </button>
      <button class="bar-btn" id="hide-ui-btn" onclick="toggleUI()" title="Hide controls">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/><\/svg>
        Hide UI
      </button>
      <button class="bar-btn" onclick="window.close()" title="Close">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/><\/svg>
        Close
      </button>
    </div>
  </div>

  <!-- PLAYER -->
  <div id="player-area">
    <div id="loader">
      <div class="spin"><\/div>
      <div id="loader-txt">Loading content…<\/div>
    </div>
    <iframe id="player" src="" allowfullscreen
      allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
      referrerpolicy="no-referrer"
      onload="iframeLoaded()"><\/iframe>
  <\/div>

  <!-- BOTTOM BAR -->
  <div id="bot-bar">
    <!-- Server switcher -->
    <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">
      <span style="font-size:11px;color:var(--muted);font-weight:600;white-space:nowrap">Server:<\/span>
      <div id="srv-btns"><\/div>
    <\/div>
    <!-- Episode nav (TV only) -->
    <div id="ep-nav" style="display:none">
      <button class="ep-btn" onclick="changeEp(-1)">◀ Prev Ep<\/button>
      <div id="ep-label">S1 E1<\/div>
      <button class="ep-btn" onclick="changeEp(1)">Next Ep ▶<\/button>
    <\/div>
  <\/div>

<\/div>

<script>
(function(){
  const SOURCES = ${sourcesJson};
  const IS_TV   = ${isTv ? "true" : "false"};
  const TMDB_ID = '${tmdbId}';
  const TITLE   = '${titleSafe}';

  let season  = ${season};
  let ep      = ${ep};
  let srcIdx  = ${srcIdx};
  let uiVisible = true;

  function buildUrl(si, s, e) {
    const src = SOURCES[si];
    if (!IS_TV) {
      return src.movieTpl.replace('__ID__', TMDB_ID);
    }
    return src.tvTpl
      .replace('__ID__', TMDB_ID)
      .replace('__S__', s)
      .replace('__E__', e);
  }

  function getTitle(s, e) {
    if (!IS_TV) return TITLE + ' — StreamVault';
    return TITLE + ' · S' + String(s).padStart(2,'0') + ' E' + String(e).padStart(2,'0') + ' — StreamVault';
  }

  function getBarTitle(s, e) {
    if (!IS_TV) return TITLE;
    return TITLE + ' · S' + s + ' E' + e;
  }

  function load(si, s, e) {
    srcIdx = si; season = s; ep = e;
    const url = buildUrl(si, s, e);
    document.getElementById('loader').classList.remove('gone');
    document.getElementById('player').src = url;
    document.title = getTitle(s, e);
    document.getElementById('bar-title').textContent = getBarTitle(s, e);
    if (IS_TV) document.getElementById('ep-label').textContent = 'S'+s+' E'+e;
    // Update server buttons
    document.querySelectorAll('.srv-btn').forEach((b, i) => b.classList.toggle('active', i === si));
  }

  window.iframeLoaded = function() {
    setTimeout(() => document.getElementById('loader').classList.add('gone'), 600);
  };

  window.changeEp = function(dir) {
    load(srcIdx, season, Math.max(1, ep + dir));
  };

  window.goFS = function() {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  };

  window.toggleUI = function() {
    uiVisible = !uiVisible;
    document.getElementById('top-bar').classList.toggle('hidden', !uiVisible);
    document.getElementById('bot-bar').classList.toggle('hidden', !uiVisible);
    document.getElementById('hide-ui-btn').querySelector('svg').style.opacity = uiVisible ? '1' : '0.4';
  };

  // Build server buttons
  const srvWrap = document.getElementById('srv-btns');
  SOURCES.forEach((src, i) => {
    const b = document.createElement('button');
    b.className = 'srv-btn' + (i === srcIdx ? ' active' : '');
    b.textContent = src.label;
    b.onclick = () => load(i, season, ep);
    srvWrap.appendChild(b);
  });

  // Show ep nav for TV
  if (IS_TV) document.getElementById('ep-nav').style.display = 'flex';

  // Auto-enter fullscreen on load
  document.addEventListener('click', function tryFS() {
    document.removeEventListener('click', tryFS);
    goFS();
  }, {once: true});

  // Initial load
  load(srcIdx, season, ep);
})();
<\/script>
<\/body>
<\/html>`;

    const blob = new Blob([html], { type: "text/html" });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank", "noopener");
  }

  /* ===== CLOSE FUNCTIONS ===== */
  function closeDetail() {
    document.getElementById("detailModal").classList.remove("open");
    document.body.style.overflow = "";
    // Clean up the URL bar when closing the modal
    window.history.replaceState(null, "", window.location.pathname);
  }

  function closePlayer() {
    document.getElementById("playerFrame").src = "";
    document.getElementById("playerModal").classList.remove("open");
    if (currentItem) renderDetail(currentItem);
    document.getElementById("detailModal").classList.add("open");
  }

  function closeAll() {
    document.getElementById("playerFrame").src = "";
    document.getElementById("playerModal").classList.remove("open");
    document.getElementById("detailModal").classList.remove("open");
    document.body.style.overflow = "";
    // Unsubscribe comments listener
    if (typeof _commentsUnsubscribe === "function") {
      _commentsUnsubscribe();
      _commentsUnsubscribe = null;
    }
    // Clean up the URL bar when closing everything
    window.history.replaceState(null, "", window.location.pathname);
  }

  function overlayClick(e) {
    if (e.target === document.getElementById("playerModal")) closePlayer();
  }
  function detailOverlayClick(e) {
    if (e.target === document.getElementById("detailModal")) closeDetail();
  }

  let _st;
  function _positionSearchDropdown() {
    // no-op: #searchResults is now inside .search-wrap, positioned via CSS
  }

  const SEARCH_API_KEY = "8265bd1679663a7ea12ac168da84d2e8";
  const GENRE_ID_MAP = {
    28: "Action",
    12: "Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    14: "Fantasy",
    36: "History",
    27: "Horror",
    10402: "Music",
    9648: "Mystery",
    10749: "Romance",
    878: "Sci-Fi",
    53: "Thriller",
    10752: "War",
    37: "Western",
    10759: "Action",
    10762: "Kids",
    10765: "Sci-Fi",
    10766: "Soap",
    10768: "War",
  };

  function _renderSearchHTML(res, q) {
    if (!res.length)
      return `<div style="padding:14px 16px;color:var(--muted);font-size:14px;text-align:center;">No results for "<strong style="color:var(--text)">${q}</strong>"</div>`;
    return res
      .map(
        (r) => `
    <div class="sr-item" onclick='openFromSearch(${JSON.stringify(r).replace(/'/g, "&#39;")})'>
      <img class="sr-thumb" src="${IMG + r.poster}" alt="${r.title}"
        onerror="this.onerror=null;this.style.opacity=0.2"/>
      <div style="flex:1;min-width:0">
        <div class="sr-title">${r.title}</div>
        <div class="sr-sub">${r.year} · ${r.type === "tv" ? "Series" : "Movie"} · ★${r.rating}</div>
      </div>
    </div>`,
      )
      .join("");
  }

  function _showSearchHTML(html) {
    const box = document.getElementById("searchResults");
    const mobileBox = document.getElementById("mobileSearchResults");
    const stickyBox = document.getElementById("mobileNavResults");
    if (box) {
      box.innerHTML = html;
      box.style.display = "block";
    }
    if (mobileBox) {
      mobileBox.innerHTML = html;
      mobileBox.style.display = "block";
    }
    if (stickyBox && window.innerWidth <= 768) {
      stickyBox.innerHTML = html;
      stickyBox.style.display = "block";
    } else if (stickyBox) {
      stickyBox.style.display = "none";
    }
  }

  async function _tmdbSearch(q) {
    try {
      const url = `https://api.themoviedb.org/3/search/multi?api_key=${SEARCH_API_KEY}&query=${encodeURIComponent(q)}&include_adult=false`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.results || [])
        .filter(
          (i) =>
            (i.media_type === "movie" || i.media_type === "tv") &&
            i.poster_path &&
            !i.adult,
        )
        .slice(0, 12)
        .map((i) => ({
          tmdbId: String(i.id),
          type: i.media_type,
          title: i.media_type === "movie" ? i.title : i.name,
          year:
            parseInt(
              (i.media_type === "movie"
                ? i.release_date
                : i.first_air_date || ""
              ).slice(0, 4),
            ) || 0,
          rating: Math.round((i.vote_average || 0) * 10) / 10,
          genres: (i.genre_ids || [])
            .map((id) => GENRE_ID_MAP[id])
            .filter(Boolean),
          poster: i.poster_path,
          desc: i.overview || "",
        }));
    } catch (e) {
      return [];
    }
  }

  function handleSearch(q) {
    clearTimeout(_st);
    const box = document.getElementById("searchResults");
    const mobileBox = document.getElementById("mobileSearchResults");
    const clearBtn = document.getElementById("searchClearBtn");
    const mobileClearBtn = document.getElementById("mobileClearBtn");
    const hintEl = document.getElementById("searchShortcutHint");
    if (clearBtn) clearBtn.style.display = q.trim() ? "block" : "none";
    if (mobileClearBtn)
      mobileClearBtn.style.display = q.trim() ? "block" : "none";
    if (hintEl) hintEl.style.display = q.trim() ? "none" : "";
    if (!q.trim()) {
      if (box) box.style.display = "none";
      if (mobileBox) mobileBox.style.display = "none";
      return;
    }
    _st = setTimeout(async () => {
      const ql = q.toLowerCase();

      // 1. Search local catalog first (instant)
      const localFiltered = allContent.filter(
        (i) =>
          i.title.toLowerCase().includes(ql) ||
          (i.year && String(i.year).includes(ql)) ||
          (i.genres && i.genres.some((g) => g.toLowerCase().includes(ql))),
      );
      const localRes = getUnique(localFiltered).slice(0, 12);

      // 2. Show local results immediately while TMDB search runs
      _showSearchHTML(_renderSearchHTML(localRes, q));

      // 3. Always fetch from TMDB search API — covers ANY title, not just popular ones
      const tmdbRes = await _tmdbSearch(q);
      if (tmdbRes.length === 0) return; // local results already shown, keep them

      // 4. Merge: TMDB results first, then any local-only extras not in TMDB response
      const tmdbIds = new Set(tmdbRes.map((r) => r.type + "_" + r.tmdbId));
      const localExtras = localRes.filter(
        (r) => !tmdbIds.has(r.type + "_" + r.tmdbId),
      );
      const merged = [...tmdbRes, ...localExtras].slice(0, 12);

      _showSearchHTML(_renderSearchHTML(merged, q));
    }, 250);
  }

  function clearSearch() {
    const input = document.getElementById("searchInput");
    const mobileInput = document.getElementById("mobileSearchInput");
    const box = document.getElementById("searchResults");
    const mobileBox = document.getElementById("mobileSearchResults");
    const clearBtn = document.getElementById("searchClearBtn");
    const mobileClearBtn = document.getElementById("mobileClearBtn");
    const hintEl = document.getElementById("searchShortcutHint");
    if (input) input.value = "";
    if (mobileInput) mobileInput.value = "";
    if (box) box.style.display = "none";
    if (mobileBox) mobileBox.style.display = "none";
    var stickyBox2 = document.getElementById("mobileNavResults");
    if (stickyBox2) stickyBox2.style.display = "none";
    if (clearBtn) clearBtn.style.display = "none";
    if (mobileClearBtn) mobileClearBtn.style.display = "none";
    if (hintEl) hintEl.style.display = "";
    // Focus whichever input is visible
    const mobileDrawer = document.getElementById("mobileDrawer");
    if (mobileDrawer && mobileDrawer.classList.contains("open") && mobileInput)
      mobileInput.focus();
    else if (input) input.focus();
  }

  function openFromSearch(item) {
    var box = document.getElementById("searchResults");
    var mobileBox = document.getElementById("mobileSearchResults");
    var stickyBox = document.getElementById("mobileNavResults");
    var input = document.getElementById("searchInput");
    var mobileInput = document.getElementById("mobileNavSearchInput");
    var drawerInput = document.getElementById("mobileSearchInput");
    var clearBtn = document.getElementById("searchClearBtn");
    var navClearBtn = document.getElementById("mobileNavClearBtn");
    var mobileClearBtn = document.getElementById("mobileClearBtn");
    var hintEl = document.getElementById("searchShortcutHint");
    if (box) box.style.display = "none";
    if (mobileBox) mobileBox.style.display = "none";
    if (stickyBox) stickyBox.style.display = "none";
    if (input) input.value = "";
    if (mobileInput) mobileInput.value = "";
    if (drawerInput) drawerInput.value = "";
    if (clearBtn) clearBtn.style.display = "none";
    if (navClearBtn) navClearBtn.style.display = "none";
    if (mobileClearBtn) mobileClearBtn.style.display = "none";
    if (hintEl) hintEl.style.display = "";
    openContent(item);
  }

  // Close search results when clicking outside the search area
  document.addEventListener("mousedown", function (e) {
    var wrap = document.querySelector(".search-wrap");
    var mobileWrap = document.querySelector(".mobile-search-wrap");
    var stickyWrap = document.getElementById("mobileStickySearch");
    var box = document.getElementById("searchResults");
    var mobileBox = document.getElementById("mobileSearchResults");
    var stickyBox = document.getElementById("mobileNavResults");
    // Only hide if click is outside the search area AND outside the results box itself
    var inDesktop =
      (wrap && wrap.contains(e.target)) || (box && box.contains(e.target));
    var inMobile =
      (mobileWrap && mobileWrap.contains(e.target)) ||
      (mobileBox && mobileBox.contains(e.target));
    var inSticky =
      (stickyWrap && stickyWrap.contains(e.target)) ||
      (stickyBox && stickyBox.contains(e.target));
    if (!inDesktop && box) box.style.display = "none";
    if (!inMobile && mobileBox) mobileBox.style.display = "none";
    if (!inSticky && stickyBox) stickyBox.style.display = "none";
  });

  /* =========================================
   ===== FEATURE 1: MOOD FILTER =====
========================================== */
  const MOOD_GENRES = {
    all: null,
    "feel-good": ["Comedy", "Animation", "Family", "Romance"],
    dark: ["Horror", "Crime", "Thriller", "Drama"],
    thrilling: ["Action", "Thriller", "Sci-Fi", "Adventure"],
    romantic: ["Romance", "Drama"],
    funny: ["Comedy", "Animation"],
    epic: ["Action", "Adventure", "Fantasy", "Sci-Fi"],
  };
  let currentMood = "all";

  function setMood(mood, btn) {
    currentMood = mood;
    document
      .querySelectorAll(".mood-chip")
      .forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    filterGenre(currentGenre, null);
  }

  // filterGenre (with mood support)
  function filterGenre(genre, chip) {
    currentGenre = genre;
    if (chip) {
      document
        .querySelectorAll(".genre-chip")
        .forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
    }
    const yf = document.getElementById("yearFilter").value;
    let base = allContent.filter((i) => {
      if (yf === "2020") return parseInt(i.year) >= 2020;
      if (yf === "2010")
        return parseInt(i.year) >= 2010 && parseInt(i.year) < 2020;
      if (yf === "2000")
        return parseInt(i.year) >= 2000 && parseInt(i.year) < 2010;
      if (yf === "old") return parseInt(i.year) < 2000;
      return true;
    });

    // Apply mood filter
    const moodGenres = MOOD_GENRES[currentMood];
    if (moodGenres)
      base = base.filter(
        (i) => i.genres && i.genres.some((g) => moodGenres.includes(g)),
      );

    // Apply Under 90 min filter (movies only — tv shows have no runtime in same way)
    if (quick90Active)
      base = base.filter(
        (i) => i.type === "tv" || (i.runtime && parseInt(i.runtime) < 90),
      );

    let fm =
      genre === "All"
        ? base.filter((i) => i.type === "movie")
        : base.filter((i) => i.type === "movie" && i.genres.includes(genre));
    let fs =
      genre === "All"
        ? base.filter((i) => i.type === "tv")
        : base.filter((i) => i.type === "tv" && i.genres.includes(genre));
    let fa =
      genre === "All" ? base : base.filter((i) => i.genres.includes(genre));

    fm = getUnique(fm);
    fs = getUnique(fs);
    fa = getUnique(fa);

    // Shuffle cards on each render when using default sort (changes every refresh)
    const trendingPool = currentSortMode === "default" ? shuffleArray(fa) : fa;
    const seriesPool = currentSortMode === "default" ? shuffleArray(fs) : fs;
    const moviesPool = currentSortMode === "default" ? shuffleArray(fm) : fm;

    renderGrid("grid-trending", trendingPool.slice(0, 12));
    renderGrid(
      "grid-top",
      [...fa].sort((a, b) => b.rating - a.rating).slice(0, 12),
    );
    renderGrid("grid-series", seriesPool.slice(0, 12));
    renderGrid("grid-movies", moviesPool.slice(0, 12));

    // FEATURE 8: Render recommendations if watchlist has items
    renderRecommendations();
  }

  /* =========================================
   ===== FEATURE 2: PERSONAL STAR RATING =====
========================================== */
  let userRatings = JSON.parse(FirebaseDB.getItem("sv_ratings") || "{}");

  function getUserRating(item) {
    return userRatings[item.type + "_" + item.tmdbId] || 0;
  }

  function setUserRating(val) {
    if (!currentItem) return;
    const key = currentItem.type + "_" + currentItem.tmdbId;
    if (userRatings[key] === val) {
      delete userRatings[key]; // toggle off
      showToast("⭐ Rating removed");
    } else {
      userRatings[key] = val;
      showToast(`⭐ Rated ${val}/5 stars!`);
      addNotif(
        `⭐ You rated <strong>${currentItem.title}</strong> ${val}/5 stars`,
      );
    }
    FirebaseDB.setItem("sv_ratings", JSON.stringify(userRatings));
    initUserRatingUI(currentItem);
  }

  function initUserRatingUI(item) {
    const picker = document.getElementById("starPicker");
    const label = document.getElementById("userRatingLabel");
    if (!picker) return;
    const val = getUserRating(item);
    picker.querySelectorAll(".star-pick").forEach((s) => {
      const n = parseInt(s.dataset.val);
      s.classList.toggle("lit", n <= val);
    });
    label.textContent = val ? `(${val}/5)` : "(not rated)";
  }

  /* =========================================
   ===== FEATURE 3: STATS DASHBOARD =====
========================================== */

  /* =========================================
   ===== FEATURE 4: NOTIFICATION BELL =====
========================================== */
  let notifications = JSON.parse(FirebaseDB.getItem("sv_notifs") || "[]");

  function addNotif(html) {
    const ts = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    notifications.unshift({ html, ts });
    if (notifications.length > 30) notifications.pop();
    FirebaseDB.setItem("sv_notifs", JSON.stringify(notifications));
    renderNotifPanel();
    // Flash badge
    const badge = document.getElementById("notifBadge");
    badge.style.display = "flex";
    badge.textContent = Math.min(notifications.length, 9);
  }

  function renderNotifPanel() {
    const list = document.getElementById("notifList");
    if (!notifications.length) {
      list.innerHTML = '<div class="notif-empty">No activity yet.</div>';
      return;
    }
    list.innerHTML = notifications
      .slice(0, 15)
      .map(
        (n) => `
    <div class="notif-item">${n.html}<span class="notif-time">${n.ts}</span></div>
  `,
      )
      .join("");
  }

  function clearNotifs() {
    notifications = [];
    FirebaseDB.removeItem("sv_notifs");
    document.getElementById("notifBadge").style.display = "none";
    renderNotifPanel();
  }

  function toggleNotifPanel() {
    const panel = document.getElementById("notifPanel");
    panel.classList.toggle("open");
    // Hide badge on open
    if (panel.classList.contains("open")) {
      document.getElementById("notifBadge").style.display = "none";
      renderNotifPanel();
    }
  }
  document.addEventListener("click", (e) => {
    const panel = document.getElementById("notifPanel");
    if (
      panel &&
      !e.target.closest("#notifPanel") &&
      !e.target.closest("#notifBtn")
    ) {
      panel.classList.remove("open");
    }
  });

  /* =========================================
   ===== FEATURE 6: MULTI-TAB WATCHLIST =====
========================================== */
  let wlActiveTab = "want";
  // Extended watchlist: { want:[], watching:[], done:[] }
  // ✅ FIX: Re-read from FirebaseDB here — _svAppReady only runs after
  // hydrate() completes, so the cache is now populated with real data.
  function _loadMultiWatchlist() {
    return JSON.parse(
      FirebaseDB.getItem("sv_mwl") || '{"want":[],"watching":[],"done":[]}',
    );
  }
  let multiWatchlist = _loadMultiWatchlist();
  // Also sync the legacy watchlist array now that we have real data
  watchlist = [
    ...multiWatchlist.want,
    ...multiWatchlist.watching,
    ...multiWatchlist.done,
  ];

  function saveMultiWatchlist() {
    FirebaseDB.setItem("sv_mwl", JSON.stringify(multiWatchlist));
    // Sync legacy watchlist for compatibility
    watchlist = [
      ...multiWatchlist.want,
      ...multiWatchlist.watching,
      ...multiWatchlist.done,
    ];
    saveWatchlist();
    renderMultiWlTab(wlActiveTab);
  }

  function switchWlTab(tab, btn) {
    wlActiveTab = tab;
    document
      .querySelectorAll(".wl-tab")
      .forEach((t) => t.classList.remove("active"));
    btn.classList.add("active");
    {
      renderMultiWlTab(tab);
    }
  }

  function renderMultiWlTab(tab) {
    const items = multiWatchlist[tab] || [];
    const list = document.getElementById("wl-list");
    if (!items.length) {
      const labels = {
        want: "Save titles with ♡",
        watching: "Move here what you're currently watching",
        done: "Mark titles you've finished",
      };
      list.innerHTML = `<div class="wl-empty">[ EMPTY ]<br><br>${labels[tab] || ""}</div>`;
      return;
    }
    list.innerHTML = items
      .map(
        (item, i) => `
    <div class="wl-item" onclick="openContent(${JSON.stringify(item).replace(/"/g, "&quot;")})">
      <img class="wl-thumb" src="${IMG + item.poster}" alt="${item.title}" onerror="this.style.opacity=0.2"/>
      <div class="wl-info">
        <div class="wl-name">${item.title}</div>
        <div class="wl-sub">${item.year} · ★${item.rating}</div>
        <div style="display:flex;gap:4px;margin-top:4px">
          ${tab !== "want" ? `<button class="sf-chip" onclick="moveToWlTab('want',${i},event)" title="→ Want">Want</button>` : ""}
          ${tab !== "watching" ? `<button class="sf-chip" onclick="moveToWlTab('watching',${i},event)" title="→ Watching">Watching</button>` : ""}
          ${tab !== "done" ? `<button class="sf-chip" onclick="moveToWlTab('done',${i},event)" title="→ Done">Done</button>` : ""}
        </div>
      </div>
      <button class="wl-remove" onclick="removeFromMultiWl('${tab}',${i},event)" title="Remove">✕</button>
    </div>`,
      )
      .join("");
  }

  function addToMultiWl(item, tab = "want") {
    const exists = multiWatchlist[tab].some(
      (w) => w.tmdbId === item.tmdbId && w.type === item.type,
    );
    if (!exists) {
      // Remove from other tabs first
      ["want", "watching", "done"].forEach((t) => {
        multiWatchlist[t] = multiWatchlist[t].filter(
          (w) => !(w.tmdbId === item.tmdbId && w.type === item.type),
        );
      });
      multiWatchlist[tab].push(item);
      saveMultiWatchlist();
      showToast(`✔ Added to "${tab}" list`);
      addNotif(`📋 Added <strong>${item.title}</strong> to <em>${tab}</em>`);
    }
  }

  function removeFromMultiWl(tab, idx, e) {
    e && e.stopPropagation();
    multiWatchlist[tab].splice(idx, 1);
    saveMultiWatchlist();
    showToast("✕ Removed");
  }

  function moveToWlTab(destTab, idx, e) {
    e && e.stopPropagation();
    const item = multiWatchlist[wlActiveTab][idx];
    if (!item) return;
    multiWatchlist[wlActiveTab].splice(idx, 1);
    multiWatchlist[destTab].push(item);
    saveMultiWatchlist();
    showToast(`✔ Moved to "${destTab}"`);
  }

  // Override updateWatchlistUI to use multi-tab
  function updateWatchlistUI() {
    document.getElementById("wlCount").textContent =
      multiWatchlist.want.length +
      multiWatchlist.watching.length +
      multiWatchlist.done.length;
    renderMultiWlTab(wlActiveTab);
  }

  // Override toggleWishlist to use multi-tab
  function toggleWishlist(item, btn, e) {
    e && e.stopPropagation();
    const allTabs = [
      ...multiWatchlist.want,
      ...multiWatchlist.watching,
      ...multiWatchlist.done,
    ];
    const inAny = allTabs.some(
      (w) => w.tmdbId === item.tmdbId && w.type === item.type,
    );
    if (inAny) {
      ["want", "watching", "done"].forEach((t) => {
        multiWatchlist[t] = multiWatchlist[t].filter(
          (w) => !(w.tmdbId === item.tmdbId && w.type === item.type),
        );
      });
      btn && btn.classList.remove("active");
      showToast("✕ Removed from list");
      saveMultiWatchlist();
    } else {
      addToMultiWl(item, "want");
      btn && btn.classList.add("active");
    }
  }

  function isInWatchlist(item) {
    return [
      ...multiWatchlist.want,
      ...multiWatchlist.watching,
      ...multiWatchlist.done,
    ].some((w) => w.tmdbId === item.tmdbId && w.type === item.type);
  }

  /* =========================================
   ===== FEATURE 8: RECOMMENDATION ENGINE =====
========================================== */
  function renderRecommendations() {
    const allWlItems = [
      ...multiWatchlist.want,
      ...multiWatchlist.watching,
      ...multiWatchlist.done,
    ];
    const secReco = document.getElementById("sec-reco");
    if (!allWlItems.length) {
      secReco.style.display = "none";
      return;
    }

    // Count genres from watchlist
    const gCount = {};
    allWlItems.forEach((item) => {
      if (item.genres)
        item.genres.forEach((g) => (gCount[g] = (gCount[g] || 0) + 1));
    });
    const topGenres = Object.entries(gCount)
      .sort((a, b) => b[1] - a[1])
      .map(([g]) => g)
      .slice(0, 3);
    const wlIds = new Set(allWlItems.map((w) => w.type + "_" + w.tmdbId));

    const recos = getUnique(
      allContent.filter(
        (i) =>
          !wlIds.has(i.type + "_" + i.tmdbId) &&
          i.genres &&
          i.genres.some((g) => topGenres.includes(g)),
      ),
    )
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 8);

    if (!recos.length) {
      secReco.style.display = "none";
      return;
    }
    secReco.style.display = "block";
    renderGrid("grid-reco", recos);
  }

  /* =========================================
   ===== FEATURE 9: FLOATING MINI PLAYER =====
========================================== */
  let miniPlayerItem = null;

  function showMiniPlayer(item, label) {
    miniPlayerItem = item;
    const mp = document.getElementById("miniPlayer");
    document.getElementById("miniPlayerTitle").textContent = item.title;
    document.getElementById("miniPlayerThumb").src = IMG + item.poster;
    document.getElementById("miniPlayerInfo").textContent = label;
    mp.classList.add("visible");
  }

  function closeMiniPlayer() {
    document.getElementById("miniPlayer").classList.remove("visible");
    miniPlayerItem = null;
  }

  function expandMiniPlayer() {
    if (!miniPlayerItem) return;
    closeMiniPlayer();
    openContent(miniPlayerItem);
  }

  /* =========================================
   ===== FEATURE 10: ACHIEVEMENTS SYSTEM =====
========================================== */

  // Track genre visits for Explorer achievement
  window._genresVisited = JSON.parse(
    FirebaseDB.getItem("sv_genres_visited") || "[]",
  );

  let seeAllItems = [];
  let seeAllLabel = "";

  function openSeeAll(section) {
    const genre = currentGenre;
    const yf = document.getElementById("yearFilter").value;
    let yearFiltered = allContent.filter((i) => {
      if (yf === "2020") return parseInt(i.year) >= 2020;
      if (yf === "2010")
        return parseInt(i.year) >= 2010 && parseInt(i.year) < 2020;
      if (yf === "2000")
        return parseInt(i.year) >= 2000 && parseInt(i.year) < 2010;
      if (yf === "old") return parseInt(i.year) < 2000;
      return true;
    });

    let fm =
      genre === "All"
        ? yearFiltered.filter((i) => i.type === "movie")
        : yearFiltered.filter(
            (i) => i.type === "movie" && i.genres.includes(genre),
          );
    let fs =
      genre === "All"
        ? yearFiltered.filter((i) => i.type === "tv")
        : yearFiltered.filter(
            (i) => i.type === "tv" && i.genres.includes(genre),
          );
    let fa =
      genre === "All"
        ? yearFiltered
        : yearFiltered.filter((i) => i.genres.includes(genre));

    fm = getUnique(fm);
    fs = getUnique(fs);
    fa = getUnique(fa);

    if (section === "trending") {
      seeAllItems = applySortToArray(fa);
      seeAllLabel = "🔥 All Trending";
    } else if (section === "top") {
      seeAllItems = [...fa].sort((a, b) => b.rating - a.rating);
      seeAllLabel = "⭐ All Top Rated";
    } else if (section === "series") {
      seeAllItems = applySortToArray(fs);
      seeAllLabel = "🎬 All Series";
    } else if (section === "movies") {
      seeAllItems = applySortToArray(fm);
      seeAllLabel = "🎥 All Movies";
    }

    document.getElementById("seeAllTitle").textContent = seeAllLabel;
    document.getElementById("seeAllSearch").value = "";
    renderSeeAll(seeAllItems);
    document.getElementById("seeAllModal").classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function renderSeeAll(items) {
    const g = document.getElementById("grid-seeall");
    g.innerHTML = "";
    items.forEach((i) => g.appendChild(buildCard(i)));
    document.getElementById("seeAllCount").textContent =
      items.length + " titles";
  }

  function filterSeeAll(q) {
    if (!q.trim()) {
      renderSeeAll(seeAllItems);
      return;
    }
    const filtered = seeAllItems.filter((i) =>
      i.title.toLowerCase().includes(q.toLowerCase()),
    );
    renderSeeAll(filtered);
  }

  function closeSeeAll() {
    document.getElementById("seeAllModal").classList.remove("open");
    document.body.style.overflow = "";
  }

  function quickFilter(type) {
    const items = getUnique(type === "movie" ? catalogMovies : catalogSeries);
    const shuffled =
      currentSortMode === "default" ? shuffleArray(items) : items;
    renderGrid("grid-trending", shuffled.slice(0, 8));
    renderGrid(
      "grid-top",
      [...items].sort((a, b) => b.rating - a.rating).slice(0, 8),
    );
    renderGrid(
      "grid-series",
      type === "tv" ? shuffleArray(getUnique(catalogSeries)).slice(0, 8) : [],
    );
    renderGrid(
      "grid-movies",
      type === "movie"
        ? shuffleArray(getUnique(catalogMovies)).slice(0, 8)
        : [],
    );
  }

  function setActive(el) {
    document
      .querySelectorAll(".nav-links a")
      .forEach((a) => a.classList.remove("active"));
    el.classList.add("active");
  }

  window.addEventListener("message", (e) => {
    if (typeof e.data !== "string") return;
    try {
      const p = JSON.parse(e.data);
      if (
        p.type === "PLAYER_EVENT" &&
        currentItem &&
        p.event === "timeupdate"
      ) {
        const k =
          currentItem.type === "tv"
            ? `vk_tv_${currentItem.tmdbId}_${currentSeason}_${currentEpisode}`
            : `vk_movie_${currentItem.tmdbId}`;
        FirebaseDB.setItem(k, p.currentTime || 0);
      }
    } catch {}
  });

  function toggleTheme() {
    const isLight = document.body.classList.toggle("light-mode");
    const btn = document.getElementById("themeToggle");
    const sunSvg =
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
    const moonSvg =
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    btn.innerHTML = isLight ? sunSvg + " Light" : moonSvg + " Dark";
    FirebaseDB.setItem("sv_theme", isLight ? "light" : "dark");
  }

  function initTheme() {
    const saved = FirebaseDB.getItem("sv_theme");
    if (saved === "light") {
      document.body.classList.add("light-mode");
      const btn = document.getElementById("themeToggle");
      const sunSvg =
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
      if (btn) btn.innerHTML = sunSvg + " Light";
    }
  }

  // init
  function initPoints() {
    // points system initializer (stub)
  }

  // NOTE: Initialisation is now handled by _svAppReady() which is called
  // after FirebaseDB.hydrate() completes. The DOMContentLoaded equivalent
  // runs inside that wrapper at the bottom of this script block.
  // Additional DOM setup that doesn't depend on user data:
  document.addEventListener("DOMContentLoaded", () => {
    // Hero button
    const heroBtn = document.getElementById("heroWatchBtn");
    if (heroBtn) heroBtn.onclick = () => openContent(catalogMovies[0]);

    // Library stats
    const libStat = document.getElementById("libStat");
    if (
      libStat &&
      typeof catalogMovies !== "undefined" &&
      typeof catalogSeries !== "undefined"
    ) {
      const uniqueMovies = getUnique(catalogMovies).length;
      const uniqueSeries = getUnique(catalogSeries).length;
      libStat.innerHTML = `📚 <strong style="color:var(--white)">${uniqueMovies}</strong> Movies &nbsp;·&nbsp; <strong style="color:var(--white)">${uniqueSeries}</strong> Series`;
    }

    // Deep-link handling moved into _svAppReady (after allContent is populated)
  });

  /* =====================================================
   ===== NEW FEATURE 1: THEATER MODE (LIGHTS OUT) =====
===================================================== */
  let theaterModeOn = false;
  function toggleTheaterMode() {
    theaterModeOn = !theaterModeOn;
    document.body.classList.toggle("theater-mode", theaterModeOn);
    const btn = document.getElementById("lightsBtn");
    if (theaterModeOn) {
      btn.textContent = "💡 Lights On";
      btn.classList.add("on");
      showToast("🌑 Theater Mode — press L or Esc to exit");
    } else {
      btn.textContent = "💡 Lights Out";
      btn.classList.remove("on");
    }
  }

  /* =========================================================
   ===== NEW FEATURE 2: NEXT / PREV EPISODE BUTTONS =====
========================================================= */
  function updateEpNavBar() {
    if (!currentItem || currentItem.type !== "tv") {
      document.getElementById("epNavBar").classList.remove("visible");
      return;
    }
    const bar = document.getElementById("epNavBar");
    bar.classList.add("visible");
    document.getElementById("epCurrentLabel").textContent =
      `S${currentSeason} E${currentEpisode}`;
    // Disable prev if S1 E1
    document.getElementById("prevEpBtn").disabled =
      currentSeason === 1 && currentEpisode === 1;
    // Disable next if last season and cant know total eps — just cap at 24 as a generous limit
    document.getElementById("nextEpBtn").disabled = false;
  }

  function navigateEpisode(direction) {
    if (!currentItem || currentItem.type !== "tv") return;
    let s = currentSeason,
      e = currentEpisode;
    e += direction;
    if (e < 1) {
      if (s <= 1) return; // already at S1E1
      s--;
      e = 12; // assume previous season has episodes
    } else if (e > 24) {
      if (s >= (currentItem.seasons || 1)) return;
      s++;
      e = 1;
    }
    const epKey = `tv_${currentItem.tmdbId}_s${s}e${e}`;
    if (!checkAndUnlock(epKey)) return;
    currentSeason = s;
    currentEpisode = e;
    document.getElementById("modalTitle").textContent =
      `${currentItem.title} · S${s} E${e}`;
    loadPlayer();
    saveCW(currentItem, s, e);
    updateEpNavBar();
    addNotif(`⏭ Playing <strong>${currentItem.title}</strong> S${s}E${e}`);
  }

  /* ====================================================
   ===== NEW FEATURE 3: LIST / GRID VIEW TOGGLE =====
==================================================== */
  let currentViewMode = "grid";
  function setViewMode(mode, btn) {
    currentViewMode = mode;
    document
      .querySelectorAll(".view-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".cards-grid").forEach((g) => {
      if (mode === "list") g.classList.add("list-view");
      else g.classList.remove("list-view");
    });
  }

  /* ============================================================
   ===== NEW FEATURE 4: ANIMATED ROULETTE RANDOM PICKER =====
============================================================ */
  let roulettePickedItem = null;
  let rouletteAnimFrame = null;

  function openRandom() {
    const pool = getUnique(allContent).filter((i) => i.poster);
    if (!pool.length) return;

    const overlay = document.getElementById("roulette-overlay");
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";

    // Build strip with shuffled items × 3 for looping
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 20);
    const strip = document.getElementById("rouletteStrip");
    const looped = [...shuffled, ...shuffled, ...shuffled];
    strip.innerHTML = looped
      .map(
        (item) => `
    <div class="roulette-item">
      <img src="${IMG}${item.poster}" alt="${item.title}" onerror="this.style.opacity=0.1">
      <div class="roulette-item-title">${item.title}</div>
    </div>`,
      )
      .join("");

    document.getElementById("rouletteResult").textContent = "";
    document.getElementById("roulettePlayBtn").style.display = "none";

    // Pick a winner from the middle loop
    const winnerIdx =
      shuffled.length + Math.floor(Math.random() * shuffled.length);
    roulettePickedItem = looped[winnerIdx];

    const ITEM_H = 140;
    const centerOffset = 140; // center of 420px window
    const targetY = -(winnerIdx * ITEM_H) + centerOffset;

    // Animate spin
    let startY = 0;
    let startTime = null;
    const duration = 2800;

    function easeOut(t) {
      return 1 - Math.pow(1 - t, 4);
    }

    function animate(ts) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentY = startY + (targetY - startY) * easeOut(progress);
      strip.style.transform = `translateY(${currentY}px)`;

      if (progress < 1) {
        rouletteAnimFrame = requestAnimationFrame(animate);
      } else {
        // Done!
        document.getElementById("rouletteResult").textContent =
          `🎬 ${roulettePickedItem.title} (${roulettePickedItem.year})`;
        document.getElementById("roulettePlayBtn").style.display =
          "inline-flex";
        showToast(`🎲 Picked: ${roulettePickedItem.title}`);
      }
    }
    rouletteAnimFrame = requestAnimationFrame(animate);
  }

  function roulettePlay() {
    if (!roulettePickedItem) return;
    closeRoulette();
    openContent(roulettePickedItem);
  }

  function closeRoulette() {
    if (rouletteAnimFrame) cancelAnimationFrame(rouletteAnimFrame);
    document.getElementById("roulette-overlay").classList.remove("open");
    document.body.style.overflow = "";
  }

  /* ============================================================
   ===== NEW FEATURE 6: "NEW" BADGE — handled in buildCard above
   ===== NEW FEATURE 7: PROGRESS BARS — handled in renderCW above
   ===== NEW FEATURE 8: IMDB QUICK SEARCH =====
============================================================ */
  function openIMDb(title) {
    const query = encodeURIComponent(title + " cast trivia");
    window.open(`https://www.imdb.com/find/?q=${query}`, "_blank");
    addNotif(`🔍 Searched IMDb for <strong>${title}</strong>`);
  }

  /* also add IMDb button to dynamic detail actions to include crew links */

  /* ============================================================
   ===== MOBILE DRAWER & UI =====
============================================================ */
  function toggleMobileDrawer() {
    const drawer = document.getElementById("mobileDrawer");
    const overlay = document.getElementById("mobileDrawerOverlay");
    const btn = document.getElementById("hamburgerBtn");
    const open = drawer.classList.toggle("open");
    overlay.classList.toggle("open", open);
    btn.classList.toggle("open", open);
    document.body.style.overflow = open ? "hidden" : "";
  }

  function closeMobileDrawer() {
    document.getElementById("mobileDrawer").classList.remove("open");
    document.getElementById("mobileDrawerOverlay").classList.remove("open");
    document.getElementById("hamburgerBtn").classList.remove("open");
    document.body.style.overflow = "";
  }

  function setBottomActive(el) {
    document
      .querySelectorAll(".bottom-nav-item")
      .forEach((i) => i.classList.remove("active"));
    el.classList.add("active");
  }

  // Sync on init — called after initPoints() runs
  function syncMobilePts() {}

  // Close drawer on escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMobileDrawer();
  });

  // Mobile and desktop search inputs are synced via handleSearch() and clearSearch()
  window.addEventListener("resize", function () {
    const box = document.getElementById("searchResults");
    if (box && box.style.display !== "none") _positionSearchDropdown();
  });
  window.addEventListener(
    "scroll",
    function () {
      const box = document.getElementById("searchResults");
      if (box && box.style.display !== "none") _positionSearchDropdown();
    },
    true,
  );

  /* =============================================================
   ===== 20 NEW FEATURES JS =====
============================================================= */

  /* ---- F1: KEYBOARD SHORTCUTS HELP ---- */
  function openKbHelp() {
    document.getElementById("kbHelp").classList.add("open");
  }
  function closeKbHelp() {
    document.getElementById("kbHelp").classList.remove("open");
  }

  /* ---- STOP ADS / ADGUARD DNS MODAL ---- */
  const _stopAdsVideos = {
    android: "https://www.youtube.com/embed/7LvapEuPWQA",
    iphone: "https://www.youtube.com/embed/2EpkKd8K8K0",
    windows: "https://www.youtube.com/embed/pu30Bv9hwJo",
  };
  let _stopAdsCurrentTab = "android";
  function openStopAdsModal() {
    document.getElementById("stopAdsModal").style.display = "flex";
    switchStopAdsTab("android");
  }
  function closeStopAdsModal() {
    document.getElementById("stopAdsModal").style.display = "none";
    // Pause all videos
    ["android", "iphone", "windows"].forEach((p) => {
      const v = document.getElementById("stopAdsVideo-" + p);
      if (v) v.src = "";
    });
  }
  function switchStopAdsTab(platform) {
    _stopAdsCurrentTab = platform;
    ["android", "iphone", "windows"].forEach((p) => {
      const tab = document.getElementById("stopAdsTab-" + p);
      const content = document.getElementById("stopAdsContent-" + p);
      const isActive = p === platform;
      if (tab) {
        tab.style.background = isActive ? "var(--accent)" : "var(--bg)";
        tab.style.borderColor = isActive ? "var(--accent)" : "var(--border)";
        tab.style.color = isActive ? "#fff" : "var(--muted)";
        tab.style.fontWeight = isActive ? "700" : "600";
      }
      if (content) content.style.display = isActive ? "block" : "none";
      // Lazy-load video only when tab is opened
      if (isActive) {
        const vid = document.getElementById("stopAdsVideo-" + p);
        if (vid && !vid.src) vid.src = _stopAdsVideos[p];
      }
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "?" && document.activeElement.nodeName !== "INPUT")
      openKbHelp();
    if (e.key === "r" || e.key === "R") {
      if (
        document.activeElement.nodeName !== "INPUT" &&
        !document.getElementById("playerModal").classList.contains("open")
      )
        openRandom();
    }
    if (e.key === "w" || e.key === "W") {
      if (
        document.activeElement.nodeName !== "INPUT" &&
        !document.getElementById("playerModal").classList.contains("open")
      )
        toggleWatchlist();
    }
    if (e.key === "s" || e.key === "S") {
      if (document.activeElement.nodeName !== "INPUT")
        document.querySelector(".search-box input")?.focus();
    }
    if (e.key === "f" || e.key === "F") {
      if (document.activeElement.nodeName !== "INPUT") toggleFocusMode();
    }
  });

  /* ---- F2: CINEMATIC TRAILER FULLSCREEN ---- */
  // (already handled via playTrailer, enhanced with bigger overlay)
  // We hook into existing playTrailer
  /* playTrailer cinematic overlay merged into original */

  function closeTrailerOverlay() {
    const overlay = document.getElementById("trailerOverlay");
    if (!overlay) return;
    overlay.classList.remove("open");
    document.getElementById("trailerFrame").src = "";
    document.body.style.overflow = "";
  }

  /* ---- F3: PARENTAL PIN LOCK ---- */
  const DEFAULT_PIN = "1234";
  let pinBuffer = [];
  let pinLockActive = false;
  function openPinOverlay() {
    pinBuffer = [];
    updatePinDots();
    document.getElementById("pinError").style.display = "none";
    document.getElementById("pinOverlay").classList.add("open");
  }
  function closePinOverlay() {
    document.getElementById("pinOverlay").classList.remove("open");
  }
  function pinPress(n) {
    if (pinBuffer.length >= 4) return;
    pinBuffer.push(n);
    updatePinDots();
    if (pinBuffer.length === 4) {
      const entered = pinBuffer.join("");
      const saved = FirebaseDB.getItem("sv_pin") || DEFAULT_PIN;
      if (entered === saved) {
        pinLockActive = false;
        closePinOverlay();
        showToast("🔓 Parental lock disabled");
        FirebaseDB.setItem("sv_pin_active", "0");
      } else {
        document.getElementById("pinError").style.display = "block";
        setTimeout(() => {
          pinBuffer = [];
          updatePinDots();
          document.getElementById("pinError").style.display = "none";
        }, 1000);
      }
    }
  }
  function pinClear() {
    pinBuffer = [];
    updatePinDots();
  }
  function updatePinDots() {
    for (let i = 0; i < 4; i++) {
      const d = document.getElementById("pd" + i);
      if (d) d.classList.toggle("filled", i < pinBuffer.length);
    }
  }
  function toggleParentalLock() {
    pinLockActive = !pinLockActive;
    if (pinLockActive) {
      FirebaseDB.setItem("sv_pin_active", "1");
      showToast("🔒 Parental lock enabled (PIN: 1234)");
      openPinOverlay();
    } else {
      openPinOverlay();
    }
  }

  /* ---- F4: PLAYBACK SPEED ---- */
  function setPlaybackSpeed(speed, btn) {
    document
      .querySelectorAll(".speed-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    // Store for toast feedback
    showToast(`⚡ Playback speed: ${speed}×`);
    addNotif(`⚡ Playback speed set to <strong>${speed}×</strong>`);
    // Note: real speed control would need postMessage to iframe
  }

  /* ---- WATCH TOGETHER — Timestamp-Sync Embed Share ---- */
  /*
  Architecture (no WebRTC, no screen capture):
  HOST  → opens the normal player (embed iframe) for themselves
        → on play/pause writes state to Firebase RTDB:
            watch_parties/{roomId}/state = { tmdbId, type, sourceIdx, season, episode,
                                              playing, startedAt, pausedAt, ts }
        → every 15 s re-broadcasts current timestamp (drift correction tick)
  GUEST → shows a fullscreen modal with its OWN embed iframe pointing at the
            identical embed URL; a transparent overlay blocks all clicks
        → listens to Firebase state; on every change reloads the iframe
            to the correct seek position — silent and automatic
*/

  // ── State ───────────────────────────────────────────────────────────────────
  let wtRoomId = null;
  let wtRole = null; // 'host' | 'guest'
  let wtItem = null;
  let wtPaused = true;
  let wtStartTime = null; // wall-clock ms when play was last pressed (host)
  let wtPauseOffset = 0; // accumulated seconds before latest play
  let partyInterval = null;
  let partySeconds = 0;

  let _wtUnsubscribe = null; // Firebase state listener (guest)
  let _wtCachedState = null;
  let _wtSyncInterval = null; // host periodic drift-correction tick

  function wtGenId() {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  // ── Firebase helpers ─────────────────────────────────────────────────────────
  function _wtDb() {
    return window._firebaseRTDB.getDatabase();
  }
  function _wtRef(path) {
    return window._firebaseRTDB.ref(_wtDb(), path);
  }
  function _wtSet(path, val) {
    return window._firebaseRTDB
      .set(_wtRef(path), val)
      .catch((e) => console.warn("[WT]", e));
  }
  function _wtRemove(path) {
    return window._firebaseRTDB.remove(_wtRef(path)).catch(() => {});
  }
  function _wtListen(path, cb) {
    return window._firebaseRTDB.onValue(_wtRef(path), cb);
  }

  // ── Compute current playback second (host side) ──────────────────────────────
  function wtCurrentSec() {
    if (wtPaused || !wtStartTime) return wtPauseOffset;
    return wtPauseOffset + (Date.now() - wtStartTime) / 1000;
  }

  // ── Write full state to Firebase ─────────────────────────────────────────────
  function wtBroadcast(action) {
    if (!wtRoomId || wtRole !== "host") return;
    const src = PLAYER_SOURCES[_currentSourceIdx] || PLAYER_SOURCES[0];
    _wtSet("watch_parties/" + wtRoomId + "/state", {
      action: action,
      tmdbId: wtItem ? wtItem.tmdbId : null,
      type: wtItem ? wtItem.type : null,
      title: wtItem ? wtItem.title : null,
      sourceIdx: _currentSourceIdx,
      season: currentSeason,
      episode: currentEpisode,
      playing: !wtPaused,
      startedAt: wtPaused ? null : wtStartTime,
      pausedAt: wtPaused ? wtPauseOffset : null,
      currentSec: wtCurrentSec(),
      ts: Date.now(),
    });
  }

  // ── HOST: start a session ────────────────────────────────────────────────────
  async function wtHost() {
    if (!currentItem) {
      showToast("Open a movie or series first!");
      return;
    }

    wtCleanup();
    wtRoomId = wtGenId();
    wtRole = "host";
    wtItem = currentItem;
    wtPaused = true;
    wtStartTime = null;
    wtPauseOffset = 0;

    await _wtSet("watch_parties/" + wtRoomId, {
      title: wtItem.title,
      tmdbId: wtItem.tmdbId,
      type: wtItem.type,
      host: (window._svProfile && window._svProfile.name) || "Host",
      ts: Date.now(),
    });

    // Open the player for the host just like normal
    playNow();
    // Show the guest blocker on host side too (host has their own controls)
    // No blocker needed — host controls the real player normally

    // Start drift-correction broadcast every 15 s
    _wtSyncInterval = setInterval(function () {
      if (wtRoomId && wtRole === "host") wtBroadcast("sync");
    }, 15000);

    wtShowHUD();
    closeWatchTogetherModal();
    showToast("🎬 Session ready! Share the invite link with friends.");
  }

  // ── HOST: play ───────────────────────────────────────────────────────────────
  function wtHostPlay() {
    if (wtRole !== "host") return;
    wtPaused = false;
    wtStartTime = Date.now();
    wtBroadcast("play");
  }

  // ── HOST: pause ──────────────────────────────────────────────────────────────
  function wtHostPause() {
    if (wtRole !== "host") return;
    wtPauseOffset = wtCurrentSec();
    wtPaused = true;
    wtStartTime = null;
    wtBroadcast("pause");
  }

  // ── HOST: seek (call after seeking in the player) ───────────────────────────
  function wtHostSeek() {
    if (wtRole !== "host") return;
    wtBroadcast(wtPaused ? "pause" : "play");
  }

  // ── GUEST: join a room ───────────────────────────────────────────────────────
  async function wtJoin(roomId) {
    wtCleanup();
    wtRoomId = roomId;
    wtRole = "guest";

    // Show the guest modal immediately with spinner
    const modal = document.getElementById("wtStreamModal");
    if (modal) modal.style.display = "flex";
    const statusEl = document.getElementById("wtStreamStatus");
    const statusTxt = document.getElementById("wtStreamStatusText");
    if (statusEl) statusEl.style.display = "flex";
    if (statusTxt) statusTxt.textContent = "Waiting for host to start…";

    wtShowHUD();

    // Listen to host state
    _wtUnsubscribe = _wtListen(
      "watch_parties/" + roomId + "/state",
      function (snap) {
        if (!snap.exists()) return;
        const s = snap.val();
        _wtCachedState = s;
        wtGuestApply(s);
      },
    );
  }

  // ── GUEST: apply a state update from Firebase ────────────────────────────────
  function wtGuestApply(s) {
    if (!s) return;

    // Update item info
    if (s.tmdbId && (!wtItem || String(wtItem.tmdbId) !== String(s.tmdbId))) {
      const found = allContent.find(
        (i) => String(i.tmdbId) === String(s.tmdbId) && i.type === s.type,
      );
      wtItem = found || {
        title: s.title || "Watch Together",
        tmdbId: s.tmdbId,
        type: s.type,
      };
      const titleEl = document.getElementById("wtStreamTitle");
      if (titleEl) titleEl.textContent = wtItem.title || "Watch Together";
      wtUpdateHUD();
    }

    if (s.action === "end") {
      showToast("Host ended the Watch Together session.");
      wtCleanup();
      wtHideHUD();
      const modal = document.getElementById("wtStreamModal");
      if (modal) modal.style.display = "none";
      return;
    }

    // Build the correct embed URL at the right timestamp
    const srcIdx =
      typeof s.sourceIdx === "number" &&
      s.sourceIdx >= 0 &&
      s.sourceIdx < PLAYER_SOURCES.length
        ? s.sourceIdx
        : 0;
    const src = PLAYER_SOURCES[srcIdx];
    if (!src || !s.tmdbId) return;

    // Calculate seek position
    let seekSec = 0;
    if (s.playing && s.startedAt) {
      seekSec = (s.currentSec || 0) + (Date.now() - s.ts) / 1000;
    } else {
      seekSec = s.currentSec || s.pausedAt || 0;
    }
    seekSec = Math.max(0, Math.floor(seekSec));

    // Build URL with seek param
    function addSeek(url) {
      if (seekSec < 3) return url;
      const sep = url.includes("?") ? "&" : "?";
      return url + sep + "t=" + seekSec + "&start=" + seekSec;
    }

    const season = s.season || 1;
    const episode = s.episode || 1;
    const url =
      s.type === "movie"
        ? addSeek(src.movie(s.tmdbId))
        : addSeek(src.tv(s.tmdbId, season, episode));

    const frameEl = document.getElementById("wtGuestFrame");
    const modal = document.getElementById("wtStreamModal");

    if (frameEl) {
      // Only reload if URL meaningfully changed (avoids constant reload on sync ticks
      // unless drift > 5 s)
      const existing = frameEl.src || "";
      const existingBase = existing.split("?")[0];
      const newBase = url.split("?")[0];
      const existingT = parseInt(
        (existing.match(/[?&]t=(\d+)/) || [])[1] || "0",
        10,
      );
      const drift = Math.abs(seekSec - existingT);

      if (
        existingBase !== newBase ||
        drift > 5 ||
        s.action === "play" ||
        s.action === "pause"
      ) {
        frameEl.src = url;
      }
    }

    if (modal) modal.style.display = "flex";

    // Hide spinner once we have a URL
    const statusEl = document.getElementById("wtStreamStatus");
    if (statusEl && url) statusEl.style.display = "none";

    // Keep HUD updated
    const subEl = document.getElementById("partySub");
    if (subEl) subEl.textContent = s.playing ? "Playing live" : "Paused";
  }

  // ── GUEST: leave ─────────────────────────────────────────────────────────────
  function wtGuestLeave() {
    wtCleanup();
    wtHideHUD();
    const modal = document.getElementById("wtStreamModal");
    if (modal) modal.style.display = "none";
    showToast("Left the Watch Together session.");
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────────
  function wtCleanup() {
    if (_wtUnsubscribe) {
      try {
        _wtUnsubscribe();
      } catch (e) {}
      _wtUnsubscribe = null;
    }
    if (_wtSyncInterval) {
      clearInterval(_wtSyncInterval);
      _wtSyncInterval = null;
    }

    // If host: remove room from Firebase
    if (wtRoomId && wtRole === "host") {
      _wtRemove("watch_parties/" + wtRoomId);
    }

    // Clear guest iframe
    const frameEl = document.getElementById("wtGuestFrame");
    if (frameEl) frameEl.src = "";

    wtRoomId = null;
    wtRole = null;
    wtItem = null;
    wtPaused = true;
    wtStartTime = null;
    wtPauseOffset = 0;
    _wtCachedState = null;
  }

  // ── Room link ─────────────────────────────────────────────────────────────────
  function wtBuildLink(roomId) {
    const url = new URL(window.location.href);
    url.searchParams.set("wtroom", roomId);
    return url.toString();
  }

  // ── End session (host) ────────────────────────────────────────────────────────
  function wtEndSession() {
    if (wtRole !== "host") return;
    wtBroadcast("end");
    setTimeout(function () {
      wtCleanup();
      wtHideHUD();
    }, 300);
    showToast("Watch Together session ended.");
  }

  // ── HUD ───────────────────────────────────────────────────────────────────────
  function wtShowHUD() {
    const el = document.getElementById("partyTimer");
    if (el) el.classList.add("visible");
    wtUpdateHUD();
  }
  function wtHideHUD() {
    const el = document.getElementById("partyTimer");
    if (el) el.classList.remove("visible");
  }
  function wtUpdateHUD() {
    const titleEl = document.getElementById("partyCountdown");
    const subEl = document.getElementById("partySub");
    const actEl = document.getElementById("partyActions");
    if (!titleEl) return;
    titleEl.textContent = (wtItem && wtItem.title) || "Watch Together";
    if (wtRole === "host") {
      if (subEl) subEl.textContent = "Host \u2022 You control playback";
      if (actEl)
        actEl.innerHTML =
          '<button class="btn btn-ghost" style="font-size:11px;padding:5px 10px" onclick="wtCopyLink()">&#128279; Copy Link</button>' +
          '<button class="btn btn-ghost" style="font-size:11px;padding:5px 10px" onclick="wtHostPlay()">&#9654; Play</button>' +
          '<button class="btn btn-ghost" style="font-size:11px;padding:5px 10px" onclick="wtHostPause()">&#9646;&#9646; Pause</button>' +
          '<button class="btn btn-ghost" style="font-size:11px;padding:5px 10px;color:var(--accent)" onclick="wtEndSession()">End</button>';
    } else {
      if (subEl)
        subEl.textContent = wtRoomId
          ? "Watching \u2022 Room: " + wtRoomId
          : "Connecting\u2026";
      if (actEl)
        actEl.innerHTML =
          '<button class="btn btn-ghost" style="font-size:11px;padding:5px 10px" onclick="wtGuestLeave()">Leave</button>';
    }
  }

  function closeWatchTogether() {
    if (wtRole === "host") {
      if (confirm("End the Watch Together session for everyone?"))
        wtEndSession();
    } else {
      wtGuestLeave();
    }
  }

  function wtCopyLink() {
    const link = wtBuildLink(wtRoomId);
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(link)
        .then(() => showToast("Link copied! Share with friends."))
        .catch(() => prompt("Copy this link:", link));
    } else {
      prompt("Copy this link:", link);
    }
  }

  function wtLeave() {
    wtGuestLeave();
  }
  function wtApplySync() {}
  function wtPoll() {}
  function wtHostSeek() {
    if (wtRole === "host") wtBroadcast(wtPaused ? "pause" : "play");
  }

  // ── Watch Together modal UI ──────────────────────────────────────────────────
  function openWatchTogetherModal() {
    const modal = document.getElementById("watchTogetherModal");
    const wtc = document.getElementById("wtContent");
    if (!modal || !wtc) return;
    modal.classList.add("open");

    const params = new URLSearchParams(window.location.search);
    const joinRoom = params.get("wtroom");

    if (joinRoom && !wtRoomId) {
      wtc.innerHTML =
        '<div style="text-align:center;padding:10px 0 20px"><div style="font-size:2.2rem;margin-bottom:12px">&#127881;</div><div style="font-family:var(--font-display);font-size:1rem;font-weight:700;color:var(--white);margin-bottom:6px">You\'ve been invited!</div><div style="color:var(--muted);font-size:13px;margin-bottom:20px">Room <strong style="color:var(--accent);font-family:var(--font-mono)">' +
        joinRoom +
        '</strong></div><button class="btn btn-primary" onclick="wtJoin(\'' +
        joinRoom +
        "');closeWatchTogetherModal()\">Join Session</button></div>";
      return;
    }

    if (wtRoomId) {
      const link = wtBuildLink(wtRoomId);
      wtc.innerHTML =
        '<div style="margin-bottom:14px;font-family:var(--font-display);font-size:.85rem;color:var(--muted)">Active session</div><div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:12px 14px;margin-bottom:16px"><div style="font-family:var(--font-mono);font-size:.75rem;color:var(--accent);margin-bottom:4px">ROOM ID</div><div style="font-family:var(--font-mono);font-size:1.1rem;font-weight:700;color:var(--white);letter-spacing:.1em">' +
        wtRoomId +
        '</div></div><div style="margin-bottom:16px"><div style="font-size:12px;color:var(--muted);font-family:var(--font-display);margin-bottom:8px">Share this link:</div><div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:8px 12px;font-size:11px;font-family:var(--font-mono);color:var(--white2);word-break:break-all">' +
        link +
        '</div></div><button class="btn btn-primary" style="width:100%;justify-content:center" onclick="wtCopyLink()">&#128279; Copy Invite Link</button>';
      return;
    }

    const hasItem = !!currentItem;
    const itemHtml = hasItem
      ? '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:12px 14px;display:flex;align-items:center;gap:12px;margin-bottom:20px"><img src="' +
        IMG +
        currentItem.poster +
        '" style="width:40px;height:60px;object-fit:cover;border-radius:6px;flex-shrink:0" onerror="this.style.opacity=.3"/><div><div style="font-family:var(--font-display);font-weight:700;font-size:.85rem;color:var(--white)">' +
        currentItem.title +
        '</div><div style="font-size:12px;color:var(--muted)">' +
        currentItem.year +
        " \u00b7 \u2605" +
        currentItem.rating +
        '</div></div></div><button class="btn btn-primary" style="width:100%;justify-content:center;margin-bottom:10px" onclick="wtHost()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>&#127909; Host a Session</button><div style="font-size:11px;color:var(--muted);margin-top:8px;line-height:1.5">Guests load the same video source and stay in sync automatically. No screen sharing needed — works on any device.</div>'
      : '<div style="background:var(--bg3);border:1px solid var(--border2);border-radius:var(--radius);padding:14px;text-align:center;margin-bottom:16px;color:var(--muted);font-family:var(--font-display);font-size:13px">Open a movie or series first, then come back to host.</div>';

    wtc.innerHTML =
      '<div style="margin-bottom:18px"><p style="color:var(--muted);font-size:13px;line-height:1.6;font-family:var(--font-display)">Everyone loads the same embed — you control play, pause, and timing. Guests follow automatically, no screen sharing required.</p></div>' +
      itemHtml +
      '<div style="display:flex;align-items:center;gap:10px;margin:14px 0"><div style="flex:1;height:1px;background:var(--border)"></div><span style="font-size:11px;color:var(--muted);font-family:var(--font-display)">or join a room</span><div style="flex:1;height:1px;background:var(--border)"></div></div><div style="display:flex;gap:8px"><input id="wtJoinInput" type="text" placeholder="Enter room code" maxlength="6" style="flex:1;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:8px 12px;color:var(--text);font-family:var(--font-mono);font-size:13px;outline:none;text-transform:uppercase" oninput="this.value=this.value.toUpperCase()" onkeydown="if(event.key===\'Enter\')wtJoinFromInput()"/><button class="btn btn-ghost" onclick="wtJoinFromInput()">Join</button></div>';
  }

  function wtJoinFromInput() {
    const code = (
      (document.getElementById("wtJoinInput") &&
        document.getElementById("wtJoinInput").value) ||
      ""
    )
      .trim()
      .toUpperCase();
    if (code.length < 4) {
      showToast("Enter a valid room code");
      return;
    }
    wtJoin(code);
    closeWatchTogetherModal();
  }

  function closeWatchTogetherModal() {
    const m = document.getElementById("watchTogetherModal");
    if (m) m.classList.remove("open");
  }

  // Auto-join if URL has ?wtroom=XXXX — wait for app to be ready first
  (function wtCheckUrl() {
    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get("wtroom");
    if (!roomCode) return;
    function _tryAutoJoin() {
      if (typeof allContent !== "undefined" && allContent.length > 0) {
        wtJoin(roomCode.toUpperCase());
        try {
          history.replaceState(null, "", window.location.pathname);
        } catch (e) {}
      } else {
        setTimeout(_tryAutoJoin, 500);
      }
    }
    var _checkReady = setInterval(function () {
      if (window._svAuthReady) {
        clearInterval(_checkReady);
        _tryAutoJoin();
      }
    }, 300);
  })();

  // Legacy stubs
  function startPartyTimer(s) {
    openWatchTogetherModal();
  }
  function stopPartyTimer() {
    closeWatchTogether();
  }
  function updatePartyDisplay() {}

  function openWatchParty() {
    openWatchTogetherModal();
  }

  /* ---- F6: SNAP / SCREENSHOT CARD ---- */
  function snapCurrentContent() {
    if (!currentItem) return;
    showToast(`📸 Snap saved: ${currentItem.title}`);
    addNotif(`📸 You snapped <strong>${currentItem.title}</strong>`);
  }

  /* ---- F7: AI REVIEW SUMMARY (injected into detail) ---- */
  const AI_REVIEWS = {
    Action:
      "High-octane entertainment with stunning set pieces. Perfect for when you want pure cinematic adrenaline.",
    Drama:
      "A deeply emotional experience anchored by powerhouse performances and nuanced character development.",
    Comedy:
      "Brilliantly written humor that lands consistently. A genuine mood-lifter from start to finish.",
    Horror:
      "Genuinely unsettling atmosphere that lingers long after the credits roll. Not for the faint-hearted.",
    Thriller:
      "Edge-of-your-seat tension with smart plotting. Every scene feels purposeful and charged.",
    "Sci-Fi":
      "Visionary worldbuilding that asks the big questions while still delivering spectacle.",
    Romance:
      "Heartfelt and charming — the chemistry is undeniable and the emotional beats hit hard.",
    Animation:
      "Visually gorgeous and emotionally resonant. Works beautifully for all ages.",
    Crime:
      "Morally complex and gripping. The kind of story that makes you question your own sympathies.",
    default:
      "A compelling watch with strong performances and memorable moments throughout.",
  };
  function getAIReview(item) {
    const g = (item.genres && item.genres[0]) || "default";
    return AI_REVIEWS[g] || AI_REVIEWS["default"];
  }

  /* ---- F8: FAVOURITE GENRE INSIGHTS ---- */
  function renderGenreInsight() {
    const gCount = {};
    const allWl = [
      ...multiWatchlist.want,
      ...multiWatchlist.watching,
      ...multiWatchlist.done,
    ];
    allWl.forEach((item) => {
      if (item.genres)
        item.genres.forEach((g) => {
          gCount[g] = (gCount[g] || 0) + 1;
        });
    });
    getAllCW().forEach((cw) => {
      const found = allContent.find(
        (a) => a.tmdbId === cw.tmdbId && a.type === cw.type,
      );
      if (found && found.genres)
        found.genres.forEach((g) => {
          gCount[g] = (gCount[g] || 0) + 0.5;
        });
    });
    return Object.entries(gCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }

  /* ---- F9: SLEEP TIMER ---- */
  let sleepTimerInterval = null;
  let sleepRemaining = 0;
  function openSleepTimerModal() {
    document.getElementById("sleepTimerModal").style.display = "flex";
    const inp = document.getElementById("sleepTimerCustom");
    if (inp) inp.value = "";
  }
  function closeSleepTimerModal() {
    document.getElementById("sleepTimerModal").style.display = "none";
  }
  function confirmSleepTimer(mins) {
    closeSleepTimerModal();
    startSleepTimer(mins * 60);
  }
  function confirmSleepTimerCustom() {
    const val = parseInt(document.getElementById("sleepTimerCustom").value);
    if (!isNaN(val) && val > 0) {
      confirmSleepTimer(val);
    }
  }
  function startSleepTimer(seconds) {
    sleepRemaining = seconds;
    clearInterval(sleepTimerInterval);
    document.getElementById("sleepTimerBadge").classList.add("visible");
    updateSleepDisplay();
    sleepTimerInterval = setInterval(() => {
      sleepRemaining--;
      updateSleepDisplay();
      if (sleepRemaining <= 0) {
        cancelSleepTimer();
        stopAllPlayback();
        showToast("😴 Sleep timer ended — Good night!");
      }
    }, 1000);
    showToast(`😴 Sleep timer set: ${Math.round(seconds / 60)} min`);
  }
  function stopAllPlayback() {
    // Stop main player iframe
    const playerFrame = document.getElementById("playerFrame");
    if (playerFrame) playerFrame.src = "";

    // Stop trailer iframe
    const trailerFrame = document.getElementById("trailerFrame");
    if (trailerFrame) trailerFrame.src = "";

    // Close all open modals
    const playerModal = document.getElementById("playerModal");
    if (playerModal) playerModal.classList.remove("open");

    const detailModal = document.getElementById("detailModal");
    if (detailModal) detailModal.classList.remove("open");

    const trailerOverlay = document.getElementById("trailerOverlay");
    if (trailerOverlay) trailerOverlay.style.display = "none";

    // Hide mini player
    const miniPlayer = document.getElementById("miniPlayer");
    if (miniPlayer) miniPlayer.classList.remove("visible");
    if (typeof miniPlayerItem !== "undefined") window.miniPlayerItem = null;

    // Restore scroll and clean URL
    document.body.style.overflow = "";
    window.history.replaceState(null, "", window.location.pathname);

    // Unsubscribe comments listener if any
    if (typeof _commentsUnsubscribe === "function") {
      _commentsUnsubscribe();
      _commentsUnsubscribe = null;
    }

    // Stop any HTML5 audio/video elements on the page (fallback)
    document.querySelectorAll("video, audio").forEach((el) => {
      try {
        el.pause();
        el.src = "";
      } catch (e) {}
    });
  }
  function updateSleepDisplay() {
    const m = Math.floor(sleepRemaining / 60)
      .toString()
      .padStart(2, "0");
    const s = (sleepRemaining % 60).toString().padStart(2, "0");
    document.getElementById("sleepTimerVal").textContent = `${m}:${s}`;
  }
  function cancelSleepTimer() {
    clearInterval(sleepTimerInterval);
    document.getElementById("sleepTimerBadge").classList.remove("visible");
  }

  /* ---- F10: SUBTITLE LANGUAGE PICKER ---- */
  function setSubtitleLang(lang) {
    if (!lang) {
      showToast("Subtitles disabled");
      return;
    }
    const langNames = {
      en: "English",
      fr: "French",
      es: "Spanish",
      ar: "Arabic",
      de: "German",
      ja: "Japanese",
      zh: "Chinese",
    };
    showToast(`Subtitles: ${langNames[lang] || lang}`);
    addNotif(`Subtitles set to <strong>${langNames[lang] || lang}</strong>`);
  }

  /* ---- F11: TRENDING LIVE TICKER ---- */
  function initTicker() {
    const ticker = document.getElementById("tickerInner");
    if (!ticker || !allContent || !allContent.length) return;
    const top = [...allContent]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 15);
    const items = top.map(
      (i) =>
        `<span style="color:var(--accent2)">★${i.rating}</span> ${i.title}`,
    );
    // Double for seamless loop
    ticker.innerHTML = [...items, ...items]
      .map((t) => `<span>${t}</span>`)
      .join("");
  }

  /* ---- F12: CONTENT CALENDAR ---- */
  let calYear = new Date().getFullYear();
  let calMonth = new Date().getMonth();
  function openCalendarModal() {
    renderCalendar();
    document.getElementById("calendarModal").classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeCalendarModal() {
    document.getElementById("calendarModal").classList.remove("open");
    document.body.style.overflow = "";
  }
  function renderCalendar() {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    document.getElementById("calMonthLabel").textContent =
      `${monthNames[calMonth]} ${calYear}`;
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const today = new Date();
    // Randomly seed some "release" days from content years
    const releaseDays = new Set([3, 7, 11, 14, 19, 22, 28].map((d) => d));
    let html = "";
    ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].forEach((d) => {
      html += `<div class="cal-day-hdr">${d}</div>`;
    });
    for (let i = 0; i < firstDay; i++)
      html += '<div class="cal-day" style="opacity:.2"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday =
        d === today.getDate() &&
        calMonth === today.getMonth() &&
        calYear === today.getFullYear();
      const hasRelease = releaseDays.has(d);
      html += `<div class="cal-day ${isToday ? "today" : ""} ${hasRelease ? "has-release" : ""}" title="${hasRelease ? "Release day" : ""}">${d}${hasRelease ? '<div class="cal-dot"></div>' : ""}</div>`;
    }
    document.getElementById("calGrid").innerHTML = html;
  }
  function calPrev() {
    calMonth--;
    if (calMonth < 0) {
      calMonth = 11;
      calYear--;
    }
    renderCalendar();
  }
  function calNext() {
    calMonth++;
    if (calMonth > 11) {
      calMonth = 0;
      calYear++;
    }
    renderCalendar();
  }

  /* ---- F13: SOCIAL REACTIONS ---- */
  let reactions = JSON.parse(FirebaseDB.getItem("sv_reactions") || "{}");
  function toggleReaction(type) {
    if (!currentItem) return;
    const key = currentItem.type + "_" + currentItem.tmdbId + "_" + type;
    const counts = JSON.parse(FirebaseDB.getItem("sv_reaction_counts") || "{}");
    if (reactions[key]) {
      delete reactions[key];
      counts[key] = Math.max(0, (counts[key] || 1) - 1);
      showToast("Reaction removed");
    } else {
      reactions[key] = true;
      counts[key] = (counts[key] || 0) + 1;
      const labels = {
        fire: "🔥 Lit!",
        laugh: "😂 Hilarious!",
        cry: "😢 Emotional!",
        mindblown: "🤯 Mind-blown!",
      };
      showToast(labels[type] || "Reacted!");
      addNotif(`You reacted to <strong>${currentItem.title}</strong>`);
    }
    FirebaseDB.setItem("sv_reactions", JSON.stringify(reactions));
    FirebaseDB.setItem("sv_reaction_counts", JSON.stringify(counts));
    renderReactions();
  }
  function renderReactions() {
    const container = document.getElementById("reactionsRow");
    if (!container || !currentItem) return;
    const counts = JSON.parse(FirebaseDB.getItem("sv_reaction_counts") || "{}");
    const types = [
      {
        id: "fire",
        svg: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C12 2 8 7 8 11C8 13.21 9.79 15 12 15C14.21 15 16 13.21 16 11C16 9 14.5 7.5 14.5 7.5C14.5 7.5 14 10 12.5 10C11 10 10 8.5 10 8.5C10 8.5 12 7 12 2Z" fill="var(--accent)"/></svg>',
      },
      {
        id: "laugh",
        svg: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
      },
      {
        id: "cry",
        svg: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M16 15s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/><path d="M10 14l-1 3"/><path d="M14 14l1 3"/></svg>',
      },
      {
        id: "mindblown",
        svg: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="15" x2="16" y2="15"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
      },
    ];
    container.innerHTML = types
      .map((t) => {
        const key = currentItem.type + "_" + currentItem.tmdbId + "_" + t.id;
        const count = counts[key] || 0;
        const active = reactions[key] ? "reacted" : "";
        return `<button class="reaction-btn ${active}" onclick="toggleReaction('${t.id}')">
      <span class="reaction-icon">${t.svg}</span>
      <span class="reaction-count">${count || ""}</span>
    </button>`;
      })
      .join("");
  }

  /* ---- F14: GLASSMORPHISM GENRE INSIGHT (in stats) ---- */
  // Already handled in stats modal CSS, insight shown in detail

  /* ---- F16: WATCHTIME GOAL TRACKER ---- */
  let watchGoalHours = parseInt(FirebaseDB.getItem("sv_goal_hrs") || "5");
  function setWatchGoal(h) {
    watchGoalHours = h;
    FirebaseDB.setItem("sv_goal_hrs", h);
  }
  function getGoalProgress() {
    const cw = getAllCW();
    const watched = cw.length * 1.5; // rough estimate 1.5h each
    return Math.min(100, Math.round((watched / watchGoalHours) * 100));
  }

  /* ---- F17: COLLECTIONS / PLAYLISTS ---- */
  let collections = JSON.parse(FirebaseDB.getItem("sv_collections") || "[]");
  function openCollections() {
    renderCollections();
    document.getElementById("collectionsPanel").classList.add("open");
  }
  function closeCollections() {
    document.getElementById("collectionsPanel").classList.remove("open");
  }
  function renderCollections() {
    const body = document.getElementById("collBody");
    if (!collections.length) {
      body.innerHTML =
        '<div class="wl-empty">No collections yet.</div><button class="coll-add" onclick="createCollection()">+ New Collection</button>';
      return;
    }
    body.innerHTML =
      collections
        .map(
          (c, i) => `
    <div class="coll-item">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div class="coll-name">${c.name}</div>
        <button style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:14px" onclick="deleteCollection(${i},event)">✕</button>
      </div>
      <div class="coll-count">${c.items.length} title${c.items.length !== 1 ? "s" : ""}</div>
    </div>`,
        )
        .join("") +
      '<button class="coll-add" onclick="createCollection()">+ New Collection</button>';
  }
  function createCollection() {
    const modal = document.getElementById("collNameModal");
    const input = document.getElementById("collNameInput");
    input.value = "";
    modal.style.display = "flex";
    setTimeout(() => input.focus(), 50);
  }
  function closeCollNameModal() {
    document.getElementById("collNameModal").style.display = "none";
  }
  function confirmCreateCollection() {
    const input = document.getElementById("collNameInput");
    const name = input.value.trim();
    if (!name) {
      input.style.borderColor = "var(--accent)";
      input.focus();
      return;
    }
    closeCollNameModal();
    collections.push({ name, items: [] });
    FirebaseDB.setItem("sv_collections", JSON.stringify(collections));
    renderCollections();
    showToast(`📁 Created: "${name}"`);
  }
  function deleteCollection(i, e) {
    e && e.stopPropagation();
    collections.splice(i, 1);
    FirebaseDB.setItem("sv_collections", JSON.stringify(collections));
    renderCollections();
    showToast("Collection deleted");
  }
  let _pickCollItem = null;
  function addToCollection(item) {
    if (!collections.length) {
      createCollection();
      return;
    }
    _pickCollItem = item;
    const list = document.getElementById("pickCollList");
    list.innerHTML = collections
      .map(
        (c, i) => `
    <button onclick="pickCollection(${i})" style="display:flex;align-items:center;justify-content:space-between;background:var(--bg);border:1.5px solid var(--border);border-radius:10px;padding:11px 14px;cursor:pointer;font-family:var(--font-display);font-size:13px;color:var(--text);text-align:left;transition:border .2s"
      onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
      <span style="font-weight:600">${c.name}</span>
      <span style="color:var(--muted);font-size:11px">${c.items.length} title${c.items.length !== 1 ? "s" : ""}</span>
    </button>`,
      )
      .join("");
    document.getElementById("pickCollModal").style.display = "flex";
  }
  function closePickCollModal() {
    document.getElementById("pickCollModal").style.display = "none";
    _pickCollItem = null;
  }
  function pickCollection(i) {
    const item = _pickCollItem;
    closePickCollModal();
    if (!item) return;
    const coll = collections[i];
    const exists = coll.items.some(
      (w) => w.tmdbId === item.tmdbId && w.type === item.type,
    );
    if (!exists) {
      coll.items.push(item);
      FirebaseDB.setItem("sv_collections", JSON.stringify(collections));
      showToast(`✔ Added to "${coll.name}"`);
    } else {
      showToast("Already in this collection");
    }
  }

  /* ---- F18: AMBIENT GLOW based on content genre ---- */
  function setAmbientGlow(item) {
    const glow = document.getElementById("ambientGlow");
    if (!glow) return;
    const colors = {
      Horror: "rgba(180,30,30,0.12)",
      "Sci-Fi": "rgba(30,100,200,0.1)",
      Romance: "rgba(200,80,120,0.1)",
      Action: "rgba(212,105,58,0.12)",
      Comedy: "rgba(220,180,50,0.08)",
      Thriller: "rgba(100,60,180,0.1)",
      default: "rgba(212,105,58,0.08)",
    };
    const genre = (item && item.genres && item.genres[0]) || "default";
    const color = colors[genre] || colors["default"];
    glow.style.background = `radial-gradient(ellipse 70% 60% at 50% 50%, ${color}, transparent)`;
    glow.classList.add("active");
    setTimeout(() => glow.classList.remove("active"), 3000);
  }

  /* ---- F19: FOCUS MODE ---- */
  let focusModeOn = false;
  function toggleFocusMode() {
    focusModeOn = !focusModeOn;
    document.body.classList.toggle("focus-mode", focusModeOn);
    const btn = document.getElementById("focusModeBtn");
    if (btn) btn.style.borderColor = focusModeOn ? "var(--accent)" : "";
    showToast(
      focusModeOn
        ? "🎯 Focus Mode: ON — minimal distractions"
        : "🎯 Focus Mode: OFF",
    );
  }

  /* ---- F20: CONTENT COMPARISON TOOL ---- */
  /* ---- INIT ticker on load ---- */
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(initTicker, 500);
    // Init ambient glow
    const ambGlow = document.getElementById("ambientGlow");
    if (ambGlow) ambGlow.classList.remove("active");
  });

  /* openContent: ambient glow merged into original */

  /* ---- CALENDAR MODAL HTML (inject dynamically) ---- */
  (function injectCalendarModal() {
    const div = document.createElement("div");
    div.className = "modal-overlay";
    div.id = "calendarModal";
    div.setAttribute("onclick", "if(event.target===this)closeCalendarModal()");
    div.innerHTML = `
    <div class="modal" style="max-width:520px;flex-direction:column">
      <div class="modal-header">
        <div class="modal-title">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:middle;margin-right:6px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Release Calendar
        </div>
        <button class="modal-close" onclick="closeCalendarModal()">✕</button>
      </div>
      <div class="cal-nav">
        <button class="cal-arrow" onclick="calPrev()">‹</button>
        <span class="cal-month" id="calMonthLabel"></span>
        <button class="cal-arrow" onclick="calNext()">›</button>
      </div>
      <div class="cal-grid" id="calGrid"></div>
    </div>`;
    document.body.appendChild(div);
  })();

  /* ---- TRAILER OVERLAY HTML (inject dynamically) ---- */
  (function injectTrailerOverlay() {
    const div = document.createElement("div");
    div.id = "trailerOverlay";
    div.innerHTML = `
    <div class="trailer-close-bar">
      <span class="trailer-title-bar" id="trailerTitleBar"></span>
      <button class="trailer-close-btn" onclick="closeTrailerOverlay()">✕ Close</button>
    </div>
    <iframe id="trailerFrame" src="" allowfullscreen allow="fullscreen;autoplay;encrypted-media"></iframe>`;
    document.body.appendChild(div);
  })();

  /* ---- Inject calendar + watch party + compare buttons in mobile drawer ---- */
  (function addMobileFeatureBtns() {
    const actRow = document.querySelector(".mobile-action-row");
    if (!actRow) return;
    const extra = document.createElement("button");
    extra.className = "mobile-action-btn";
    extra.setAttribute("onclick", "openCalendarModal();closeMobileDrawer()");
    extra.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Calendar';
    actRow.appendChild(extra);
  })();

  /* renderDetail extra UI merged into original */

  /* =============================================================
   ===== ADSHIELD NUCLEAR — simple & reliable ad killer =====
   Core strategy: window.open = null for everything except the
   explicit whitelist. Any window that somehow opens gets closed
   immediately. No complex logic, no edge cases.
============================================================= */

  /* ── Whitelisted domains — the ONLY ones allowed to open new tabs */

  function openEarnModal() {}
  function closeEarnModal() {}
  function openStatsModal() {}
  function closeStatsModal() {}
  function openAchievements() {}
  function closeAchievements() {}
  function checkAchievements() {}
  function savePointsData() {}
  function tryUnlock() {
    return true;
  }

  /* =========================================================
   ===== LEADERBOARD =====
========================================================= */
  let _lbUnlisten = null;
  let _lbTab = "all";
  let _lbAllData = [];
  let _lbSessionStart = Date.now();
  let _lbFlushInterval = null;

  function _lbFormatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  function _lbFlushTime() {
    const elapsed = Math.floor((Date.now() - _lbSessionStart) / 1000);
    if (elapsed > 0 && window.FirebaseLeaderboard) {
      window.FirebaseLeaderboard.addTime(elapsed);
      _lbSessionStart = Date.now();
    }
  }

  function _lbStartTracking() {
    _lbSessionStart = Date.now();
    _lbFlushInterval = setInterval(_lbFlushTime, 60000);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) _lbFlushTime();
      else _lbSessionStart = Date.now();
    });
    window.addEventListener("beforeunload", _lbFlushTime);
  }

  function _lbRenderList(data) {
    const myUid = window.FirebaseLeaderboard
      ? window.FirebaseLeaderboard.getCurrentUid()
      : null;
    const container = document.getElementById("lbList");
    if (!container) return;

    if (!data.length) {
      container.innerHTML =
        '<div class="lb-empty">No watch time recorded yet. Be the first! 🎬</div>';
      return;
    }

    const myRankEl = document.getElementById("lbMyRank");
    const myRankPos = document.getElementById("lbMyRankPos");
    const myRankTime = document.getElementById("lbMyRankTime");
    const myIndex = data.findIndex((e) => e.uid === myUid);
    if (myIndex >= 0 && myRankEl) {
      myRankEl.style.display = "flex";
      myRankPos.textContent = `#${myIndex + 1}`;
      myRankTime.textContent = _lbFormatTime(data[myIndex].totalSeconds || 0);
    } else if (myRankEl) {
      myRankEl.style.display = "none";
    }

    const medals = ["🥇", "🥈", "🥉"];
    const top = data[0].totalSeconds || 1;
    container.innerHTML = data
      .map((entry, i) => {
        const isMe = entry.uid === myUid;
        const rank = i + 1;
        const medal =
          i < 3 ? medals[i] : `<span class="lb-rank-num">${rank}</span>`;
        const pct = Math.round((entry.totalSeconds / top) * 100);
        return `
      <div class="lb-row${isMe ? " lb-row-me" : ""}">
        <div class="lb-row-left">
          <div class="lb-medal">${medal}</div>
          <div class="lb-avatar" style="background:${entry.color || "#e8622a"}">${entry.badge || "🎬"}</div>
          <div class="lb-info">
            <div class="lb-name">${entry.name || "Anonymous"}${isMe ? ' <span class="lb-you-tag">You</span>' : ""}</div>
            <div class="lb-bar-wrap"><div class="lb-bar" style="width:${pct}%;background:${entry.color || "#e8622a"}"></div></div>
          </div>
        </div>
        <div class="lb-time">${_lbFormatTime(entry.totalSeconds || 0)}</div>
      </div>`;
      })
      .join("");
  }

  function openLeaderboard() {
    const modal = document.getElementById("leaderboardModal");
    if (!modal) return;
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    if (_lbUnlisten) {
      _lbUnlisten();
      _lbUnlisten = null;
    }

    if (!window.FirebaseLeaderboard) {
      document.getElementById("lbList").innerHTML =
        '<div class="lb-loading">Loading…</div>';
      // Retry every 300ms until Firebase is ready
      const retry = setInterval(() => {
        if (window.FirebaseLeaderboard) {
          clearInterval(retry);
          _lbUnlisten = window.FirebaseLeaderboard.listen((data) => {
            _lbAllData = data;
            _lbRenderList(data);
          }, 50);
        }
      }, 300);
      return;
    }
    _lbUnlisten = window.FirebaseLeaderboard.listen((data) => {
      _lbAllData = data;
      _lbRenderList(data);
    }, 50);
  }

  function closeLeaderboard() {
    const modal = document.getElementById("leaderboardModal");
    if (!modal) return;
    modal.classList.remove("open");
    document.body.style.overflow = "";
    if (_lbUnlisten) {
      _lbUnlisten();
      _lbUnlisten = null;
    }
  }

  function switchLbTab(tab, btn) {
    _lbTab = tab;
    document
      .querySelectorAll(".lb-tab")
      .forEach((b) => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
    const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
    const filtered =
      tab === "week"
        ? _lbAllData.filter((e) => (e.updatedAt || 0) >= weekAgo)
        : _lbAllData;
    _lbRenderList(filtered.length ? filtered : _lbAllData);
  }

  _lbStartTracking();
  window.openLeaderboard = openLeaderboard;
  window.closeLeaderboard = closeLeaderboard;
  window.switchLbTab = switchLbTab;

  /* =========================================================
   ===== APP INITIALISATION =====
   Called once Firebase cache is hydrated.
========================================================= */

  // Restore theme
  (function restoreTheme() {
    const saved = FirebaseDB.getItem("sv_theme");
    if (saved === "light") document.body.classList.add("light-mode");
  })();

  // Restore notifications badge
  (function restoreNotifBadge() {
    const badge = document.getElementById("notifBadge");
    if (badge && notifications.length > 0) {
      badge.style.display = "flex";
      badge.textContent = Math.min(notifications.length, 9);
    }
  })();

  // Initial render — load catalog from TMDB then boot the UI
  initTheme();
  showToast("⏳ Loading catalog…");

  window
    ._loadCatalog()
    .then(({ movies, series }) => {
      catalogMovies = movies;
      catalogSeries = series;
      allContent = [...movies, ...series];

      filterGenre("All", null);
      renderContinueWatching();
      updateWatchlistUI();
      renderRecommendations();
      handleDailyLogin();
      initProfile();

      showToast("☁️ " + allContent.length + " titles loaded");

      // ── Deep-link: open shared movie/series from URL params ──
      // Must run here, after allContent is populated.
      (function handleSharedDeepLink() {
        const params = new URLSearchParams(window.location.search);
        const sharedId = params.get("id");
        const sharedType = params.get("type");
        if (sharedId && sharedType) {
          const sharedItem = allContent.find(
            (i) => String(i.tmdbId) === sharedId && i.type === sharedType,
          );
          if (sharedItem) setTimeout(() => openContent(sharedItem), 400);
        }
      })();
    })
    .catch(() => {
      // Graceful fallback: catalog empty but UI still boots
      filterGenre("All", null);
      renderContinueWatching();
      updateWatchlistUI();
      renderRecommendations();
      handleDailyLogin();
      initProfile();
      showToast("⚠️ Could not load catalog — check connection");
    });

  // ─── Expose all functions to global window scope ─────────────────────────────
  // Required because this code runs inside window._svAppReady (a function scope),
  // so inline onclick="..." attributes cannot find these functions without this bridge.
  window.handleDailyLogin = handleDailyLogin;
  window.initProfile = initProfile;
  window.updateNavAvatar = updateNavAvatar;
  window.renameUser = renameUser;
  window.openProfileModal = openProfileModal;
  window.closeProfileModal = closeProfileModal;
  window.selectBadge = selectBadge;
  window.selectColor = selectColor;
  window.triggerAvatarUpload = triggerAvatarUpload;
  window.handleAvatarUpload = handleAvatarUpload;
  window.saveProfile = saveProfile;
  window.submitComment = submitComment;
  window.deleteComment = deleteComment;
  window.shareContent = shareContent;
  window.toggleCompleted = toggleCompleted;
  window.setSortMode = setSortMode;
  window.showToast = showToast;
  window.wishlistCardClick = wishlistCardClick;
  window.toggleWatchlist = toggleWatchlist;
  window.removeFromWatchlistByIndex = removeFromWatchlistByIndex;
  window.openRandom = openRandom;
  window.openContent = openContent;
  window.playTrailer = playTrailer;
  window.closeDetail = closeDetail;
  window.closePlayer = closePlayer;
  window.closeAll = closeAll;
  window.overlayClick = overlayClick;
  window.detailOverlayClick = detailOverlayClick;
  window.playNow = playNow;
  window.playEpisodeFromDetail = playEpisodeFromDetail;
  window.switchSource = switchSource;
  window.openFullPage = openFullPage;
  window.switchSeason = switchSeason;
  window.clearSearch = clearSearch;
  window.handleSearch = handleSearch;
  window.openFromSearch = openFromSearch;
  window.toggleTheme = toggleTheme;
  window.filterGenre = filterGenre;
  window.setMood = setMood;
  window.setUserRating = setUserRating;
  window.clearNotifs = clearNotifs;
  window.toggleNotifPanel = toggleNotifPanel;
  window.switchWlTab = switchWlTab;
  window.removeFromMultiWl = removeFromMultiWl;
  window.moveToWlTab = moveToWlTab;
  window.closeMiniPlayer = closeMiniPlayer;
  window.expandMiniPlayer = expandMiniPlayer;
  window.openSeeAll = openSeeAll;
  window.closeSeeAll = closeSeeAll;
  window.quickFilter = quickFilter;
  window.setActive = setActive;
  window.setBottomActive = setBottomActive;
  window.toggleTheaterMode = toggleTheaterMode;
  window.navigateEpisode = navigateEpisode;
  window.setViewMode = setViewMode;
  window.resumeContent = resumeContent;
  window.removeCW = removeCW;
  window.clearAllCW = clearAllCW;
  window.roulettePlay = roulettePlay;
  window.closeRoulette = closeRoulette;
  window.openIMDb = openIMDb;
  window.toggleMobileDrawer = toggleMobileDrawer;
  window.closeMobileDrawer = closeMobileDrawer;
  window.openKbHelp = openKbHelp;
  window.closeKbHelp = closeKbHelp;
  window.openStopAdsModal = openStopAdsModal;
  window.closeStopAdsModal = closeStopAdsModal;
  window.switchStopAdsTab = switchStopAdsTab;
  window.closeTrailerOverlay = closeTrailerOverlay;
  window.openPinOverlay = openPinOverlay;
  window.closePinOverlay = closePinOverlay;
  window.pinPress = pinPress;
  window.pinClear = pinClear;
  window.toggleParentalLock = toggleParentalLock;
  window.setPlaybackSpeed = setPlaybackSpeed;
  window.wtHost = wtHost;
  window.wtJoin = wtJoin;
  window.wtGuestLeave = wtGuestLeave;
  window.wtHostPlay = wtHostPlay;
  window.wtHostPause = wtHostPause;
  window.wtEndSession = wtEndSession;
  window.wtCopyLink = wtCopyLink;
  window.wtLeave = wtLeave;
  window.openWatchTogetherModal = openWatchTogetherModal;
  window.closeWatchTogetherModal = closeWatchTogetherModal;
  window.wtJoinFromInput = wtJoinFromInput;
  window.closeWatchTogether = closeWatchTogether;
  window.openSleepTimerModal = openSleepTimerModal;
  window.closeSleepTimerModal = closeSleepTimerModal;
  window.confirmSleepTimer = confirmSleepTimer;
  window.confirmSleepTimerCustom = confirmSleepTimerCustom;
  window.startSleepTimer = startSleepTimer;
  window.stopAllPlayback = stopAllPlayback;
  window.cancelSleepTimer = cancelSleepTimer;
  window.openCalendarModal = openCalendarModal;
  window.closeCalendarModal = closeCalendarModal;
  window.calPrev = calPrev;
  window.calNext = calNext;
  window.toggleReaction = toggleReaction;
  window.openCollections = openCollections;
  window.closeCollections = closeCollections;
  window.createCollection = createCollection;
  window.closeCollNameModal = closeCollNameModal;
  window.confirmCreateCollection = confirmCreateCollection;
  window.deleteCollection = deleteCollection;
  window.addToCollection = addToCollection;
  window.closePickCollModal = closePickCollModal;
  window.pickCollection = pickCollection;
  window.toggleFocusMode = toggleFocusMode;
  window.toggleWishlistDetail = toggleWishlistDetail;
  window.openEarnModal = openEarnModal;
  window.closeEarnModal = closeEarnModal;
  window.openStatsModal = openStatsModal;
  window.closeStatsModal = closeStatsModal;
  window.openAchievements = openAchievements;
  window.closeAchievements = closeAchievements;

  // Close wrapper
  /* =========================================
   ===== WEEKLY WATCH CHALLENGE =====
========================================== */

  // ── Firebase path: challenges/current (written every Monday) ──
  // Shape: { title, description, genre, type, count, weekId, badge, badgeLabel }

  const WC = {
    _unsubscribe: null,
    _challenge: null,
    _completedThisWeek: [], // keys of items completed this week matching genre/type
    _awarded: false,

    // Monday-based ISO week key: "2025-W18"
    weekId() {
      const d = new Date();
      const day = d.getDay() || 7; // Mon=1…Sun=7
      d.setDate(d.getDate() + 1 - day); // move to Monday
      const jan4 = new Date(d.getFullYear(), 0, 4);
      const week = Math.ceil(((d - jan4) / 86400000 + jan4.getDay() + 1) / 7);
      return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
    },

    // Load current challenge from Firebase and listen for updates
    init() {
      const { getDatabase, ref, onValue } = window._firebaseRTDB;
      const db = getDatabase();
      const r = ref(db, "challenges/current");
      this._unsubscribe = onValue(r, (snap) => {
        if (!snap.exists()) {
          this._challenge = null;
          this._renderBanner();
          return;
        }
        this._challenge = snap.val();
        this._syncProgress();
        this._renderBanner();
        this._renderModal();
      });
      // Auto-write challenge every Monday (first user on Monday triggers it)
      this._maybeWriteMonday();
    },

    // Auto-write: if it's Monday and stored weekId !== current weekId, generate & write
    async _maybeWriteMonday() {
      const today = new Date();
      const isMonday = today.getDay() === 1;
      if (!isMonday) return;
      const currentWeekId = this.weekId();
      const { getDatabase, ref, get, set } = window._firebaseRTDB;
      const db = getDatabase();
      const snap = await get(ref(db, "challenges/current"));
      if (snap.exists() && snap.val().weekId === currentWeekId) return; // already written
      // Pick a challenge from the rotation
      const challenges = [
        {
          title: "Thrill Seeker",
          description: "Watch 3 Thrillers this week",
          genre: "Thriller",
          type: "any",
          count: 3,
          badge: "🔪",
          badgeLabel: "Thrill Seeker",
        },
        {
          title: "Sci-Fi Explorer",
          description: "Watch 2 Sci-Fi titles this week",
          genre: "Sci-Fi",
          type: "any",
          count: 2,
          badge: "🚀",
          badgeLabel: "Sci-Fi Explorer",
        },
        {
          title: "Horror Night",
          description: "Watch 2 Horror films this week",
          genre: "Horror",
          type: "movie",
          count: 2,
          badge: "👻",
          badgeLabel: "Horror Night Survivor",
        },
        {
          title: "Drama Devotee",
          description: "Watch 3 Drama titles this week",
          genre: "Drama",
          type: "any",
          count: 3,
          badge: "🎭",
          badgeLabel: "Drama Devotee",
        },
        {
          title: "Comedy Club",
          description: "Watch 3 Comedies this week",
          genre: "Comedy",
          type: "any",
          count: 3,
          badge: "😂",
          badgeLabel: "Comedy Club Member",
        },
        {
          title: "Crime Boss",
          description: "Watch 2 Crime titles this week",
          genre: "Crime",
          type: "any",
          count: 2,
          badge: "🕵️",
          badgeLabel: "Crime Boss",
        },
        {
          title: "Action Hero",
          description: "Watch 3 Action titles this week",
          genre: "Action",
          type: "any",
          count: 3,
          badge: "💥",
          badgeLabel: "Action Hero",
        },
        {
          title: "Animation Fan",
          description: "Watch 2 Animation titles this week",
          genre: "Animation",
          type: "any",
          count: 2,
          badge: "🎨",
          badgeLabel: "Animation Fan",
        },
      ];
      // Pick based on week number so it's deterministic for everyone
      const weekNum = parseInt(currentWeekId.split("W")[1], 10);
      const pick = challenges[weekNum % challenges.length];
      pick.weekId = currentWeekId;
      pick.createdAt = Date.now();
      await set(ref(db, "challenges/current"), pick);
    },

    // Compare completed content against the challenge
    _syncProgress() {
      if (!this._challenge) return;
      const { genre, type, weekId, count } = this._challenge;
      // Load completed items
      let completed = {};
      try {
        completed = JSON.parse(FirebaseDB.getItem("sv_completed") || "{}");
      } catch {}
      // Load when each item was completed (stored in sv_completed_ts)
      let ts = {};
      try {
        ts = JSON.parse(FirebaseDB.getItem("sv_completed_ts") || "{}");
      } catch {}

      // We need to know which items were completed THIS week
      const weekStart = this._weekStart();
      const weekEnd = weekStart + 7 * 86400000;

      // Get all content catalogue to check genres
      const allContent = window._allContent || [];
      const contentMap = {};
      allContent.forEach((i) => {
        contentMap[i.type + "_" + i.tmdbId] = i;
      });

      this._completedThisWeek = Object.keys(completed).filter((key) => {
        if (!completed[key]) return false;
        const completedAt = ts[key] || 0;
        if (completedAt < weekStart || completedAt > weekEnd) return false;
        const item = contentMap[key];
        if (!item) return false;
        if (type !== "any" && item.type !== type) return false;
        if (genre && !(item.genres || []).includes(genre)) return false;
        return true;
      });

      const done = this._completedThisWeek.length;
      const goal = count || 3;

      if (done >= goal && weekId === this.weekId()) {
        this._tryAwardBadge();
      }
      return { done, goal };
    },

    _weekStart() {
      const d = new Date();
      const day = d.getDay() || 7;
      d.setDate(d.getDate() + 1 - day);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    },

    async _tryAwardBadge() {
      if (this._awarded) return;
      const awardedKey = "sv_challenge_awarded_" + this._challenge.weekId;
      if (FirebaseDB.getItem(awardedKey)) return;
      this._awarded = true;
      FirebaseDB.setItem(awardedKey, "1");

      // Write badge to profile
      const badge = this._challenge.badge || "⭐";
      const badgeLabel = this._challenge.badgeLabel || "Challenge Winner";
      const profile = window._svProfile || {};
      const earned = profile.earnedBadges || [];
      if (!earned.find((b) => b.weekId === this._challenge.weekId)) {
        earned.push({
          badge,
          label: badgeLabel,
          weekId: this._challenge.weekId,
          awardedAt: Date.now(),
        });
        profile.earnedBadges = earned;
        window._svProfile = profile;
        if (window.FirebaseProfile) await window.FirebaseProfile.save(profile);
      }

      // Toast + update modal
      setTimeout(() => {
        if (typeof showToast === "function")
          showToast(
            `🏆 Challenge Complete! Badge earned: ${badge} ${badgeLabel}`,
          );
      }, 400);
      this._renderModal();
      this._renderBanner();
    },

    // Render the floating banner on the homepage
    _renderBanner() {
      let banner = document.getElementById("weeklyChallengeHomeBanner");
      if (!banner) return;
      if (!this._challenge) {
        banner.style.display = "none";
        return;
      }
      const { done, goal } = this._syncProgress() || {
        done: 0,
        goal: this._challenge.count || 3,
      };
      const pct = Math.min(100, Math.round((done / goal) * 100));
      const awardedKey = "sv_challenge_awarded_" + this._challenge.weekId;
      const isComplete = !!FirebaseDB.getItem(awardedKey);

      // Update dot
      const dot = document.getElementById("weeklyChallengeDot");
      if (dot) dot.style.display = !isComplete ? "inline-block" : "none";

      banner.style.display = "";
      banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;cursor:pointer" onclick="openWeeklyChallenge()">
        <span style="font-size:1.5rem">${this._challenge.badge || "⭐"}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);margin-bottom:2px">Weekly Challenge</div>
          <div style="font-size:13px;font-weight:600;color:var(--fg);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${this._challenge.description}</div>
          <div style="margin-top:6px;height:4px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${isComplete ? "#4caf50" : "var(--accent)"};border-radius:999px;transition:width .4s ease"></div>
          </div>
          <div style="font-size:11px;color:var(--muted);margin-top:4px">${isComplete ? "✅ Completed! Badge earned" : `${done} / ${goal} completed`}</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--muted);flex-shrink:0"><polyline points="9 18 15 12 9 6"/></svg>
      </div>`;
    },

    _renderModal() {
      const body = document.getElementById("weeklyChallengeBody");
      if (!body) return;
      if (!this._challenge) {
        body.innerHTML =
          '<p style="color:var(--muted);text-align:center;padding:32px 0">No challenge active this week. Check back Monday!</p>';
        return;
      }

      const { done, goal } = this._syncProgress() || {
        done: 0,
        goal: this._challenge.count || 3,
      };
      const pct = Math.min(100, Math.round((done / goal) * 100));
      const awardedKey = "sv_challenge_awarded_" + this._challenge.weekId;
      const isComplete = !!FirebaseDB.getItem(awardedKey);

      // Days left in week
      const now = Date.now();
      const weekEnd = this._weekStart() + 7 * 86400000;
      const daysLeft = Math.max(0, Math.ceil((weekEnd - now) / 86400000));

      // Matching completed items
      const allContent = window._allContent || [];
      const contentMap = {};
      allContent.forEach((i) => {
        contentMap[i.type + "_" + i.tmdbId] = i;
      });
      const completedItems = this._completedThisWeek
        .map((k) => contentMap[k])
        .filter(Boolean);

      // Earned badges from profile
      const earnedBadges =
        (window._svProfile && window._svProfile.earnedBadges) || [];

      body.innerHTML = `
      <!-- Hero -->
      <div style="text-align:center;padding:8px 0 20px">
        <div style="font-size:3.5rem;margin-bottom:8px;filter:drop-shadow(0 0 16px rgba(232,98,42,.5))">${this._challenge.badge || "⭐"}</div>
        <div style="font-size:1.2rem;font-weight:800;color:var(--fg);margin-bottom:4px">${this._challenge.title}</div>
        <div style="font-size:14px;color:var(--muted)">${this._challenge.description}</div>
        ${this._challenge.genre ? `<div style="display:inline-block;margin-top:8px;padding:3px 12px;border-radius:999px;background:rgba(232,98,42,.15);color:var(--accent);font-size:11px;font-weight:700;letter-spacing:.06em">${this._challenge.genre.toUpperCase()}</div>` : ""}
      </div>

      <!-- Progress ring area -->
      <div style="display:flex;align-items:center;gap:16px;padding:16px;background:var(--card);border-radius:14px;margin-bottom:16px">
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="7"/>
          <circle cx="36" cy="36" r="30" fill="none" stroke="${isComplete ? "#4caf50" : "var(--accent)"}" stroke-width="7"
            stroke-dasharray="${Math.round(2 * Math.PI * 30)}"
            stroke-dashoffset="${Math.round(2 * Math.PI * 30 * (1 - pct / 100))}"
            stroke-linecap="round"
            transform="rotate(-90 36 36)"
            style="transition:stroke-dashoffset .6s cubic-bezier(.4,0,.2,1)"/>
          <text x="36" y="40" text-anchor="middle" font-family="Outfit,sans-serif" font-size="14" font-weight="800" fill="${isComplete ? "#4caf50" : "var(--fg)"}">${done}/${goal}</text>
        </svg>
        <div style="flex:1">
          ${
            isComplete
              ? `<div style="font-weight:700;color:#4caf50;font-size:15px">🏆 Challenge Complete!</div>
               <div style="font-size:12px;color:var(--muted);margin-top:2px">Badge awarded: ${this._challenge.badge} ${this._challenge.badgeLabel}</div>`
              : `<div style="font-weight:700;color:var(--fg);font-size:15px">${goal - done} more to go!</div>
               <div style="font-size:12px;color:var(--muted);margin-top:2px">${daysLeft} day${daysLeft !== 1 ? "s" : ""} left this week</div>`
          }
          <div style="margin-top:10px;height:5px;background:rgba(255,255,255,.06);border-radius:999px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${isComplete ? "#4caf50" : "linear-gradient(90deg,var(--accent),#f59060)"};border-radius:999px;transition:width .5s ease"></div>
          </div>
        </div>
      </div>

      <!-- Completed matching items -->
      ${
        completedItems.length > 0
          ? `
        <div style="margin-bottom:16px">
          <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:8px">Counted This Week</div>
          ${completedItems
            .map(
              (item) => `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--card);border-radius:10px;margin-bottom:6px">
              <span style="font-size:1.1rem">✅</span>
              <div style="flex:1;font-size:13px;font-weight:600;color:var(--fg)">${item.title}</div>
              <div style="font-size:11px;color:var(--muted)">${item.type === "tv" ? "Series" : "Movie"}</div>
            </div>`,
            )
            .join("")}
        </div>`
          : ""
      }

      <!-- Tip -->
      ${
        !isComplete
          ? `
        <div style="padding:12px;background:rgba(232,98,42,.08);border:1px solid rgba(232,98,42,.2);border-radius:10px;font-size:12px;color:var(--muted);line-height:1.6">
          💡 Mark any <strong style="color:var(--accent)">${this._challenge.genre}</strong> title as ✓ Done in its detail view to count towards this challenge.
        </div>`
          : ""
      }

      <!-- All earned badges -->
      ${
        earnedBadges.length > 0
          ? `
        <div style="margin-top:20px">
          <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:10px">Your Challenge Badges</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${earnedBadges
              .map(
                (b) => `
              <div style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:var(--card);border-radius:999px;border:1px solid rgba(255,255,255,.07)">
                <span>${b.badge}</span>
                <span style="font-size:11px;font-weight:600;color:var(--fg)">${b.label}</span>
              </div>`,
              )
              .join("")}
          </div>
        </div>`
          : ""
      }
    `;
    },

    open() {
      this._renderModal();
      const m = document.getElementById("weeklyChallengeModal");
      if (m) {
        m.style.display = "flex";
        setTimeout(() => m.classList.add("open"), 10);
      }
    },

    close() {
      const m = document.getElementById("weeklyChallengeModal");
      if (m) {
        m.classList.remove("open");
        setTimeout(() => (m.style.display = "none"), 200);
      }
    },

    // Called whenever user marks something as completed — patch timestamp then re-sync
    onComplete(key, isAdding) {
      let ts = {};
      try {
        ts = JSON.parse(FirebaseDB.getItem("sv_completed_ts") || "{}");
      } catch {}
      if (isAdding) ts[key] = Date.now();
      else delete ts[key];
      FirebaseDB.setItem("sv_completed_ts", JSON.stringify(ts));
      this._syncProgress();
      this._renderBanner();
      this._renderModal();
    },
  };

  window.openWeeklyChallenge = () => WC.open();
  window.closeWeeklyChallenge = () => WC.close();

  // Patch toggleCompleted to notify WC
  const _origToggleCompleted = toggleCompleted;
  window.toggleCompleted = function () {
    _origToggleCompleted();
    if (currentItem) {
      const key = currentItem.type + "_" + currentItem.tmdbId;
      const isNowDone = !!JSON.parse(
        FirebaseDB.getItem("sv_completed") || "{}",
      )[key];
      WC.onComplete(key, isNowDone);
    }
  };

  // Init WC after short delay so _allContent is populated
  setTimeout(() => WC.init(), 800);

  /* ── expose for window globals ── */
  window.WC = WC;

  // ═══════════════════════════════════════════════════════════════
  //  RELEASE NOTIFICATIONS — checks TMDB daily for new content
  // ═══════════════════════════════════════════════════════════════
  (function initReleaseNotifs() {
    const TMDB_KEY = "8265bd1679663a7ea12ac168da84d2e8";
    const BASE = "https://api.themoviedb.org/3";
    const STORE_KEY = "sv_release_notifs_seen";
    const CHECK_KEY = "sv_release_notifs_lastcheck";

    // Only check once per day
    const lastCheck = parseInt(FirebaseDB.getItem(CHECK_KEY) || "0", 10);
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    if (now - lastCheck < ONE_DAY) return;

    // Load already-seen IDs so we don't notify twice
    let seenIds = new Set(JSON.parse(FirebaseDB.getItem(STORE_KEY) || "[]"));

    async function fetchJSON(url) {
      try {
        const r = await fetch(url);
        return r.ok ? r.json() : null;
      } catch {
        return null;
      }
    }

    function todayStr() {
      return new Date().toISOString().slice(0, 10);
    }

    function weekAgoStr() {
      const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return d.toISOString().slice(0, 10);
    }

    async function checkNewMoviesInTheaters() {
      const data = await fetchJSON(
        `${BASE}/movie/now_playing?api_key=${TMDB_KEY}&language=en-US&page=1`,
      );
      if (!data?.results) return [];
      return data.results
        .filter((m) => !seenIds.has("movie_" + m.id))
        .slice(0, 3)
        .map((m) => ({
          id: "movie_" + m.id,
          html: `🎬 Now in theaters: <strong>${m.title}</strong> (${(m.release_date || "").slice(0, 4)})`,
        }));
    }

    async function checkNewMoviesStreaming() {
      const data = await fetchJSON(
        `${BASE}/discover/movie?api_key=${TMDB_KEY}&language=en-US&sort_by=primary_release_date.desc` +
          `&primary_release_date.gte=${weekAgoStr()}&primary_release_date.lte=${todayStr()}&page=1`,
      );
      if (!data?.results) return [];
      return data.results
        .filter((m) => !seenIds.has("stream_movie_" + m.id))
        .slice(0, 3)
        .map((m) => ({
          id: "stream_movie_" + m.id,
          html: `🍿 New on streaming: <strong>${m.title}</strong> (${(m.release_date || "").slice(0, 4)})`,
        }));
    }

    async function checkNewTVEpisodes() {
      const data = await fetchJSON(
        `${BASE}/tv/on_the_air?api_key=${TMDB_KEY}&language=en-US&page=1`,
      );
      if (!data?.results) return [];
      return data.results
        .filter((t) => !seenIds.has("tv_" + t.id))
        .slice(0, 3)
        .map((t) => ({
          id: "tv_" + t.id,
          html: `📺 New episodes airing: <strong>${t.name}</strong>`,
        }));
    }

    async function run() {
      const [theaters, streaming, tv] = await Promise.all([
        checkNewMoviesInTheaters(),
        checkNewMoviesStreaming(),
        checkNewTVEpisodes(),
      ]);

      const allNew = [...theaters, ...streaming, ...tv];
      if (!allNew.length) {
        FirebaseDB.setItem(CHECK_KEY, String(now));
        return;
      }

      // Add notifications — max 5 total to avoid flooding
      allNew.slice(0, 5).forEach((item) => {
        addNotif(item.html);
        seenIds.add(item.id);
      });

      // Persist seen IDs (keep last 200 to avoid bloat)
      const seenArr = [...seenIds].slice(-200);
      FirebaseDB.setItem(STORE_KEY, JSON.stringify(seenArr));
      FirebaseDB.setItem(CHECK_KEY, String(now));
    }

    // Run after a short delay so the app is fully loaded
    setTimeout(run, 3000);
  })();

  // ═══════════════════════════════════════════════════════════════
  //  🔔 WATCHLIST RELEASE ALERTS
  //  Checks TMDB once per day for each item in the user's watchlist:
  //  • TV shows  → new season or new episode aired recently
  //  • Movies    → upcoming release date set or now released
  //  Fires addNotif() for any updates not yet seen.
  // ═══════════════════════════════════════════════════════════════
  (function initWatchlistReleaseAlerts() {
    const TMDB_KEY = "8265bd1679663a7ea12ac168da84d2e8";
    const BASE = "https://api.themoviedb.org/3";
    const SEEN_KEY = "sv_wl_alert_seen"; // set of "type_id_descriptor" already notified
    const CHECK_KEY = "sv_wl_alert_check"; // last check timestamp
    const ONE_DAY = 24 * 60 * 60 * 1000;

    // Throttle: once per day per session
    const lastCheck = parseInt(FirebaseDB.getItem(CHECK_KEY) || "0", 10);
    if (Date.now() - lastCheck < ONE_DAY) return;

    // Collect all watchlisted items (multi-tab + legacy)
    function getWatchlistItems() {
      try {
        const mwl = JSON.parse(
          FirebaseDB.getItem("sv_mwl") || '{"want":[],"watching":[],"done":[]}',
        );
        const all = [
          ...(mwl.want || []),
          ...(mwl.watching || []),
          ...(mwl.done || []),
        ];
        // Deduplicate
        const seen = new Set();
        return all.filter((i) => {
          const k = i.type + "_" + i.tmdbId;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
      } catch {
        return [];
      }
    }

    async function fetchJSON(url) {
      try {
        const r = await fetch(url);
        return r.ok ? r.json() : null;
      } catch {
        return null;
      }
    }

    function todayStr() {
      return new Date().toISOString().slice(0, 10);
    }
    function daysAgo(n) {
      return new Date(Date.now() - n * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
    }
    function daysAhead(n) {
      return new Date(Date.now() + n * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
    }

    async function checkTVShow(item, seenIds) {
      const data = await fetchJSON(
        `${BASE}/tv/${item.tmdbId}?api_key=${TMDB_KEY}&language=en-US`,
      );
      if (!data) return [];
      const alerts = [];

      // New season dropped
      const seasons = data.number_of_seasons || 0;
      const knownSeasons = parseInt(
        FirebaseDB.getItem("sv_wl_seasons_" + item.tmdbId) || "0",
      );
      if (seasons > knownSeasons && knownSeasons > 0) {
        const alertKey = `tv_${item.tmdbId}_season${seasons}`;
        if (!seenIds.has(alertKey)) {
          alerts.push({
            key: alertKey,
            html: `🎉 <strong>${item.title}</strong> — Season ${seasons} is now available!`,
          });
        }
      }
      // Always persist current season count
      FirebaseDB.setItem("sv_wl_seasons_" + item.tmdbId, String(seasons));

      // Next episode airing soon (within 7 days)
      if (data.next_episode_to_air) {
        const ep = data.next_episode_to_air;
        const airDate = ep.air_date || "";
        const alertKey = `tv_${item.tmdbId}_ep_${ep.season_number}_${ep.episode_number}`;
        if (
          airDate >= todayStr() &&
          airDate <= daysAhead(7) &&
          !seenIds.has(alertKey)
        ) {
          alerts.push({
            key: alertKey,
            html: `📅 <strong>${item.title}</strong> — S${ep.season_number}E${ep.episode_number} airs on ${airDate}`,
          });
        }
      }

      // Last episode aired recently (within 3 days)
      if (data.last_episode_to_air) {
        const ep = data.last_episode_to_air;
        const airDate = ep.air_date || "";
        const alertKey = `tv_${item.tmdbId}_aired_${ep.season_number}_${ep.episode_number}`;
        if (
          airDate >= daysAgo(3) &&
          airDate <= todayStr() &&
          !seenIds.has(alertKey)
        ) {
          alerts.push({
            key: alertKey,
            html: `📺 <strong>${item.title}</strong> — S${ep.season_number}E${ep.episode_number} just aired!`,
          });
        }
      }

      return alerts;
    }

    async function checkMovie(item, seenIds) {
      const data = await fetchJSON(
        `${BASE}/movie/${item.tmdbId}?api_key=${TMDB_KEY}&language=en-US`,
      );
      if (!data) return [];
      const alerts = [];
      const releaseDate = data.release_date || "";

      // Coming out very soon (within 7 days)
      if (releaseDate >= todayStr() && releaseDate <= daysAhead(7)) {
        const alertKey = `movie_${item.tmdbId}_soon`;
        if (!seenIds.has(alertKey)) {
          alerts.push({
            key: alertKey,
            html: `🎬 <strong>${item.title}</strong> — releasing on ${releaseDate}! It's in your watchlist.`,
          });
        }
      }

      // Just released (within 3 days)
      if (releaseDate >= daysAgo(3) && releaseDate < todayStr()) {
        const alertKey = `movie_${item.tmdbId}_released`;
        if (!seenIds.has(alertKey)) {
          alerts.push({
            key: alertKey,
            html: `🍿 <strong>${item.title}</strong> just released (${releaseDate}) — it's in your watchlist!`,
          });
        }
      }

      return alerts;
    }

    async function run() {
      const items = getWatchlistItems();
      if (!items.length) return;

      let seenIds;
      try {
        seenIds = new Set(JSON.parse(FirebaseDB.getItem(SEEN_KEY) || "[]"));
      } catch {
        seenIds = new Set();
      }

      const allAlerts = [];

      // Check in batches of 5 to avoid rate-limiting
      for (let i = 0; i < items.length; i += 5) {
        const batch = items.slice(i, i + 5);
        const results = await Promise.all(
          batch.map((item) =>
            item.type === "tv"
              ? checkTVShow(item, seenIds)
              : checkMovie(item, seenIds),
          ),
        );
        results.forEach((r) => allAlerts.push(...r));
        // Small pause between batches
        if (i + 5 < items.length) await new Promise((r) => setTimeout(r, 400));
      }

      // Fire notifications (max 5 to avoid flooding)
      allAlerts.slice(0, 5).forEach((alert) => {
        addNotif(alert.html);
        seenIds.add(alert.key);
      });

      // Persist seen keys (cap at 500)
      const seenArr = [...seenIds].slice(-500);
      FirebaseDB.setItem(SEEN_KEY, JSON.stringify(seenArr));
      FirebaseDB.setItem(CHECK_KEY, String(Date.now()));
    }

    // Run 4 seconds after app boot so catalog + watchlist are loaded
    setTimeout(run, 4000);
  })();
}; // end _svAppReady

// If hydration already finished before this script ran, call immediately
if (window._svAppReadyPending) {
  window._svAppReadyPending = false;
  window._svAppReady();
}
