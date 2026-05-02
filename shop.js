/* ═══════════════════════════════════════════════════════════════════
   STREAMVAULT SHOP SYSTEM — shop.js  (v2 — fully wired)
   ───────────────────────────────────────────────────────────────────

   HOW TO ADD TO YOUR APP:
     In index.html, after <script src="app.js"></script> add:
       <script src="shop.js"></script>

   To open the shop from any button:
       onclick="openShopModal()"

   STORAGE KEYS (FirebaseDB / localStorage shim):
     sv_shop_owned        — JSON array  of purchased product IDs
     sv_shop_active       — JSON object mapping slot → productId (equipped)
     sv_boost_double_exp  — timestamp (ms) when the 2× boost expires
     sv_wl_slots          — Number of extra watchlist slots purchased
     sv_wl_base           — Base free slots (default 10, set once on load)

   WATCHLIST SLOT SYSTEM:
     Every user starts with WL_BASE_FREE (10) free slots.
     Buying wl_slot_5 or wl_slot_20 adds permanently to sv_wl_slots.
     window.toggleWatchlist is patched to intercept ADD calls
     and block them when used >= total, showing a buy-more upsell instead.

   PRODUCTS  (id / cost):
     theme_noir         50 pts  — Noir CSS theme via data-sv-theme attribute
     theme_midnight    75 pts  — Midnight Blue accent theme
     theme_forest      75 pts  — Forest Green accent theme
     theme_royal       75 pts  — Royal Purple accent theme
     badge_cinephile    75 pts  — 🏅 on all .profile-badge-slot elements
     boost_double      100 pts  — 2× point multiplier for 24 h (stackable)
     feature_roulette  120 pts  — window._svRouletteplus = true + DOM gates
     cosmetic_gold      90 pts  — gold glow on #tasteCardEl
     wl_slot_5          40 pts  — +5 watchlist slots  (re-buyable)
     wl_slot_20        130 pts  — +20 watchlist slots (re-buyable)

═══════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ─────────────────────────────────────────────────────────────
     CONSTANTS
  ───────────────────────────────────────────────────────────────── */
  var WL_BASE_FREE = 1;
  var WL_KEY_SLOTS = "sv_wl_slots";
  var WL_KEY_BASE = "sv_wl_base";
  var SHOP_KEY_OWNED = "sv_shop_owned";
  var SHOP_KEY_ACT = "sv_shop_active";
  var BOOST_EXP_KEY = "sv_boost_double_exp";

  /* ─────────────────────────────────────────────────────────────
     PRODUCT CATALOGUE
  ───────────────────────────────────────────────────────────────── */
  var PRODUCTS = [
    {
      id: "theme_noir",
      name: "Noir Mode",
      desc: "High-contrast black & silver cinema theme applied globally.",
      price: 50,
      icon: "🎬",
      category: "theme",
      stackable: false,
      activate: function () {
        document.documentElement.setAttribute("data-sv-theme", "noir");
        if (!document.getElementById("_sv_noir_style")) {
          var s = document.createElement("style");
          s.id = "_sv_noir_style";
          s.textContent =
            "[data-sv-theme='noir']{" +
            "--bg:#0a0a0a!important;" +
            "--bg2:#111!important;" +
            "--card:#141414!important;" +
            "--accent:#b0b0b0!important;" +
            "--text:#e0e0e0!important;" +
            "filter:saturate(.25) contrast(1.1)" +
            "}";
          document.head.appendChild(s);
        }
        _setActive("theme", "theme_noir");
      },
      deactivate: function () {
        document.documentElement.removeAttribute("data-sv-theme");
        var s = document.getElementById("_sv_noir_style");
        if (s) s.remove();
      },
    },

    {
      id: "theme_midnight",
      name: "Midnight Blue",
      desc: "Deep navy backgrounds with electric blue accents. Calm, cinematic, focused.",
      price: 75,
      icon: "🌙",
      category: "theme",
      stackable: false,
      activate: function () {
        document.documentElement.setAttribute("data-sv-theme", "midnight");
        if (!document.getElementById("_sv_midnight_style")) {
          var s = document.createElement("style");
          s.id = "_sv_midnight_style";
          s.textContent =
            "[data-sv-theme='midnight']{" +
            "--bg:#070d1a!important;" +
            "--bg2:#0d1526!important;" +
            "--bg3:#121e33!important;" +
            "--bg4:#182440!important;" +
            "--accent:#3b82f6!important;" +
            "--accent2:#60a5fa!important;" +
            "--accent-glow:rgba(59,130,246,0.18)!important;" +
            "--border:rgba(59,130,246,0.1)!important;" +
            "--border2:rgba(59,130,246,0.2)!important" +
            "}";
          document.head.appendChild(s);
        }
        _setActive("theme", "theme_midnight");
      },
      deactivate: function () {
        document.documentElement.removeAttribute("data-sv-theme");
        var s = document.getElementById("_sv_midnight_style");
        if (s) s.remove();
      },
    },

    {
      id: "theme_forest",
      name: "Forest Green",
      desc: "Dark earthy tones with rich emerald accents. Organic and easy on the eyes.",
      price: 75,
      icon: "🌿",
      category: "theme",
      stackable: false,
      activate: function () {
        document.documentElement.setAttribute("data-sv-theme", "forest");
        if (!document.getElementById("_sv_forest_style")) {
          var s = document.createElement("style");
          s.id = "_sv_forest_style";
          s.textContent =
            "[data-sv-theme='forest']{" +
            "--bg:#060e09!important;" +
            "--bg2:#0b1610!important;" +
            "--bg3:#101f16!important;" +
            "--bg4:#162a1d!important;" +
            "--accent:#22c55e!important;" +
            "--accent2:#4ade80!important;" +
            "--accent-glow:rgba(34,197,94,0.15)!important;" +
            "--border:rgba(34,197,94,0.1)!important;" +
            "--border2:rgba(34,197,94,0.2)!important" +
            "}";
          document.head.appendChild(s);
        }
        _setActive("theme", "theme_forest");
      },
      deactivate: function () {
        document.documentElement.removeAttribute("data-sv-theme");
        var s = document.getElementById("_sv_forest_style");
        if (s) s.remove();
      },
    },

    {
      id: "theme_royal",
      name: "Royal Purple",
      desc: "Rich deep purples with vivid violet accents. Bold, dramatic, premium.",
      price: 75,
      icon: "👑",
      category: "theme",
      stackable: false,
      activate: function () {
        document.documentElement.setAttribute("data-sv-theme", "royal");
        if (!document.getElementById("_sv_royal_style")) {
          var s = document.createElement("style");
          s.id = "_sv_royal_style";
          s.textContent =
            "[data-sv-theme='royal']{" +
            "--bg:#080612!important;" +
            "--bg2:#0f0b1e!important;" +
            "--bg3:#16102a!important;" +
            "--bg4:#1e1636!important;" +
            "--accent:#a855f7!important;" +
            "--accent2:#c084fc!important;" +
            "--accent-glow:rgba(168,85,247,0.18)!important;" +
            "--border:rgba(168,85,247,0.1)!important;" +
            "--border2:rgba(168,85,247,0.2)!important" +
            "}";
          document.head.appendChild(s);
        }
        _setActive("theme", "theme_royal");
      },
      deactivate: function () {
        document.documentElement.removeAttribute("data-sv-theme");
        var s = document.getElementById("_sv_royal_style");
        if (s) s.remove();
      },
    },

    {
      id: "badge_cinephile",
      name: "Cinéphile Badge",
      desc: "Displays a gold 🏅 badge next to your name on your profile.",
      price: 75,
      icon: "🏅",
      category: "badge",
      stackable: false,
      activate: function () {
        _setActive("badge", "badge_cinephile");
        _applyBadge("🏅");
        /* Watch for profile modal re-renders */
        if (!window._svBadgeObserver) {
          window._svBadgeObserver = new MutationObserver(function () {
            if (_owns("badge_cinephile")) _applyBadge("🏅");
          });
          window._svBadgeObserver.observe(document.body, {
            childList: true,
            subtree: true,
          });
        }
      },
      deactivate: function () {
        _applyBadge("");
      },
    },

    {
      id: "boost_double",
      name: "Double Points (24h)",
      desc: "Every point earned is doubled for 24 hours. Stackable to extend.",
      price: 100,
      icon: "⚡",
      category: "boost",
      stackable: true,
      activate: function () {
        /* Stack on remaining time if boost is still active */
        var base = _boostExpiry() > Date.now() ? _boostExpiry() : Date.now();
        var exp = base + 24 * 60 * 60 * 1000;
        try {
          FirebaseDB.setItem(BOOST_EXP_KEY, String(exp));
        } catch (e) {}
        _patchAddPoints();
        _svToast("⚡ Double Points active for 24 h!");
      },
      deactivate: null,
    },

    {
      id: "feature_roulette",
      name: "Roulette+",
      desc: "Unlocks genre filters & mood picker inside Movie Roulette.",
      price: 120,
      icon: "🎰",
      category: "feature",
      stackable: false,
      activate: function () {
        _setActive("feature_roulette", "feature_roulette");
        window._svRouletteplus = true;
        if (window._svRoulette && window._svRoulette.setPlus)
          window._svRoulette.setPlus(true);
        document.querySelectorAll(".roulette-plus-gate").forEach(function (el) {
          el.style.display = "";
          el.removeAttribute("disabled");
        });
        _svToast("🎰 Roulette+ unlocked!");
      },
      deactivate: null,
    },

    {
      id: "cosmetic_gold",
      name: "Gold Taste Card",
      desc: "Your Taste Card gets a shimmering gold glow when viewing or sharing.",
      price: 90,
      icon: "✨",
      category: "cosmetic",
      stackable: false,
      activate: function () {
        _setActive("cosmetic", "cosmetic_gold");
        _applyGoldBorder(true);
        if (!window._svGoldObserver) {
          window._svGoldObserver = new MutationObserver(function () {
            if (_owns("cosmetic_gold")) _applyGoldBorder(true);
          });
          window._svGoldObserver.observe(document.body, {
            childList: true,
            subtree: true,
          });
        }
        _svToast("✨ Gold Taste Card activated!");
      },
      deactivate: function () {
        _applyGoldBorder(false);
      },
    },

    {
      id: "wl_slot_5",
      name: "+5 Watchlist Slots",
      desc: "Permanently add 5 more slots to your watchlist capacity.",
      price: 40,
      icon: "📋",
      category: "watchlist",
      stackable: true,
      activate: function () {
        var cur = _extraSlots();
        try {
          FirebaseDB.setItem(WL_KEY_SLOTS, String(cur + 5));
        } catch (e) {}
        _svToast("📋 +5 slots added! Total now: " + _totalSlots());
        _refreshSlotDisplay();
      },
      deactivate: null,
    },

    {
      id: "wl_slot_20",
      name: "+20 Watchlist Slots",
      desc: "Best value — add 20 watchlist slots in one purchase.",
      price: 130,
      icon: "📦",
      category: "watchlist",
      stackable: true,
      activate: function () {
        var cur = _extraSlots();
        try {
          FirebaseDB.setItem(WL_KEY_SLOTS, String(cur + 20));
        } catch (e) {}
        _svToast("📦 +20 slots added! Total now: " + _totalSlots());
        _refreshSlotDisplay();
      },
      deactivate: null,
    },
  ];

  /* ─────────────────────────────────────────────────────────────
     DB HELPER — always uses FirebaseDB if available
  ───────────────────────────────────────────────────────────────── */
  function _db() {
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

  /* ─────────────────────────────────────────────────────────────
     OWNED / ACTIVE STORAGE
  ───────────────────────────────────────────────────────────────── */
  function _getOwned() {
    try {
      return JSON.parse(_db().getItem(SHOP_KEY_OWNED) || "[]");
    } catch (e) {
      return [];
    }
  }
  function _setOwned(arr) {
    try {
      _db().setItem(SHOP_KEY_OWNED, JSON.stringify(arr));
    } catch (e) {}
  }
  function _owns(id) {
    return _getOwned().indexOf(id) !== -1;
  }

  function _getActive() {
    try {
      return JSON.parse(_db().getItem(SHOP_KEY_ACT) || "{}");
    } catch (e) {
      return {};
    }
  }
  function _setActive(slot, id) {
    var a = _getActive();
    a[slot] = id;
    try {
      _db().setItem(SHOP_KEY_ACT, JSON.stringify(a));
    } catch (e) {}
  }

  function _findProduct(id) {
    for (var i = 0; i < PRODUCTS.length; i++) {
      if (PRODUCTS[i].id === id) return PRODUCTS[i];
    }
    return null;
  }

  /* ─────────────────────────────────────────────────────────────
     WATCHLIST SLOT HELPERS
  ───────────────────────────────────────────────────────────────── */
  function _freeSlots() {
    var v = parseInt(_db().getItem(WL_KEY_BASE) || String(WL_BASE_FREE), 10);
    return isNaN(v) ? WL_BASE_FREE : v;
  }
  function _extraSlots() {
    var v = parseInt(_db().getItem(WL_KEY_SLOTS) || "0", 10);
    return isNaN(v) ? 0 : v;
  }
  function _totalSlots() {
    return _freeSlots() + _extraSlots();
  }

  function _usedSlots() {
    try {
      var raw = _db().getItem("sv_mwl");
      if (raw) {
        var wl = typeof raw === "string" ? JSON.parse(raw) : raw;
        return (
          (wl.want || []).length +
          (wl.watching || []).length +
          (wl.done || []).length
        );
      }
      return JSON.parse(_db().getItem("sv_watchlist") || "[]").length;
    } catch (e) {
      return 0;
    }
  }

  function _refreshSlotDisplay() {
    var el = document.getElementById("_svShopSlotInfo");
    if (el) {
      el.textContent =
        "Watchlist: " + _usedSlots() + " / " + _totalSlots() + " slots used";
    }
  }

  /* PUBLIC guard — call before adding to watchlist */
  window._svShopSlotCheck = function () {
    if (_usedSlots() < _totalSlots()) return true;
    _showSlotUpsell();
    return false;
  };

  /* ─────────────────────────────────────────────────────────────
     SLOT UPSELL POPUP
  ───────────────────────────────────────────────────────────────── */
  function _showSlotUpsell() {
    var old = document.getElementById("_svSlotUpsell");
    if (old) old.remove();
    var d = document.createElement("div");
    d.id = "_svSlotUpsell";
    d.style.cssText =
      "position:fixed;inset:0;z-index:100020;display:flex;align-items:center;" +
      "justify-content:center;padding:20px;background:rgba(0,0,0,.82);backdrop-filter:blur(10px)";
    d.innerHTML =
      '<div style="background:#16161f;border:1px solid rgba(232,98,42,.3);border-radius:20px;' +
      "padding:32px 28px;max-width:380px;width:100%;text-align:center;" +
      'box-shadow:0 30px 80px rgba(0,0,0,.8)">' +
      '<div style="font-size:3rem;margin-bottom:12px">📋</div>' +
      '<div style="font-size:18px;font-weight:800;color:#f0f0f5;margin-bottom:8px">Watchlist Full!</div>' +
      '<div style="font-size:13px;color:rgba(255,255,255,.5);line-height:1.6;margin-bottom:8px">' +
      'Your free plan includes <strong style="color:#e8622a">1 slot</strong>.' +
      "</div>" +
      '<div style="font-size:12px;color:rgba(255,255,255,.35);margin-bottom:22px">' +
      "Upgrade in the Shop to save more titles. " +
      '+5 slots cost just <strong style="color:#e8622a">40 pts</strong>.' +
      "</div>" +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
      '<button onclick="closeShopModal&&closeShopModal();' +
      "setTimeout(openShopModal,50);" +
      "document.getElementById('_svSlotUpsell').remove()\" " +
      'style="flex:1;min-width:130px;padding:13px 0;border-radius:12px;border:none;' +
      "background:linear-gradient(135deg,#e8622a,#f59060);color:#fff;font-weight:700;" +
      'font-size:14px;cursor:pointer;font-family:inherit">🛍️ Open Shop</button>' +
      "<button onclick=\"document.getElementById('_svSlotUpsell').remove()\" " +
      'style="flex:1;min-width:90px;padding:13px 0;border-radius:12px;' +
      "border:1px solid rgba(255,255,255,.12);background:transparent;" +
      'color:rgba(255,255,255,.45);font-weight:600;font-size:14px;cursor:pointer;font-family:inherit">Cancel</button>' +
      "</div>" +
      "</div>";
    document.body.appendChild(d);
    d.addEventListener("click", function (e) {
      if (e.target === d) d.remove();
    });
  }

  /* ─────────────────────────────────────────────────────────────
     PATCH addToMultiWl TO ENFORCE SLOT LIMIT
     addToMultiWl is the single choke point for all watchlist adds.
     It is exposed on window by inline.js after _svAppReady runs.
  ───────────────────────────────────────────────────────────────── */
  function _patchToggleWatchlist() {
    var orig = window.addToMultiWl;
    if (typeof orig !== "function" || orig._slotPatched) return;

    window.addToMultiWl = function (item, tab) {
      /* Check if already in any tab — always allow moves/re-adds */
      var alreadyIn = false;
      try {
        var raw = _db().getItem("sv_mwl");
        var wl = raw ? JSON.parse(raw) : { want: [], watching: [], done: [] };
        var all = [].concat(wl.want || [], wl.watching || [], wl.done || []);
        alreadyIn = all.some(function (w) {
          return w.tmdbId === item.tmdbId && w.type === item.type;
        });
      } catch (e) {}

      if (alreadyIn) {
        /* Moving between tabs — bypass slot check */
        return orig.apply(this, arguments);
      }
      /* New add — enforce limit */
      if (!window._svShopSlotCheck()) return;
      return orig.apply(this, arguments);
    };
    window.addToMultiWl._slotPatched = true;
  }

  /* ─────────────────────────────────────────────────────────────
     DOUBLE-POINTS BOOST PATCH
     We intercept FirebaseDB.setItem for "sv_points" only during an
     active boost, doubling any positive delta.
  ───────────────────────────────────────────────────────────────── */
  function _boostExpiry() {
    var v = parseInt(_db().getItem(BOOST_EXP_KEY) || "0", 10);
    return isNaN(v) ? 0 : v;
  }
  function _boostActive() {
    return _boostExpiry() > Date.now();
  }

  var _pointsPatchApplied = false;
  var _lastKnownPts = -1;

  function _patchAddPoints() {
    if (_pointsPatchApplied) return;
    /* Only patch if FirebaseDB exists */
    if (!window.FirebaseDB) return;

    var origSetItem = window.FirebaseDB.setItem.bind(window.FirebaseDB);
    window.FirebaseDB.setItem = function (key, value) {
      if (key === "sv_points" && _boostActive()) {
        var newVal = parseInt(value, 10);
        if (!isNaN(newVal) && _lastKnownPts >= 0) {
          var delta = newVal - _lastKnownPts;
          if (delta > 0) value = String(newVal + delta); /* 2× the gain */
        }
        _lastKnownPts = parseInt(value, 10);
      } else if (key === "sv_points") {
        _lastKnownPts = parseInt(value, 10);
      }
      return origSetItem(key, value);
    };
    _pointsPatchApplied = true;
  }

  /* ─────────────────────────────────────────────────────────────
     COSMETIC HELPERS
  ───────────────────────────────────────────────────────────────── */
  function _applyBadge(emoji) {
    document.querySelectorAll(".profile-badge-slot").forEach(function (el) {
      el.textContent = emoji;
      el.style.display = emoji ? "inline" : "none";
    });
  }
  function _applyGoldBorder(on) {
    var card = document.getElementById("tasteCardEl");
    if (!card) return;
    card.style.boxShadow = on
      ? "0 0 0 3px #f5c842, 0 0 32px rgba(245,200,66,.4)"
      : "";
  }

  /* ─────────────────────────────────────────────────────────────
     SPEND POINTS
  ───────────────────────────────────────────────────────────────── */
  function _spendPoints(n) {
    try {
      var cur = typeof _svpGetPoints === "function" ? _svpGetPoints() : 0;
      if (cur < n) return false;
      var next = cur - n;
      FirebaseDB.setItem("sv_points", String(next));
      if (typeof _svpUpdateUI === "function") _svpUpdateUI(next);
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ─────────────────────────────────────────────────────────────
     PURCHASE FLOW
  ───────────────────────────────────────────────────────────────── */
  function _buy(id) {
    if (window.SV_GUEST) {
      if (window._requireAuth) window._requireAuth("Buying from the Shop");
      return;
    }
    var p = _findProduct(id);
    if (!p) return;

    var owned = _getOwned();
    var own = owned.indexOf(id) !== -1;

    /* Non-stackable already owned → just equip */
    if (own && !p.stackable) {
      if (typeof p.activate === "function") p.activate();
      _renderGrid();
      _svToast("✅ " + p.name + " equipped!");
      return;
    }

    var bal = typeof _svpGetPoints === "function" ? _svpGetPoints() : 0;
    if (bal < p.price) {
      _svToast("❌ Need " + p.price + " pts — you have " + bal + ".");
      return;
    }

    _showConfirm(p, function () {
      if (!_spendPoints(p.price)) {
        _svToast("❌ Purchase failed.");
        return;
      }

      if (owned.indexOf(id) === -1) owned.push(id);
      _setOwned(owned);

      if (typeof p.activate === "function") p.activate();

      _renderGrid();
      var balEl = document.getElementById("_svShopBalance");
      if (balEl) {
        balEl.textContent =
          "⭐ " +
          (typeof _svpGetPoints === "function" ? _svpGetPoints() : 0) +
          " pts";
      }
      _svToast("🛍️ " + p.name + " purchased!");
    });
  }
  window._svShopBuy = _buy;

  function _unequip(id) {
    var p = _findProduct(id);
    if (!p || typeof p.deactivate !== "function") return;
    p.deactivate();
    var a = _getActive();
    for (var k in a) {
      if (a.hasOwnProperty(k) && a[k] === id) delete a[k];
    }
    try {
      _db().setItem(SHOP_KEY_ACT, JSON.stringify(a));
    } catch (e) {}
    _renderGrid();
    _svToast("2705 " + p.name + " unequipped.");
  }
  window._svShopUnequip = _unequip;

  /* ─────────────────────────────────────────────────────────────
     CONFIRM DIALOG
  ───────────────────────────────────────────────────────────────── */
  function _showConfirm(p, onYes) {
    var old = document.getElementById("_svShopConfirm");
    if (old) old.remove();
    var wrap = document.createElement("div");
    wrap.id = "_svShopConfirm";
    wrap.style.cssText =
      "position:fixed;inset:0;z-index:100015;display:flex;align-items:center;" +
      "justify-content:center;padding:20px;background:rgba(0,0,0,.82);backdrop-filter:blur(8px)";
    wrap.innerHTML =
      '<div style="background:#16161f;border:1px solid rgba(232,98,42,.25);border-radius:20px;' +
      'padding:32px 28px;max-width:360px;width:100%;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.7)">' +
      '<div style="font-size:3rem;margin-bottom:12px">' +
      p.icon +
      "</div>" +
      '<div style="font-size:17px;font-weight:800;color:#f0f0f5;margin-bottom:6px">' +
      p.name +
      "</div>" +
      '<div style="font-size:12px;color:rgba(255,255,255,.45);line-height:1.6;margin-bottom:18px">' +
      p.desc +
      "</div>" +
      '<div style="font-size:20px;font-weight:800;color:#e8622a;margin-bottom:22px">⭐ ' +
      p.price +
      " pts</div>" +
      '<div style="display:flex;gap:10px">' +
      '<button id="_svConfirmYes" style="flex:1;padding:12px 0;border-radius:11px;border:none;' +
      'background:linear-gradient(135deg,#e8622a,#f59060);color:#fff;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit">Confirm</button>' +
      '<button id="_svConfirmNo" style="flex:1;padding:12px 0;border-radius:11px;' +
      "border:1px solid rgba(255,255,255,.12);background:transparent;" +
      'color:rgba(255,255,255,.5);font-weight:600;font-size:14px;cursor:pointer;font-family:inherit">Cancel</button>' +
      "</div>" +
      "</div>";
    document.body.appendChild(wrap);
    document.getElementById("_svConfirmYes").onclick = function () {
      wrap.remove();
      onYes();
    };
    document.getElementById("_svConfirmNo").onclick = function () {
      wrap.remove();
    };
    wrap.addEventListener("click", function (e) {
      if (e.target === wrap) wrap.remove();
    });
  }

  /* ─────────────────────────────────────────────────────────────
     RENDER PRODUCT GRID
  ───────────────────────────────────────────────────────────────── */
  /* Returns a small coloured dot showing the theme's accent colour */
  var _THEME_ACCENTS = {
    theme_noir: "#b0b0b0",
    theme_midnight: "#3b82f6",
    theme_forest: "#22c55e",
    theme_royal: "#a855f7",
  };
  function _themeSwatchHtml(id) {
    var col = _THEME_ACCENTS[id];
    if (!col) return "";
    return (
      '<span style="position:absolute;bottom:-2px;right:-4px;width:12px;height:12px;' +
      "border-radius:50%;background:" +
      col +
      ";" +
      'border:2px solid rgba(0,0,0,0.6);display:block"></span>'
    );
  }

  function _renderGrid() {
    var grid = document.getElementById("_svShopGrid");
    if (!grid) return;

    var bal = typeof _svpGetPoints === "function" ? _svpGetPoints() : 0;
    var owned = _getOwned();
    var active = _getActive();

    function _isActive(p) {
      if (p.category === "watchlist" || p.category === "boost") return false;
      for (var k in active) {
        if (active.hasOwnProperty(k) && active[k] === p.id) return true;
      }
      return false;
    }

    var html = "";
    PRODUCTS.forEach(function (p) {
      var own = owned.indexOf(p.id) !== -1;
      var act = _isActive(p);
      var afford = bal >= p.price;
      var tagHtml = "",
        btnTxt = "",
        btnStyle = "";

      if (p.category === "boost") {
        var exp = _boostExpiry();
        if (exp > Date.now()) {
          var mLeft = Math.round((exp - Date.now()) / 60000);
          tagHtml =
            '<span style="font-size:10px;padding:2px 8px;border-radius:20px;' +
            'background:rgba(245,200,66,.12);color:#f5c842;border:1px solid rgba(245,200,66,.22)">⚡ ~' +
            mLeft +
            "m left</span>";
          btnTxt = "Extend +24h";
          btnStyle = afford
            ? "background:rgba(232,98,42,.15);color:#e8622a;border:1px solid rgba(232,98,42,.3);"
            : "background:rgba(255,255,255,.04);color:rgba(255,255,255,.3);cursor:not-allowed;border:none;";
        } else {
          tagHtml =
            '<span style="font-size:10px;padding:2px 8px;border-radius:20px;' +
            'background:rgba(232,98,42,.1);color:#e8622a;border:1px solid rgba(232,98,42,.2)">⭐ ' +
            p.price +
            " pts</span>";
          btnTxt = afford ? "Buy Now" : "Need " + (p.price - bal) + " more pts";
          btnStyle = afford
            ? "background:linear-gradient(135deg,#e8622a,#f59060);color:#fff;border:none;"
            : "background:rgba(255,255,255,.04);color:rgba(255,255,255,.3);cursor:not-allowed;border:none;";
        }
      } else if (p.category === "watchlist") {
        var slotTag = p.id === "wl_slot_5" ? "+5 slots" : "+20 slots";
        tagHtml =
          '<span style="font-size:10px;padding:2px 8px;border-radius:20px;' +
          'background:rgba(232,98,42,.1);color:#e8622a;border:1px solid rgba(232,98,42,.2)">⭐ ' +
          p.price +
          " pts · " +
          slotTag +
          "</span>";
        btnTxt = afford ? "Buy Now" : "Need " + (p.price - bal) + " more pts";
        btnStyle = afford
          ? "background:linear-gradient(135deg,#e8622a,#f59060);color:#fff;border:none;"
          : "background:rgba(255,255,255,.04);color:rgba(255,255,255,.3);cursor:not-allowed;border:none;";
      } else if (act) {
        tagHtml =
          '<span style="font-size:10px;padding:2px 8px;border-radius:20px;' +
          'background:rgba(40,180,80,.1);color:#4ade80;border:1px solid rgba(74,222,128,.2)">✓ ACTIVE</span>';
        if (typeof p.deactivate === "function") {
          btnTxt = "Unequip";
          btnStyle =
            "background:rgba(255,255,255,.06);color:rgba(255,255,255,.5);border:1px solid rgba(255,255,255,.12);";
        } else {
          btnTxt = "Equipped";
          btnStyle =
            "background:rgba(74,222,128,.07);color:#4ade80;border:1px solid rgba(74,222,128,.18);cursor:default;";
        }
      } else if (own) {
        tagHtml =
          '<span style="font-size:10px;padding:2px 8px;border-radius:20px;' +
          'background:rgba(255,255,255,.06);color:rgba(255,255,255,.4);border:1px solid rgba(255,255,255,.1)">OWNED</span>';
        btnTxt = "Equip";
        btnStyle =
          "background:rgba(232,98,42,.12);color:#e8622a;border:1px solid rgba(232,98,42,.25);";
      } else {
        tagHtml =
          '<span style="font-size:10px;padding:2px 8px;border-radius:20px;' +
          'background:rgba(232,98,42,.1);color:#e8622a;border:1px solid rgba(232,98,42,.2)">⭐ ' +
          p.price +
          " pts</span>";
        btnTxt = afford ? "Buy Now" : "Need " + (p.price - bal) + " more pts";
        btnStyle = afford
          ? "background:linear-gradient(135deg,#e8622a,#f59060);color:#fff;border:none;"
          : "background:rgba(255,255,255,.04);color:rgba(255,255,255,.3);cursor:not-allowed;border:none;";
      }

      html +=
        '<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);' +
        "border-radius:16px;padding:20px 16px 18px;display:flex;flex-direction:column;" +
        'align-items:center;text-align:center;gap:10px">' +
        '<div style="font-size:2.4rem;line-height:1;position:relative;display:inline-block">' +
        p.icon +
        (p.category === "theme" ? _themeSwatchHtml(p.id) : "") +
        "</div>" +
        '<div style="font-size:14px;font-weight:700;color:#f0f0f5">' +
        p.name +
        "</div>" +
        '<div style="font-size:11px;color:rgba(255,255,255,.4);line-height:1.5;min-height:30px">' +
        p.desc +
        "</div>" +
        tagHtml +
        '<button onclick="' +
        (act && typeof p.deactivate === "function"
          ? "window._svShopUnequip('"
          : "window._svShopBuy('") +
        p.id +
        "')\" " +
        'style="width:100%;padding:10px 0;border-radius:10px;font-weight:700;font-size:13px;' +
        "cursor:pointer;font-family:inherit;" +
        btnStyle +
        '">' +
        btnTxt +
        "</button>" +
        "</div>";
    });

    grid.innerHTML = html;
  }

  /* ─────────────────────────────────────────────────────────────
     MODAL BUILD + PUBLIC OPEN / CLOSE
  ───────────────────────────────────────────────────────────────── */
  function _buildModal() {
    if (document.getElementById("svShopModal")) return;
    var m = document.createElement("div");
    m.id = "svShopModal";
    m.style.cssText =
      "display:none;position:fixed;inset:0;z-index:99998;align-items:center;" +
      "justify-content:center;padding:16px;background:rgba(0,0,0,.78);backdrop-filter:blur(10px)";

    m.innerHTML =
      '<div style="background:#0f0f13;border:1px solid rgba(232,98,42,.2);border-radius:24px;' +
      "width:100%;max-width:700px;max-height:92vh;overflow:hidden;display:flex;" +
      'flex-direction:column;box-shadow:0 40px 100px rgba(0,0,0,.85)">' +
      /* header */
      '<div style="padding:22px 24px 0;display:flex;align-items:center;' +
      'justify-content:space-between;flex-wrap:wrap;gap:12px">' +
      "<div>" +
      '<div style="font-family:Outfit,system-ui,sans-serif;font-size:20px;font-weight:800;' +
      'color:#f0f0f5;letter-spacing:-.03em">🛍️ StreamVault Shop</div>' +
      '<div id="_svShopSlotInfo" style="font-size:11px;color:rgba(255,255,255,.35);margin-top:3px"></div>' +
      "</div>" +
      '<div style="display:flex;align-items:center;gap:10px">' +
      '<div id="_svShopBalance" style="font-size:13px;font-weight:700;color:#e8622a;' +
      "background:rgba(232,98,42,.1);border:1px solid rgba(232,98,42,.2);" +
      'padding:5px 14px;border-radius:20px;font-family:Outfit,system-ui,sans-serif">⭐ 0 pts</div>' +
      '<button onclick="window.closeShopModal()" style="width:32px;height:32px;border-radius:50%;' +
      "border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);" +
      "color:rgba(255,255,255,.5);font-size:15px;cursor:pointer;display:flex;" +
      'align-items:center;justify-content:center;font-family:inherit">✕</button>' +
      "</div>" +
      "</div>" +
      /* boost banner */
      '<div id="_svBoostBanner" style="display:none;margin:12px 24px 0;padding:9px 14px;' +
      "border-radius:10px;background:rgba(245,200,66,.07);border:1px solid rgba(245,200,66,.18);" +
      'font-size:12px;color:#f5c842;font-weight:600;font-family:Outfit,system-ui,sans-serif">⚡ Double Points boost is active!</div>' +
      /* grid */
      '<div style="flex:1;overflow-y:auto;padding:18px 24px 24px">' +
      '<div id="_svShopGrid" style="display:grid;' +
      'grid-template-columns:repeat(auto-fill,minmax(175px,1fr));gap:14px"></div>' +
      "</div>" +
      /* footer */
      '<div style="padding:12px 24px;border-top:1px solid rgba(255,255,255,.06);' +
      'display:flex;justify-content:center">' +
      '<button onclick="window.openPointsModal&&window.openPointsModal()" ' +
      'style="padding:9px 26px;border-radius:20px;border:1px solid rgba(232,98,42,.3);' +
      "background:rgba(232,98,42,.1);color:#e8622a;font-weight:700;font-size:13px;" +
      'cursor:pointer;font-family:Outfit,system-ui,sans-serif">⭐ Earn More Points</button>' +
      "</div>" +
      "</div>";

    document.body.appendChild(m);
    m.addEventListener("click", function (e) {
      if (e.target === m) window.closeShopModal();
    });
  }

  window.openShopModal = function () {
    _buildModal();
    var m = document.getElementById("svShopModal");
    if (!m) return;
    m.style.display = "flex";

    var bal = typeof _svpGetPoints === "function" ? _svpGetPoints() : 0;
    var balEl = document.getElementById("_svShopBalance");
    if (balEl) balEl.textContent = "⭐ " + bal + " pts";

    var bb = document.getElementById("_svBoostBanner");
    if (bb) bb.style.display = _boostActive() ? "block" : "none";

    _refreshSlotDisplay();
    _renderGrid();
  };

  window.closeShopModal = function () {
    var m = document.getElementById("svShopModal");
    if (m) m.style.display = "none";
  };

  /* ─────────────────────────────────────────────────────────────
     RESTORE PREVIOUSLY PURCHASED ITEMS ON PAGE LOAD
  ───────────────────────────────────────────────────────────────── */
  function _restoreAll() {
    var owned = _getOwned();
    var active = _getActive();

    if (active.theme && owned.indexOf(active.theme) !== -1) {
      var tp = _findProduct(active.theme);
      if (tp && typeof tp.activate === "function") tp.activate();
    }
    if (active.badge && owned.indexOf(active.badge) !== -1) {
      var bp = _findProduct(active.badge);
      if (bp && typeof bp.activate === "function") bp.activate();
    }
    if (
      active.cosmetic === "cosmetic_gold" &&
      owned.indexOf("cosmetic_gold") !== -1
    ) {
      setTimeout(function () {
        _applyGoldBorder(true);
      }, 1800);
      if (!window._svGoldObserver) {
        window._svGoldObserver = new MutationObserver(function () {
          if (_owns("cosmetic_gold")) _applyGoldBorder(true);
        });
        window._svGoldObserver.observe(document.body, {
          childList: true,
          subtree: true,
        });
      }
    }
    if (active.feature_roulette && owned.indexOf("feature_roulette") !== -1) {
      window._svRouletteplus = true;
      if (window._svRoulette && window._svRoulette.setPlus)
        window._svRoulette.setPlus(true);
      document.querySelectorAll(".roulette-plus-gate").forEach(function (el) {
        el.style.display = "";
        el.removeAttribute("disabled");
      });
    }
    if (_boostActive()) _patchAddPoints();
  }

  /* ─────────────────────────────────────────────────────────────
     TOAST
  ───────────────────────────────────────────────────────────────── */
  function _svToast(msg) {
    if (typeof showToast === "function") {
      showToast(msg);
      return;
    }
    var t = document.createElement("div");
    t.style.cssText =
      "position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(0);" +
      "background:#1e1e2e;border:1px solid rgba(255,255,255,.12);color:#f0f0f5;" +
      "font-size:13px;font-weight:600;padding:10px 20px;border-radius:30px;" +
      "z-index:999999;white-space:nowrap;pointer-events:none;font-family:Outfit,system-ui,sans-serif;";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () {
      t.style.transition = "opacity .3s";
      t.style.opacity = "0";
    }, 2600);
    setTimeout(function () {
      if (t.parentNode) t.remove();
    }, 3000);
  }

  /* ─────────────────────────────────────────────────────────────
     NAV BUTTON INJECTION
  ───────────────────────────────────────────────────────────────── */
  function _injectNavBtn() {
    if (document.getElementById("_svNavShopBtn")) return;
    var anchor =
      document.getElementById("navPointsDisplay") ||
      document.getElementById("earnPointsBtn");
    if (!anchor || !anchor.parentNode) return;
    var btn = document.createElement("button");
    btn.id = "_svNavShopBtn";
    btn.textContent = "🛍️ Shop";
    btn.onclick = window.openShopModal;
    btn.style.cssText =
      "margin-left:8px;padding:5px 13px;border-radius:20px;" +
      "border:1px solid rgba(232,98,42,.3);background:rgba(232,98,42,.1);" +
      "color:#e8622a;font-weight:700;font-size:12px;cursor:pointer;font-family:inherit";
    anchor.parentNode.insertBefore(btn, anchor.nextSibling);
  }

  /* ─────────────────────────────────────────────────────────────
     EXPOSE PUBLIC NAMESPACE
  ───────────────────────────────────────────────────────────────── */
  window._svShop = {
    getOwned: _getOwned,
    owns: _owns,
    totalSlots: _totalSlots,
    usedSlots: _usedSlots,
    extraSlots: _extraSlots,
    boostActive: _boostActive,
  };

  /* ─────────────────────────────────────────────────────────────
     INIT — runs after DOM + app.js are ready
  ───────────────────────────────────────────────────────────────── */
  // Inject nav button on DOMContentLoaded (doesn't need hydration)
  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(_injectNavBtn, 800);
  });

  // Everything that needs real user data (owned items, slots) runs AFTER
  // Firebase hydration completes — signalled by sv_mwl_changed.
  window.addEventListener(
    "sv_mwl_changed",
    function () {
      /* Enforce base slot count = 1 (free tier) */
      try {
        _db().setItem(WL_KEY_BASE, String(WL_BASE_FREE));
      } catch (e) {}
      _restoreAll();
      _patchToggleWatchlist();
    },
    { once: true },
  );

  /* ═══ END STREAMVAULT SHOP SYSTEM ═══ */
})();
