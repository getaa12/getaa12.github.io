/* ═══════════════════════════════════════════════════════
   SVP POINTS SYSTEM
   Keys: sv_points (total), sv_pts_cooldown (last ad ts)
   Earn: +10 watch ad, +5 daily login, +2 mark watched,
         +1 rate, +3 share
═══════════════════════════════════════════════════════ */

var SVP_AD_URL = "https://ampleagency.com/key=623f28f43f36fedd521226d0964cfdf8";
var SVP_AD_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes between ads

function _svpGetPoints() {
  try {
    return parseInt(FirebaseDB.getItem("sv_points") || "0", 10) || 0;
  } catch (e) {
    return 0;
  }
}

function _svpAddPoints(n, reason) {
  if (window.SV_GUEST) return; // guests can't earn points
  try {
    var total = _svpGetPoints() + n;
    FirebaseDB.setItem("sv_points", String(total));
    _svpUpdateUI(total);
    if (typeof showToast === "function") {
      showToast("⭐ +" + n + " pts — " + reason + " · Total: " + total);
    }
  } catch (e) {}
}

function _svpUpdateUI(pts) {
  pts = pts !== undefined ? pts : _svpGetPoints();
  var nav = document.getElementById("navPointsDisplay");
  if (nav) nav.textContent = pts + " pts";
  var modal = document.getElementById("pointsModalBalance");
  if (modal) modal.textContent = pts;
}

function _svpCooldownLeft() {
  try {
    var last = parseInt(FirebaseDB.getItem("sv_pts_cooldown") || "0", 10);
    var diff = Date.now() - last;
    return Math.max(0, SVP_AD_COOLDOWN_MS - diff);
  } catch (e) {
    return 0;
  }
}

window.earnPoints = function () {
  if (window.SV_GUEST) {
    if (window._requireAuth) window._requireAuth("Earning points");
    return;
  }
  var cooldown = _svpCooldownLeft();
  if (cooldown > 0) {
    var mins = Math.ceil(cooldown / 60000);
    if (typeof showToast === "function") {
      showToast("⏳ Please wait " + mins + " min before watching another ad.");
    }
    _svpUpdateCooldownMsg();
    return;
  }
  // Open ad in new tab
  window.open(SVP_AD_URL, "_blank", "noopener");
  // Record cooldown & award points after 5s (enough time to open)
  FirebaseDB.setItem("sv_pts_cooldown", String(Date.now()));
  setTimeout(function () {
    _svpAddPoints(10, "Watched ad");
    _svpUpdateCooldownMsg();
  }, 5000);
};

function _svpUpdateCooldownMsg() {
  var el = document.getElementById("pointsCooldownMsg");
  var btn = document.getElementById("pointsModalEarnBtn");
  var navBtn = document.getElementById("earnPointsBtn");
  if (!el) return;
  var left = _svpCooldownLeft();
  if (left > 0) {
    var mins = Math.floor(left / 60000);
    var secs = Math.floor((left % 60000) / 1000);
    el.textContent = "Next ad available in " + mins + "m " + secs + "s";
    if (btn) {
      btn.style.opacity = "0.5";
      btn.style.cursor = "not-allowed";
    }
    if (navBtn) navBtn.style.opacity = "0.5";
  } else {
    el.textContent = "";
    if (btn) {
      btn.style.opacity = "1";
      btn.style.cursor = "pointer";
    }
    if (navBtn) navBtn.style.opacity = "1";
  }
}

window.openPointsModal = function () {
  _svpUpdateUI();
  _svpUpdateCooldownMsg();
  var m = document.getElementById("pointsModal");
  if (m) m.style.display = "flex";
  // Start live countdown
  window._svpCountdownInterval = setInterval(_svpUpdateCooldownMsg, 1000);
};

window.closePointsModal = function () {
  var m = document.getElementById("pointsModal");
  if (m) m.style.display = "none";
  clearInterval(window._svpCountdownInterval);
};

// Award points on other actions — called from inline.js events
window._svpAwardLogin = function () {
  _svpAddPoints(5, "Daily login");
};
window._svpAwardWatch = function () {
  _svpAddPoints(2, "Marked as watched");
};
window._svpAwardRate = function () {
  _svpAddPoints(1, "Rated a title");
};
window._svpAwardShare = function () {
  var SHARE_MAX_PER_DAY = 2;
  var MS_24H = 24 * 60 * 60 * 1000;
  try {
    var raw = FirebaseDB.getItem("sv_share_log");
    var log = raw ? JSON.parse(raw) : { count: 0, windowStart: Date.now() };
    var now = Date.now();
    // Reset window if 24h have passed
    if (now - log.windowStart >= MS_24H) {
      log = { count: 0, windowStart: now };
    }
    if (log.count >= SHARE_MAX_PER_DAY) {
      var msLeft = MS_24H - (now - log.windowStart);
      var hLeft = Math.ceil(msLeft / 3600000);
      if (typeof showToast === "function") {
        showToast("⏳ Share bonus maxed out — resets in " + hLeft + "h");
      }
      return;
    }
    log.count++;
    FirebaseDB.setItem("sv_share_log", JSON.stringify(log));
    _svpAddPoints(
      2,
      "Shared a title (" + log.count + "/" + SHARE_MAX_PER_DAY + " today)",
    );
  } catch (e) {
    _svpAddPoints(2, "Shared a title");
  }
};

// Init UI on load
document.addEventListener("DOMContentLoaded", function () {
  setTimeout(_svpUpdateUI, 1500);
});

/* ═══ END POINTS SYSTEM ═══ */
window.SV_GUEST = false;

// Safe FirebaseDB shim — used by guest mode when Firebase isn't initialised yet
function _ensureFirebaseDB() {
  if (!window.FirebaseDB) {
    window.FirebaseDB = {
      getItem: function (k) {
        try {
          return localStorage.getItem(k);
        } catch (e) {
          return null;
        }
      },
      setItem: function (k, v) {
        try {
          localStorage.setItem(k, v);
        } catch (e) {}
      },
      removeItem: function (k) {
        try {
          localStorage.removeItem(k);
        } catch (e) {}
      },
      key: function (i) {
        try {
          return localStorage.key(i);
        } catch (e) {
          return null;
        }
      },
      get length() {
        try {
          return localStorage.length;
        } catch (e) {
          return 0;
        }
      },
    };
  }
}

window.doGuestContinue = function () {
  window.SV_GUEST = true;
  _ensureFirebaseDB();
  var authScreen = document.getElementById("authScreen");
  if (authScreen) authScreen.style.display = "none";
  var banner = document.getElementById("guestBanner");
  if (banner) {
    banner.style.display = "flex";
  }
  var appRoot = document.getElementById("appRoot");
  if (appRoot && appRoot.style.display === "none") appRoot.style.display = "";

  // Trigger the main app boot — same thing firebase-config.js does after auth
  if (typeof window._svAppReady === "function") {
    window._svAppReady();
  } else {
    window._svAppReadyPending = true;
  }
};

window._requireAuth = function (actionLabel) {
  if (!window.SV_GUEST) return false;

  // Show a sign-in prompt modal
  var existing = document.getElementById("_guestAuthPrompt");
  if (existing) existing.remove();

  var modal = document.createElement("div");
  modal.id = "_guestAuthPrompt";
  modal.style.cssText =
    "position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,0.7);backdrop-filter:blur(6px)";
  modal.innerHTML = `
    <div style="background:#1a1a2e;border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:28px 24px;max-width:340px;width:100%;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,0.6)">
      <div style="font-size:36px;margin-bottom:12px">🔒</div>
      <div style="font-size:17px;font-weight:700;color:#fff;margin-bottom:8px">${actionLabel || "Sign in required"}</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.45);line-height:1.6;margin-bottom:22px">
        Create a free account to unlock watchlists, ratings, roulette, and more.
      </div>
      <button onclick="document.getElementById('_guestAuthPrompt').remove();document.getElementById('authScreen').style.display='flex';document.getElementById('guestBanner').style.display='none';"
        style="width:100%;background:#e8622a;color:#fff;border:none;padding:13px;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;margin-bottom:10px;font-family:inherit">
        Sign In / Create Account
      </button>
      <button onclick="document.getElementById('_guestAuthPrompt').remove();"
        style="width:100%;background:transparent;color:rgba(255,255,255,0.4);border:1px solid rgba(255,255,255,0.1);padding:11px;border-radius:10px;font-size:14px;cursor:pointer;font-family:inherit">
        Keep Browsing as Guest
      </button>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener("click", function (e) {
    if (e.target === modal) modal.remove();
  });
  return true;
};

// ── Global stubs: keep onclick handlers safe before Firebase auth is ready ──
// The real implementations are defined inside _svAppReady() and will
// overwrite these automatically once the user is authenticated.
(function () {
  var noop = function () {};
  var fns = [
    "toggleWatchlist",
    "openRandom",
    "closeDetail",
    "closeAll",
    "closePlayer",
    "detailOverlayClick",
    "overlayClick",
    "closeSeeAll",
    "toggleNotifPanel",
    "addNotif",
    "toggleTheme",
    "openProfileModal",
    "closeProfileModal",
    "openKbHelp",
    "closeKbHelp",
    "toggleMobileDrawer",
    "closeMobileDrawer",
    "setBottomActive",
    "filterGenre",
    "quickFilter",
    "setActive",
    "openCalendarModal",
    "closeCalendarModal",
    "toggleCompare",
    "closeCompare",
    "openCollections",
    "closeCollections",
    "toggleFocusMode",
    "openSleepTimerModal",
    "cancelSleepTimer",
    "toggleTheaterMode",
    "openContent",
    "resumeContent",
    "handleSearch",
    "clearSearch",
    "openFromSearch",
    "shareContent",
    "toggleCompleted",
    "setUserRating",
    "playNow",
    "playEpisodeFromDetail",
    "switchSeason",
    "switchSource",
    "navigateEpisode",
    "removeFromWatchlistByIndex",
    "setViewMode",
    "setSortMode",
    "setMood",
    "addToCompare",
    "removeFromCompare",
    "toggleCompare",
    "toggleReaction",
    "snapCurrentContent",
    "requestPiP",
    "closeRoulette",
    "roulettePlay",
    "closeTrailerOverlay",
    "deleteComment",
    "submitComment",
    "selectBadge",
    "selectColor",
    "triggerAvatarUpload",
    "saveProfile",
    "wishlistCardClick",
    "switchWlTab",
    "moveWlItem",
    "removeFromMultiWl",
    "toggleWishlistDetail",
    "openIMDb",
    "clearAllCW",
    "removeCW",
    "calPrev",
    "calNext",
    "renderCalendar",
    "toggleParentalLock",
    "closePinOverlay",
    "pinPress",
    "pinClear",
    "setPlaybackSpeed",
    "setSubtitleLang",
    "setWatchGoal",
    "checkAndUnlock",
    "tryUnlock",
  ];
  fns.forEach(function (name) {
    if (typeof window[name] === "undefined") {
      window[name] = noop;
    }
  });

  // ── Guest interceptions ──
  var guestBlocked = {
    // Watchlist & progress
    toggleWatchlist: "Adding to watchlist",
    toggleCompleted: "Marking as watched",
    toggleWishlist: "Managing your wishlist",
    toggleWishlistDetail: "Managing your wishlist",
    wishlistCardClick: "Managing your wishlist",
    moveWlItem: "Managing your watchlist",
    removeFromMultiWl: "Managing your watchlist",
    clearAllCW: "Continue watching history",
    removeCW: "Continue watching history",
    // Ratings & reviews
    setUserRating: "Rating titles",
    submitComment: "Posting comments",
    deleteComment: "Deleting comments",
    toggleReaction: "Reacting to content",
    // Profile & goals
    saveProfile: "Saving your profile",
    setWatchGoal: "Setting watch goals",
    snapCurrentContent: "Saving a snapshot",
    // Roulette
    openRandom: "Movie Roulette",
    roulettePlay: "Movie Roulette",
    // Calendar
    openCalendarModal: "Watch Calendar",
  };
  Object.keys(guestBlocked).forEach(function (name) {
    (function (n, label) {
      var original = window[n];
      window[n] = function () {
        if (window._requireAuth(label)) return;
        if (typeof original === "function") original.apply(this, arguments);
      };
    })(name, guestBlocked[name]);
  });
  // checkAndUnlock must return true to allow play
  window.checkAndUnlock = function () {
    return true;
  };
  window.tryUnlock = function () {
    return true;
  };
})();

/* ═══════════════════════════════════════════════════════
   REPOST SYSTEM — Instagram-style
   One click on 🔁 Repost in the detail modal = instantly
   posts that title to the Reposts tab as its own card.
   Click again = removes it (toggle).
   Storage key: sv_reposts_<uid>  (array, newest first)
═══════════════════════════════════════════════════════ */

/* ── DB shim — works before Firebase inits ── */
function _svrDB() {
  if (window.FirebaseDB) return window.FirebaseDB;
  return {
    getItem: function (k) {
      try {
        return localStorage.getItem(k);
      } catch (e) {
        return null;
      }
    },
    setItem: function (k, v) {
      try {
        localStorage.setItem(k, v);
      } catch (e) {}
    },
  };
}

function _svrUid() {
  try {
    if (window.firebase && firebase.auth && firebase.auth().currentUser)
      return firebase.auth().currentUser.uid;
  } catch (e) {}
  var k = "sv_anon_uid";
  var id = localStorage.getItem(k);
  if (!id) {
    id = "anon_" + Math.random().toString(36).slice(2);
    localStorage.setItem(k, id);
  }
  return id;
}

var _SVR_KEY = "sv_reposts"; // array of { id, tmdbId, type, title, poster, year, ts }
var _SVR_MAX = 50;
var _SVR_TMDB_CACHE = {};

/* ── storage helpers ── */
function _svrLoad() {
  try {
    return JSON.parse(_svrDB().getItem(_SVR_KEY) || "[]");
  } catch (e) {
    return [];
  }
}
function _svrSave(arr) {
  try {
    _svrDB().setItem(_SVR_KEY, JSON.stringify(arr));
  } catch (e) {}
}
function _svrIsReposted(tmdbId, type) {
  return _svrLoad().some(function (p) {
    return String(p.tmdbId) === String(tmdbId) && p.type === type;
  });
}

/* ── escape HTML ── */
function _svrEsc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function _svrTimeAgo(ts) {
  var d = Date.now() - ts;
  if (d < 60000) return "just now";
  if (d < 3600000) return Math.floor(d / 60000) + "m ago";
  if (d < 86400000) return Math.floor(d / 3600000) + "h ago";
  return Math.floor(d / 86400000) + "d ago";
}

/* ── Add or remove a repost (toggle) ── */
function _svrToggleRepost(item) {
  if (window.SV_GUEST) {
    if (window._requireAuth) window._requireAuth("Reposting");
    return;
  }
  var posts = _svrLoad();
  var idx = -1;
  posts.forEach(function (p, i) {
    if (String(p.tmdbId) === String(item.tmdbId) && p.type === item.type)
      idx = i;
  });

  if (idx !== -1) {
    // Un-repost
    posts.splice(idx, 1);
    _svrSave(posts);
    _svrUpdateBtn(item.tmdbId, item.type, false);
    if (typeof showToast === "function") showToast("🔁 Removed from Reposts");
  } else {
    // Repost
    posts.unshift({
      id: Date.now(),
      tmdbId: String(item.tmdbId),
      type: item.type || "movie",
      title: item.title || "",
      poster: item.poster || "",
      year: item.year || "",
      ts: Date.now(),
    });
    if (posts.length > _SVR_MAX) posts = posts.slice(0, _SVR_MAX);
    _svrSave(posts);
    _svrUpdateBtn(item.tmdbId, item.type, true);
    if (typeof showToast === "function")
      showToast("🔁 Reposted to your profile!");
  }
  // Live-refresh feed if profile is open on Reposts tab
  var pane = document.getElementById("profPane-reposts");
  if (pane && pane.style.display !== "none") _svrRenderFeed();
}

/* ── Update the Repost button state in the detail modal ── */
function _svrUpdateBtn(tmdbId, type, reposted) {
  var btn = document.getElementById("svr-repost-btn");
  if (!btn) return;
  var repostIcon =
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>';
  btn.innerHTML = repostIcon + (reposted ? " Reposted" : " Repost");
  btn.style.background = reposted
    ? "rgba(232,98,42,0.18)"
    : "rgba(255,255,255,0.06)";
  btn.style.borderColor = reposted
    ? "rgba(232,98,42,0.55)"
    : "rgba(255,255,255,0.12)";
  btn.style.color = reposted ? "#e8622a" : "rgba(255,255,255,0.75)";
}

/* ── Fetch poster from TMDB if not stored ── */
function _svrFetchPoster(tmdbId, type, imgEl, fallbackEl) {
  if (!tmdbId) return;
  var cacheKey = tmdbId + "_" + type;
  if (_SVR_TMDB_CACHE[cacheKey]) {
    imgEl.src = "https://image.tmdb.org/t/p/w185" + _SVR_TMDB_CACHE[cacheKey];
    return;
  }
  fetch(
    "https://api.themoviedb.org/3/" +
      (type === "tv" ? "tv" : "movie") +
      "/" +
      tmdbId +
      "?api_key=8265bd1679663a7ea12ac168da84d2e8",
  )
    .then(function (r) {
      return r.ok ? r.json() : null;
    })
    .then(function (d) {
      if (d && d.poster_path) {
        _SVR_TMDB_CACHE[cacheKey] = d.poster_path;
        imgEl.src = "https://image.tmdb.org/t/p/w185" + d.poster_path;
        // Persist poster back into storage so next render is instant
        var posts = _svrLoad();
        posts.forEach(function (p) {
          if (
            String(p.tmdbId) === String(tmdbId) &&
            p.type === type &&
            !p.poster
          )
            p.poster = d.poster_path;
        });
        _svrSave(posts);
      } else {
        if (fallbackEl) fallbackEl.style.display = "flex";
      }
    })
    .catch(function () {
      if (fallbackEl) fallbackEl.style.display = "flex";
    });
}

/* ── Render the Reposts feed — 3-col mini cards ── */
function _svrRenderFeed() {
  var feed = document.getElementById("profRepostFeed");
  if (!feed) return;
  var posts = _svrLoad();
  feed.innerHTML = "";

  if (!posts.length) {
    feed.innerHTML =
      '<div style="text-align:center;padding:36px 0 16px;color:rgba(255,255,255,0.2);font-size:13px;line-height:1.9">' +
      '<div style="font-size:28px;margin-bottom:6px">🔁</div>' +
      "No reposts yet<br>" +
      '<span style="font-size:11px;opacity:0.5">Tap 🔁 Repost on any movie or series</span></div>';
    return;
  }

  /* Group into rows of 3 */
  var rows = [];
  for (var i = 0; i < posts.length; i += 3) rows.push(posts.slice(i, i + 3));

  rows.forEach(function (row) {
    var rowEl = document.createElement("div");
    rowEl.style.cssText =
      "display:grid;grid-template-columns:repeat(3,1fr);gap:4px";

    row.forEach(function (post) {
      /* ── cell ── */
      var cell = document.createElement("div");
      cell.style.cssText =
        "position:relative;height:120px;border-radius:8px;overflow:hidden;" +
        "background:#111;cursor:pointer;flex-shrink:0";

      /* gradient fallback */
      var gradBgs = ["#1c1c3a", "#1e2e1e", "#2a1c1c", "#1a2530", "#2a1e30"];
      var gIdx =
        Math.abs(
          (post.tmdbId || "").split("").reduce(function (a, c) {
            return a + c.charCodeAt(0);
          }, 0),
        ) % gradBgs.length;
      var fallback = document.createElement("div");
      fallback.style.cssText =
        "position:absolute;inset:0;background:linear-gradient(160deg," +
        gradBgs[gIdx] +
        ",#0c0c18);" +
        "display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:6px";
      fallback.innerHTML =
        '<span style="font-size:20px">🎬</span>' +
        '<span style="font-size:8px;font-weight:600;color:rgba(255,255,255,0.5);text-align:center;line-height:1.3;word-break:break-word">' +
        _svrEsc(
          post.title.length > 22 ? post.title.slice(0, 20) + "…" : post.title,
        ) +
        "</span>";

      /* poster image */
      var img = document.createElement("img");
      img.alt = post.title;
      img.style.cssText =
        "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" +
        "transition:transform .25s;display:none";
      img.onload = function () {
        img.style.display = "block";
        fallback.style.display = "none";
      };
      img.onerror = function () {
        img.style.display = "none";
        fallback.style.display = "flex";
      };

      if (post.poster) {
        img.src = "https://image.tmdb.org/t/p/w185" + post.poster;
      } else if (post.tmdbId) {
        _svrFetchPoster(post.tmdbId, post.type, img, fallback);
      }

      /* dark gradient + title overlay at bottom */
      var overlay = document.createElement("div");
      overlay.style.cssText =
        "position:absolute;bottom:0;left:0;right:0;" +
        "background:linear-gradient(transparent,rgba(0,0,0,0.88));" +
        "padding:20px 5px 5px;pointer-events:none";
      overlay.innerHTML =
        '<div style="font-size:8px;font-weight:700;color:#fff;line-height:1.2;' +
        'overflow:hidden;white-space:nowrap;text-overflow:ellipsis">' +
        _svrEsc(post.title) +
        "</div>" +
        (post.year
          ? '<div style="font-size:7.5px;color:rgba(255,255,255,0.4);margin-top:1px">' +
            post.year +
            "</div>"
          : "");

      /* type badge top-left */
      var badge = document.createElement("div");
      badge.style.cssText =
        "position:absolute;top:4px;left:4px;" +
        "background:" +
        (post.type === "tv" ? "#1e6fff" : "#e8622a") +
        ";" +
        "color:#fff;font-size:7px;font-weight:800;padding:1px 5px;" +
        "border-radius:3px;letter-spacing:0.04em;line-height:1.6";
      badge.textContent = post.type === "tv" ? "TV" : "MV";

      /* delete button top-right */
      var del = document.createElement("button");
      del.style.cssText =
        "position:absolute;top:3px;right:3px;background:rgba(0,0,0,0.55);" +
        "border:none;color:rgba(255,255,255,0.6);font-size:9px;width:18px;height:18px;" +
        "border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;" +
        "line-height:1;opacity:0;transition:opacity .15s";
      del.textContent = "✕";
      del.addEventListener("click", function (e) {
        e.stopPropagation();
        window.deleteRepost(post.id);
      });
      cell.addEventListener("mouseenter", function () {
        img.style.transform = "scale(1.06)";
        del.style.opacity = "1";
      });
      cell.addEventListener("mouseleave", function () {
        img.style.transform = "scale(1)";
        del.style.opacity = "0";
      });

      /* click opens detail modal */
      cell.addEventListener("click", function () {
        window._svrOpenItem(post);
      });

      cell.appendChild(fallback);
      cell.appendChild(img);
      cell.appendChild(overlay);
      cell.appendChild(badge);
      cell.appendChild(del);
      rowEl.appendChild(cell);
    });

    /* fill empty slots in last row so grid stays aligned */
    while (rowEl.children.length < 3) {
      var empty = document.createElement("div");
      empty.style.cssText =
        "height:120px;border-radius:8px;background:rgba(255,255,255,0.02)";
      rowEl.appendChild(empty);
    }

    feed.appendChild(rowEl);
  });
}

/* ── Inject 🔁 Repost button into the detail modal ── */
document.addEventListener("DOMContentLoaded", function () {
  var detailBody = document.getElementById("detailBody");
  if (!detailBody) return;

  var observer = new MutationObserver(function () {
    if (document.getElementById("svr-repost-btn")) return;

    var actionRow = detailBody.querySelector(
      ".detail-actions, .detail-btn-row, [class*='action']",
    );
    if (!actionRow) {
      var btns = detailBody.querySelectorAll("button");
      if (btns.length) actionRow = btns[0].parentElement;
    }
    if (!actionRow) return;

    var titleEl = document.getElementById("detailTitle");
    var title = titleEl ? titleEl.textContent.trim() : "";
    if (!title || title === "—") return;

    /* Read item from exposed global */
    var ci = window._svCurrentItem || null;
    if (!ci || !ci.tmdbId) return;

    var reposted = _svrIsReposted(ci.tmdbId, ci.type);
    var repostIcon =
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>';

    var btn = document.createElement("button");
    btn.id = "svr-repost-btn";
    btn.title = "Repost to your profile";
    btn.style.cssText = [
      "display:inline-flex",
      "align-items:center",
      "gap:6px",
      "padding:8px 14px",
      "border-radius:10px",
      "border:1px solid",
      "font-size:13px",
      "font-weight:600",
      "cursor:pointer",
      "font-family:inherit",
      "transition:all .2s",
      "white-space:nowrap",
      "background:" +
        (reposted ? "rgba(232,98,42,0.18)" : "rgba(255,255,255,0.06)"),
      "border-color:" +
        (reposted ? "rgba(232,98,42,0.55)" : "rgba(255,255,255,0.12)"),
      "color:" + (reposted ? "#e8622a" : "rgba(255,255,255,0.75)"),
    ].join(";");
    btn.innerHTML = repostIcon + (reposted ? " Reposted" : " Repost");

    btn.addEventListener("click", function () {
      var item = window._svCurrentItem || ci;
      _svrToggleRepost({
        tmdbId: item.tmdbId || item.id,
        type: item.type || "movie",
        title: item.title || title,
        poster: item.poster || item.poster_path || "",
        year: item.year || "",
      });
    });

    actionRow.insertBefore(btn, actionRow.firstChild);
  });

  observer.observe(detailBody, { childList: true, subtree: true });
});

/* ── Public API ── */
window.switchProfTab = function (tab) {
  ["about", "reposts"].forEach(function (t) {
    var pane = document.getElementById("profPane-" + t);
    var btn = document.getElementById("profTab-" + t);
    if (!pane || !btn) return;
    var active = t === tab;
    pane.style.display = active ? "" : "none";
    btn.style.borderBottomColor = active ? "#e8622a" : "transparent";
    btn.style.color = active ? "#fff" : "rgba(255,255,255,0.35)";
    btn.style.fontWeight = active ? "700" : "600";
  });
  if (tab === "reposts") _svrRenderFeed();
};

window.deleteRepost = function (id) {
  var posts = _svrLoad().filter(function (p) {
    return p.id !== id;
  });
  _svrSave(posts);
  _svrRenderFeed();
  if (typeof showToast === "function") showToast("🗑 Removed from Reposts");
};

window._refreshRepostFeed = function () {
  _svrRenderFeed();
};

/* ── Open detail modal from a repost card tap ── */
window._svrOpenItem = function (item) {
  try {
    if (!item || !item.tmdbId) return;
    if (window.allContent && window.allContent.length) {
      var found = window.allContent.find(function (c) {
        return String(c.tmdbId) === String(item.tmdbId) && c.type === item.type;
      });
      if (found && typeof window.openContent === "function") {
        // Close profile modal first
        if (typeof window.closeProfileModal === "function")
          window.closeProfileModal();
        window.openContent(found);
        return;
      }
    }
    // Fallback via URL
    window.history.pushState(
      null,
      "",
      "?type=" + item.type + "&id=" + item.tmdbId,
    );
    window.dispatchEvent(new PopStateEvent("popstate"));
  } catch (e) {}
};

/* Keep legacy stubs so nothing else breaks */
window.openFavRepost = function () {};
window.closeFavRepost = function () {};
window.addFavRepost = function () {};
window.removeFavRepost = function () {};
window.repostFavorites = function () {};
window.quickRepostTitle = function () {};
window.setFavMood = function () {};

/* ═══ END REPOST SYSTEM ═══ */

(function () {
  /* ── personality archetypes ── */
  const PERSONALITIES = [
    {
      name: "The Midnight Wanderer",
      desc: "You chase the strange, the beautiful, and the forgotten.",
      genres: ["Drama", "Mystery", "Art-House"],
      badge: "🌙",
    },
    {
      name: "The Adrenaline Architect",
      desc: "Life's too short for slow scenes — you live for the edge.",
      genres: ["Action", "Thriller", "Sci-Fi"],
      badge: "⚡",
    },
    {
      name: "The Emotional Cartographer",
      desc: "You map human feeling with every film you choose.",
      genres: ["Drama", "Romance", "Documentary"],
      badge: "🗺️",
    },
    {
      name: "The Parallel Universe Pilgrim",
      desc: "Reality is just one option — you explore them all.",
      genres: ["Sci-Fi", "Fantasy", "Animation"],
      badge: "🪐",
    },
    {
      name: "The Laugh Alchemist",
      desc: "You turn two hours into pure serotonin. Scientifically proven.",
      genres: ["Comedy", "Rom-Com", "Animation"],
      badge: "✨",
    },
    {
      name: "The Shadow Archaeologist",
      desc: "You dig up the darkest corners of the human story.",
      genres: ["Horror", "Thriller", "Crime"],
      badge: "🖤",
    },
    {
      name: "The Golden Era Keeper",
      desc: "Old films burn brighter. You know why.",
      genres: ["Classic", "Drama", "Film-Noir"],
      badge: "🎞️",
    },
    {
      name: "The World Cinema Nomad",
      desc: "Every subtitle is a passport stamp for your soul.",
      genres: ["Foreign", "Drama", "Documentary"],
      badge: "🌍",
    },
    {
      name: "The Blockbuster Oracle",
      desc: "You were watching the MCU before it was cool. Obviously.",
      genres: ["Action", "Sci-Fi", "Adventure"],
      badge: "🏆",
    },
    {
      name: "The Slow Burn Devotee",
      desc: "You trust the quiet moments others skip past.",
      genres: ["Drama", "Indie", "Documentary"],
      badge: "🕯️",
    },
  ];

  const DECADE_LABELS = ["60s", "70s", "80s", "90s", "00s", "10s", "20s"];

  /* ── helpers ── */
  function getWatched() {
    // sv_completed is stored as an object { tmdbId: true, ... } by the main app
    try {
      const raw = window.FirebaseDB
        ? window.FirebaseDB.getItem("sv_completed") || "{}"
        : localStorage.getItem("sv_completed") || "{}";
      const parsed = JSON.parse(raw);
      // If it came back as an array (legacy), return as-is; otherwise return keys
      return Array.isArray(parsed) ? parsed : Object.keys(parsed);
    } catch {
      return [];
    }
  }

  function getWatchlistItems() {
    try {
      const raw = window.FirebaseDB
        ? window.FirebaseDB.getItem("watchlist") || "[]"
        : localStorage.getItem("sv_watchlist") || "[]";
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  function getRatings() {
    try {
      const raw = window.FirebaseDB
        ? window.FirebaseDB.getItem("ratings") || "{}"
        : localStorage.getItem("sv_ratings") || "{}";
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  function getCatalog() {
    // window.catalog is populated by _svAppReady
    return window.catalog || [];
  }

  function pickPersonality(topGenres) {
    // find best personality match
    if (!topGenres || !topGenres.length) {
      return PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];
    }
    let best = null,
      bestScore = -1;
    PERSONALITIES.forEach((p) => {
      const score = p.genres.filter((g) =>
        topGenres.some(
          (tg) =>
            tg.toLowerCase().includes(g.toLowerCase()) ||
            g.toLowerCase().includes(tg.toLowerCase()),
        ),
      ).length;
      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    });
    return best || PERSONALITIES[0];
  }

  function getMultiWatchlist() {
    // sv_mwl is the real source of truth (want/watching/done) — the same
    // key FirebaseDB migrates/trims and the one the profile stats read from.
    // window.multiWatchlist is only used as a fast-path if inline.js has
    // exposed it; it is NOT guaranteed to exist on window, so we always
    // fall back to reading sv_mwl directly rather than stale legacy keys.
    if (window.multiWatchlist) return window.multiWatchlist;
    try {
      const raw = window.FirebaseDB
        ? window.FirebaseDB.getItem("sv_mwl") || "{}"
        : localStorage.getItem("sv_mwl") || "{}";
      const mwl = typeof raw === "string" ? JSON.parse(raw) : raw;
      return {
        want: mwl.want || [],
        watching: mwl.watching || [],
        done: mwl.done || [],
      };
    } catch {
      return { want: [], watching: [], done: [] };
    }
  }

  function analyzeWatchData() {
    const catalog = getCatalog();

    // Prefer live in-memory / sv_mwl data (same source the profile modal
    // uses) over the legacy sv_completed / sv_watchlist keys, which the
    // app no longer keeps up to date and which caused the taste card to
    // show a stale, smaller "watched" count than the profile stats.
    const mwl = getMultiWatchlist();
    let completed, watchlist, ratings;

    if (mwl.done.length || mwl.want.length || mwl.watching.length) {
      completed = mwl.done.map((w) => w.id || w.tmdbId || w);
      watchlist = [...mwl.want, ...mwl.watching, ...mwl.done];
    } else {
      completed = getWatched();
      watchlist = getWatchlistItems();
    }

    if (window.userRatings) {
      ratings = window.userRatings;
    } else {
      ratings = getRatings();
    }

    // Merge all known IDs
    const allIds = new Set([...completed, ...watchlist.map((w) => w.id || w)]);

    // Match with catalog
    const items = catalog.filter((c) =>
      allIds.has(c.id || c.tmdbId || c.title),
    );
    const watchedCount = completed.length || watchlist.length || items.length;
    const ratedCount = Object.keys(ratings).length;

    // Genre frequency
    const genreCount = {};
    items.forEach((item) => {
      const genres = item.genres || item.genre_ids || [];
      (Array.isArray(genres) ? genres : [genres]).forEach((g) => {
        if (!g) return;
        const label = typeof g === "string" ? g : g.name || String(g);
        genreCount[label] = (genreCount[label] || 0) + 1;
      });
    });

    // Also mine from watchlist objects directly
    watchlist.forEach((w) => {
      if (w.genre) {
        const gs = Array.isArray(w.genre) ? w.genre : w.genre.split(",");
        gs.forEach((g) => {
          const label = g.trim();
          if (label) genreCount[label] = (genreCount[label] || 0) + 1;
        });
      }
    });

    const topGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([g]) => g);

    // Decade frequency using 'year' or 'release_date'
    const decadeCount = {};
    DECADE_LABELS.forEach((d) => (decadeCount[d] = 0));
    items.forEach((item) => {
      const yr = parseInt(
        item.year ||
          (item.release_date || "").slice(0, 4) ||
          (item.first_air_date || "").slice(0, 4),
      );
      if (!yr) return;
      if (yr < 1970) decadeCount["60s"]++;
      else if (yr < 1980) decadeCount["70s"]++;
      else if (yr < 1990) decadeCount["80s"]++;
      else if (yr < 2000) decadeCount["90s"]++;
      else if (yr < 2010) decadeCount["00s"]++;
      else if (yr < 2020) decadeCount["10s"]++;
      else decadeCount["20s"]++;
    });

    // Watchlist years fallback
    watchlist.forEach((w) => {
      const yr = parseInt(w.year || "");
      if (!yr) return;
      if (yr < 1970) decadeCount["60s"]++;
      else if (yr < 1980) decadeCount["70s"]++;
      else if (yr < 1990) decadeCount["80s"]++;
      else if (yr < 2000) decadeCount["90s"]++;
      else if (yr < 2010) decadeCount["00s"]++;
      else if (yr < 2020) decadeCount["10s"]++;
      else decadeCount["20s"]++;
    });

    // Estimate hours — use real tracked time if available, else flat estimate
    const realMinutes =
      typeof window._wtTotalMinutes === "function"
        ? window._wtTotalMinutes()
        : 0;
    const estHours =
      realMinutes > 0
        ? Math.round(realMinutes / 60)
        : Math.round((watchedCount * 100) / 60);

    // Use real unique-title count from tracker if available and higher
    const trackedTitles =
      typeof window._wtUniqueTitles === "function"
        ? window._wtUniqueTitles()
        : 0;
    const finalWatchedCount = Math.max(watchedCount, trackedTitles);

    return {
      watchedCount: finalWatchedCount,
      ratedCount,
      topGenres,
      decadeCount,
      estHours,
    };
  }

  function buildDecadeRow(decadeCount) {
    const row = document.getElementById("tcDecadeRow");
    if (!row) return;
    row.innerHTML = "";
    const vals = DECADE_LABELS.map((d) => decadeCount[d] || 0);
    const maxVal = Math.max(...vals, 1);
    // find peak decade
    let peakIdx = 0;
    vals.forEach((v, i) => {
      if (v > vals[peakIdx]) peakIdx = i;
    });

    DECADE_LABELS.forEach((lbl, i) => {
      const pct = Math.max(8, Math.round((vals[i] / maxVal) * 100));
      const bar = document.createElement("div");
      bar.className = "tc-decade-bar" + (i === peakIdx ? " active" : "");
      bar.style.height = pct + "%";
      bar.title = lbl + ": " + vals[i] + " titles";
      bar.innerHTML = `<span class="tc-decade-bar-lbl">${lbl}</span>`;
      row.appendChild(bar);
    });

    return DECADE_LABELS[peakIdx];
  }

  function buildGenrePills(topGenres) {
    const el = document.getElementById("tcGenres");
    if (!el) return;
    const pills = topGenres.length
      ? topGenres.slice(0, 5)
      : ["Drama", "Thriller", "Sci-Fi"];
    el.innerHTML = pills
      .map((g, i) => `<span class="tc-genre-pill tc-g${i + 1}">${g}</span>`)
      .join("");
  }

  function buildBadges(data) {
    const row = document.getElementById("tcBadgesRow");
    if (!row) return;
    const badges = [];
    if (data.watchedCount >= 50)
      badges.push({ icon: "🏅", text: "50+ watched" });
    if (data.watchedCount >= 10)
      badges.push({ icon: "🎬", text: "Active viewer" });
    if (data.ratedCount >= 5) badges.push({ icon: "⭐", text: "Critic" });
    if (data.topGenres.length >= 3)
      badges.push({ icon: "🎭", text: "Genre explorer" });
    const decadeVals = Object.values(data.decadeCount);
    const diverseDecades = decadeVals.filter((v) => v > 0).length;
    if (diverseDecades >= 4)
      badges.push({ icon: "📅", text: "Time traveller" });
    if (!badges.length) badges.push({ icon: "🌟", text: "Cinephile rising" });

    row.innerHTML = badges
      .slice(0, 4)
      .map(
        (b) =>
          `<div class="tc-badge"><span class="tc-badge-icon">${b.icon}</span>${b.text}</div>`,
      )
      .join("");
  }

  function buildTasteCardReposts() {
    const section = document.getElementById("tcRepostsSection");
    const row = document.getElementById("tcReposts");
    if (!section || !row) return;

    const posts =
      typeof _svrLoad === "function" ? _svrLoad().slice(0, 3) : [];

    if (!posts.length) {
      section.style.display = "none";
      row.innerHTML = "";
      return;
    }

    section.style.display = "";
    row.innerHTML = "";

    posts.forEach((p) => {
      const item = document.createElement("div");
      item.className = "tc-repost-item";

      const posterDiv = document.createElement("div");
      posterDiv.className = "tc-repost-poster";

      const img = document.createElement("img");
      img.alt = p.title || "";
      img.style.display = "none";
      img.onload = () => {
        img.style.display = "block";
        posterDiv.textContent = "";
        posterDiv.appendChild(img);
      };
      img.onerror = () => {
        posterDiv.textContent = "🎬";
      };

      if (p.poster) {
        img.src = "https://image.tmdb.org/t/p/w185" + p.poster;
        posterDiv.appendChild(img);
      } else if (p.tmdbId && typeof _svrFetchPoster === "function") {
        posterDiv.textContent = "🎬";
        _svrFetchPoster(p.tmdbId, p.type, img, posterDiv);
        posterDiv.appendChild(img);
      } else {
        posterDiv.textContent = "🎬";
      }

      const titleDiv = document.createElement("div");
      titleDiv.className = "tc-repost-title";
      titleDiv.textContent = p.title || "";
      titleDiv.title = p.title || "";

      item.appendChild(posterDiv);
      item.appendChild(titleDiv);
      item.addEventListener("click", () => {
        if (typeof window._svrOpenItem === "function")
          window._svrOpenItem(p);
      });
      row.appendChild(item);
    });
  }

  /* ── Real watch-time, sourced from the leaderboard entry (same
     numbers shown on the Leaderboard), not a flat estimate ── */
  async function fetchRealWatchHours() {
    try {
      const uid =
        (window.FirebaseLeaderboard &&
          window.FirebaseLeaderboard.getCurrentUid()) ||
        window._svUid ||
        (window._svUser && window._svUser.uid);
      const rtdb = window._firebaseRTDB;
      if (!uid || !rtdb) return null;
      const db = rtdb.getDatabase();
      const snap = await rtdb.get(rtdb.ref(db, "leaderboard/" + uid));
      if (!snap.exists()) return null;
      const entry = snap.val() || {};
      const totalSeconds = entry.totalSeconds || 0;
      return totalSeconds / 3600;
    } catch (e) {
      console.warn("[TasteCard] leaderboard fetch failed", e);
      return null;
    }
  }

  /* ── main builder ── */
  window.buildTasteCard = async function () {
    const data = analyzeWatchData();
    const personality = pickPersonality(data.topGenres);

    // Username + avatar from profile elements
    const nameEl = document.getElementById("profileDisplayName");
    const avatarEl = document.getElementById("profileAvatarBig");
    const username =
      nameEl && nameEl.textContent.trim() !== "—"
        ? nameEl.textContent.trim()
        : "Cinephile";

    // Populate card
    const tcUser = document.getElementById("tcUsername");
    if (tcUser) tcUser.textContent = username;
    const tcPersonality = document.getElementById("tcPersonality");
    if (tcPersonality) tcPersonality.textContent = personality.name;
    const tcDesc = document.getElementById("tcPersonalityDesc");
    if (tcDesc) tcDesc.textContent = personality.desc;
    const tcYear = document.getElementById("tcYear");
    if (tcYear) tcYear.textContent = new Date().getFullYear();
    const tcFooter = document.getElementById("tcFooterDate");
    if (tcFooter)
      tcFooter.textContent = new Date().toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });

    // Stats
    const tcW = document.getElementById("tcStatWatched");
    if (tcW) tcW.textContent = data.watchedCount || watchlist_fallback();
    const tcH = document.getElementById("tcStatHours");
    if (tcH) tcH.textContent = "…"; // placeholder until real leaderboard data resolves
    const tcR = document.getElementById("tcStatRated");
    if (tcR) tcR.textContent = data.ratedCount;

    // Avatar
    const tcAvatar = document.getElementById("tcAvatar");
    if (tcAvatar) {
      const emojiEl = document.getElementById("profileAvatarEmoji");
      const imgEl = avatarEl && avatarEl.querySelector("img");
      if (imgEl && imgEl.src) {
        tcAvatar.innerHTML = `<img src="${imgEl.src}" alt="avatar"/>`;
      } else if (emojiEl) {
        tcAvatar.innerHTML = `<span style="font-size:1.6rem">${emojiEl.textContent}</span>`;
      }
    }

    buildGenrePills(data.topGenres);
    buildDecadeRow(data.decadeCount);
    buildBadges(data);
    buildTasteCardReposts();

    // Re-trigger card animation
    const card = document.getElementById("tasteCardEl");
    if (card) {
      card.style.animation = "none";
      void card.offsetHeight;
      card.style.animation = "";
    }

    // Pull the real watched-hours total from the leaderboard entry —
    // the same source of truth used on the Leaderboard tab — and fall
    // back to the flat estimate only if the user has no tracked time yet.
    const realHours = await fetchRealWatchHours();
    if (tcH) {
      const hrs = realHours != null ? realHours : data.estHours || 0;
      tcH.textContent = (hrs >= 10 ? Math.round(hrs) : Math.round(hrs * 10) / 10) + "h";
    }
  };

  function watchlist_fallback() {
    try {
      // Also check multiWatchlist.done which is the primary "watched" store
      if (window.multiWatchlist && window.multiWatchlist.done) {
        return window.multiWatchlist.done.length;
      }
      const raw = window.FirebaseDB
        ? window.FirebaseDB.getItem("sv_mwl") || "{}"
        : localStorage.getItem("sv_mwl") || "{}";
      const mwl = JSON.parse(raw);
      return (mwl.done && mwl.done.length) || 0;
    } catch {
      return 0;
    }
  }

  /* ── open / close ── */
  window.openTasteCard = function () {
    const modal = document.getElementById("tasteCardModal");
    if (!modal) return;
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
    setTimeout(window.buildTasteCard, 60); // let modal paint first
  };

  window.closeTasteCard = function () {
    const modal = document.getElementById("tasteCardModal");
    if (modal) modal.style.display = "none";
    document.body.style.overflow = "";
  };

  /* ── html2canvas-based card capture — captures exactly what is shown ── */
  function loadHtml2Canvas() {
    return new Promise((resolve, reject) => {
      if (window.html2canvas) {
        resolve(window.html2canvas);
        return;
      }
      const s = document.createElement("script");
      s.src =
        "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      s.onload = () => resolve(window.html2canvas);
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function captureCard() {
    return loadHtml2Canvas().then((h2c) => {
      const card = document.getElementById("tasteCardEl");
      if (!card) return Promise.reject(new Error("Card element not found"));

      // Capture the card element but tell html2canvas its exact rendered
      // size so it never extends the canvas to include overflow regions
      // (blobs with negative top/left would otherwise bloat the output).
      const rect = card.getBoundingClientRect();

      return h2c(card, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#0c0c10",
        logging: false,
        // Constrain canvas to the card's visible box
        width: rect.width,
        height: rect.height,
        // Offset so html2canvas aligns to the element's top-left corner,
        // not to the document origin
        x: 0,
        y: 0,
        scrollX: -rect.left,
        scrollY: -rect.top,
        windowWidth: rect.width,
        windowHeight: rect.height,
      });
    });
  }

  /* ── set button loading state ── */
  function setBtnState(id, html, color) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn._orig = btn._orig || btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = html;
    if (color) btn.style.background = color;
  }
  function resetBtn(id) {
    const btn = document.getElementById(id);
    if (!btn || !btn._orig) return;
    btn.disabled = false;
    btn.innerHTML = btn._orig;
    btn.style.background = "";
    btn._orig = null;
  }

  /* ── DOWNLOAD ── */
  window.downloadTasteCard = function () {
    setBtnState("tasteDownloadBtn", "⏳ Rendering…", "");
    captureCard()
      .then((canvas) => {
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "streamvault-taste-profile.png";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 5000);
          setBtnState("tasteDownloadBtn", "✓ Saved!", "#1a6a2a");
          setTimeout(() => resetBtn("tasteDownloadBtn"), 2200);
        }, "image/png");
      })
      .catch((err) => {
        console.error("Taste card capture error:", err);
        resetBtn("tasteDownloadBtn");
        if (typeof showToast === "function")
          showToast("⚠️ Could not capture card. Try a screenshot.");
      });
  };

  /* ── SHARE ── */
  window.shareTasteCard = function () {
    const personalityEl = document.getElementById("tcPersonality");
    const name = personalityEl ? personalityEl.textContent : "Film Personality";
    const shareText = `🎬 My StreamVault Film Personality: "${name}" — discover yours! #StreamVault #FilmPersonality`;

    setBtnState("tasteShareBtn", "⏳ Preparing…", "");

    captureCard()
      .then((canvas) => {
        canvas.toBlob((blob) => {
          const file = new File([blob], "streamvault-taste-profile.png", {
            type: "image/png",
          });

          // Web Share API with file (mobile / modern browsers)
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator
              .share({
                files: [file],
                title: "My StreamVault Taste Profile",
                text: shareText,
              })
              .then(() => {
                setBtnState("tasteShareBtn", "✓ Shared!", "#1a6a2a");
                setTimeout(() => resetBtn("tasteShareBtn"), 2200);
              })
              .catch((err) => {
                if (err.name !== "AbortError") fallbackShare(canvas, shareText);
                else resetBtn("tasteShareBtn");
              });
          } else {
            // Desktop fallback: download + copy text
            fallbackShare(canvas, shareText);
          }
        }, "image/png");
      })
      .catch((err) => {
        console.error("Share capture error:", err);
        resetBtn("tasteShareBtn");
        if (typeof showToast === "function")
          showToast("⚠️ Could not capture card.");
      });
  };

  function fallbackShare(canvas, shareText) {
    // Download the image
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "streamvault-taste-profile.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }, "image/png");

    // Copy caption to clipboard
    navigator.clipboard
      .writeText(shareText)
      .then(() => {
        setBtnState(
          "tasteShareBtn",
          "✓ Image saved + caption copied!",
          "#1a6a2a",
        );
      })
      .catch(() => {
        setBtnState("tasteShareBtn", "✓ Image downloaded!", "#1a6a2a");
      });
    setTimeout(() => resetBtn("tasteShareBtn"), 3000);
  }
})();

/* ═══════════════════════════════════════════════════════════════
   UID COPY
   Populates the UID row in the profile modal and handles copy.
═══════════════════════════════════════════════════════════════ */
window.svPopulateUid = function () {
  var uid = window._svUid || (window._svUser && window._svUser.uid) || null;
  var row = document.getElementById("profileUidRow");
  var txt = document.getElementById("profileUidText");
  if (!row) return;
  if (!uid) {
    row.style.display = "none";
    return;
  }
  row.style.display = "flex";
  if (txt) txt.textContent = uid;
};

window.svCopyUid = function () {
  var uid = window._svUid || (window._svUser && window._svUser.uid) || "";
  if (!uid) return;
  try {
    navigator.clipboard.writeText(uid).then(function () {
      var btn = document.getElementById("profileUidCopyBtn");
      if (btn) {
        btn.textContent = "✓ Copied!";
        btn.style.color = "#4ade80";
        btn.style.borderColor = "rgba(74,222,128,0.3)";
        setTimeout(function () {
          btn.textContent = "Copy UID";
          btn.style.color = "";
          btn.style.borderColor = "";
        }, 2000);
      }
    });
  } catch (e) {
    /* Fallback for older browsers */
    var el = document.createElement("textarea");
    el.value = uid;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    el.remove();
    if (typeof showToast === "function")
      showToast("✓ UID copied to clipboard!");
  }
};

/* ═══════════════════════════════════════════════════════════════
   GIFT POINTS SYSTEM
   Flow:
     1. Sender pastes recipient UID
     2. Picks amount (must have enough pts)
     3. svSendGift() verifies, deducts from sender, adds to recipient
        via direct Firebase RTDB write to users/{recipientUid}/sv_points
     4. Also writes a gift notification to gifts/{recipientUid}/{pushKey}
        so the recipient sees a toast on their next login
═══════════════════════════════════════════════════════════════ */

window.openGiftPointsModal = function () {
  var m = document.getElementById("giftPointsModal");
  if (!m) return;
  // Reset state
  var uid_in = document.getElementById("giftUidInput");
  var amt_in = document.getElementById("giftAmtInput");
  var err = document.getElementById("giftPointsError");
  if (uid_in) uid_in.value = "";
  if (amt_in) amt_in.value = "";
  if (err) {
    err.style.display = "none";
    err.textContent = "";
  }
  // Update balance display
  var bal = typeof _svpGetPoints === "function" ? _svpGetPoints() : 0;
  var balEl = document.getElementById("giftMyBalance");
  if (balEl) balEl.textContent = "⭐ " + bal + " pts";
  m.style.display = "flex";
};

window.closeGiftPointsModal = function () {
  var m = document.getElementById("giftPointsModal");
  if (m) m.style.display = "none";
};

window.svGiftSetAmt = function (n) {
  var inp = document.getElementById("giftAmtInput");
  if (inp) {
    inp.value = n;
    inp.focus();
  }
  // Highlight the selected preset button
  document.querySelectorAll(".gift-amt-btn").forEach(function (b) {
    var isActive = parseInt(b.textContent, 10) === n;
    b.style.background = isActive
      ? "rgba(232,98,42,0.2)"
      : "rgba(255,255,255,0.05)";
    b.style.borderColor = isActive
      ? "rgba(232,98,42,0.5)"
      : "rgba(255,255,255,0.1)";
    b.style.color = isActive ? "#e8622a" : "rgba(255,255,255,0.6)";
  });
};

function _giftShowError(msg) {
  var err = document.getElementById("giftPointsError");
  if (!err) return;
  err.textContent = msg;
  err.style.display = "block";
}
function _giftHideError() {
  var err = document.getElementById("giftPointsError");
  if (err) err.style.display = "none";
}

window.svSendGift = function () {
  _giftHideError();

  if (window.SV_GUEST) {
    if (window._requireAuth) window._requireAuth("Gifting points");
    return;
  }

  var senderUid = window._svUid || (window._svUser && window._svUser.uid);
  if (!senderUid) {
    _giftShowError("You must be signed in to gift points.");
    return;
  }

  var recipientUid = (
    document.getElementById("giftUidInput").value || ""
  ).trim();
  if (!recipientUid) {
    _giftShowError("Please enter the recipient's UID.");
    return;
  }
  if (recipientUid === senderUid) {
    _giftShowError("You can't gift points to yourself!");
    return;
  }

  var amount = parseInt(document.getElementById("giftAmtInput").value, 10);
  if (!amount || amount < 1) {
    _giftShowError("Enter a valid amount (minimum 1 pt).");
    return;
  }
  if (amount > 10000) {
    _giftShowError("Maximum gift is 10,000 pts at once.");
    return;
  }

  var bal = typeof _svpGetPoints === "function" ? _svpGetPoints() : 0;
  if (bal < amount) {
    _giftShowError("Not enough points. You have " + bal + " pts.");
    return;
  }

  /* Verify recipient exists in Firebase before deducting */
  var btn = document.getElementById("giftSendBtn");
  if (btn) {
    btn.textContent = "Sending…";
    btn.style.opacity = "0.6";
    btn.disabled = true;
  }

  var rtdb = window._firebaseRTDB;
  if (!rtdb) {
    _giftShowError("Firebase not ready — please try again.");
    _giftResetBtn();
    return;
  }

  var recipientRef = rtdb.ref(
    rtdb.getDatabase(),
    "users/" + recipientUid + "/sv_points",
  );

  rtdb
    .get(recipientRef)
    .then(function (snap) {
      /* Recipient must exist (any key under users/{uid} is fine — we check sv_points or fall back to 0) */
      var recipientPts = snap.exists() ? parseInt(snap.val(), 10) || 0 : null;

      /* If recipient node doesn't exist at all they may have no points key yet — check parent */
      var parentRef = rtdb.ref(rtdb.getDatabase(), "users/" + recipientUid);
      return rtdb.get(parentRef).then(function (parentSnap) {
        if (!parentSnap.exists()) {
          throw new Error(
            "Recipient UID not found. Double-check and try again.",
          );
        }
        /* Deduct from sender */
        var newSenderBal = bal - amount;
        FirebaseDB.setItem("sv_points", String(newSenderBal));
        if (typeof _svpUpdateUI === "function") _svpUpdateUI(newSenderBal);

        /* Add to recipient directly in RTDB */
        var addPts = (recipientPts !== null ? recipientPts : 0) + amount;
        return rtdb.set(recipientRef, addPts).then(function () {
          /* Write gift notification for recipient */
          var notifRef = rtdb.ref(rtdb.getDatabase(), "gifts/" + recipientUid);
          var senderName =
            (window._svProfile && window._svProfile.name) || "Someone";
          var senderBadge =
            (window._svProfile && window._svProfile.badge) || "🎬";
          /* push() equivalent via timestamp key */
          var notifKey = "gift_" + Date.now();
          var notifKeyRef = rtdb.ref(
            rtdb.getDatabase(),
            "gifts/" + recipientUid + "/" + notifKey,
          );
          return rtdb.set(notifKeyRef, {
            from: senderName,
            fromBadge: senderBadge,
            amount: amount,
            ts: Date.now(),
          });
        });
      });
    })
    .then(function () {
      window.closeGiftPointsModal();
      if (typeof showToast === "function") {
        showToast("🎁 Gift sent! " + amount + " pts on their way.");
      }
      _giftResetBtn();
    })
    .catch(function (e) {
      _giftShowError(e.message || "Something went wrong. Please try again.");
      _giftResetBtn();
    });
};

function _giftResetBtn() {
  var btn = document.getElementById("giftSendBtn");
  if (btn) {
    btn.textContent = "Send Gift 🎁";
    btn.style.opacity = "1";
    btn.disabled = false;
  }
}

/* Close gift modal on backdrop click */
document.addEventListener("DOMContentLoaded", function () {
  var m = document.getElementById("giftPointsModal");
  if (m) {
    m.addEventListener("click", function (e) {
      if (e.target === m) window.closeGiftPointsModal();
    });
  }
});

/* ── Check for pending gift notifications on login ── */
window._svCheckGiftNotifs = function () {
  var uid = window._svUid || (window._svUser && window._svUser.uid);
  if (!uid || window.SV_GUEST) return;
  var rtdb = window._firebaseRTDB;
  if (!rtdb) return;
  var giftsRef = rtdb.ref(rtdb.getDatabase(), "gifts/" + uid);
  rtdb
    .get(giftsRef)
    .then(function (snap) {
      if (!snap.exists()) return;
      var gifts = snap.val();
      var totalGifted = 0;
      var giftMessages = [];
      Object.values(gifts).forEach(function (g) {
        totalGifted += g.amount || 0;
        giftMessages.push(
          (g.fromBadge || "🎁") +
            " " +
            (g.from || "Someone") +
            " gifted you " +
            g.amount +
            " pts!",
        );
      });
      if (totalGifted > 0) {
        /* Credit the points */
        var cur = typeof _svpGetPoints === "function" ? _svpGetPoints() : 0;
        FirebaseDB.setItem("sv_points", String(cur + totalGifted));
        if (typeof _svpUpdateUI === "function") _svpUpdateUI(cur + totalGifted);
        /* Show toasts (staggered) */
        giftMessages.forEach(function (msg, i) {
          setTimeout(
            function () {
              if (typeof showToast === "function") showToast("🎁 " + msg);
            },
            2500 + i * 1800,
          );
        });
        /* Clear claimed notifications */
        rtdb.remove(giftsRef).catch(function () {});
      }
    })
    .catch(function () {});
};