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
    "openWatchTogetherModal",
    "closeWatchTogetherModal",
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
    "wtHostPlay",
    "wtHostPause",
    "wtLeave",
    "wtEndSession",
    "wtCopyLink",
    "wtJoinFromInput",
    "closeWatchTogether",
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
  // checkAndUnlock must return true to allow play
  window.checkAndUnlock = function () {
    return true;
  };
  window.tryUnlock = function () {
    return true;
  };
})();

/* ═══════════════════════════════════════════════════════
   TASTE PROFILE CARD  —  global functions
═══════════════════════════════════════════════════════ */

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
    // Try to pull from FirebaseDB or localStorage-like store
    try {
      const raw = window.FirebaseDB
        ? window.FirebaseDB.getItem("completed") || "[]"
        : localStorage.getItem("sv_completed") || "[]";
      return JSON.parse(raw);
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

  function analyzeWatchData() {
    const catalog = getCatalog();
    const completed = getWatched();
    const watchlist = getWatchlistItems();
    const ratings = getRatings();

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

    // Estimate hours (avg 100 min per title)
    const estHours = Math.round((watchedCount * 100) / 60);

    return { watchedCount, ratedCount, topGenres, decadeCount, estHours };
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

  /* ── main builder ── */
  window.buildTasteCard = function () {
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
    if (tcH) tcH.textContent = (data.estHours || 0) + "h";
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

    // Re-trigger card animation
    const card = document.getElementById("tasteCardEl");
    if (card) {
      card.style.animation = "none";
      void card.offsetHeight;
      card.style.animation = "";
    }
  };

  function watchlist_fallback() {
    try {
      const raw = window.FirebaseDB
        ? window.FirebaseDB.getItem("watchlist") || "[]"
        : localStorage.getItem("sv_watchlist") || "[]";
      return JSON.parse(raw).length;
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
