import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  get,
  push,
  remove,
  onValue,
  child,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBInh8HXbwHLjwTwqEbS_QIN1KzvdZiMDE",
  authDomain: "movies-5967a.firebaseapp.com",
  databaseURL: "https://movies-5967a-default-rtdb.firebaseio.com",
  projectId: "movies-5967a",
  appId: "1:265655431989:web:1aeb61a5474b4dfb20527c",
  measurementId: "G-DW8Q9795JY",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// ─── In-memory cache ────────────────────────────────────────────
const _cache = {};
let _uid = null;

// ─── FirebaseDB API ─────────────────────────────────────────────
window.FirebaseDB = {
  setItem(key, value) {
    _cache[key] = value;
    if (!_uid) return;
    const fbKey = key.replace(/[.#$[\]]/g, "_");
    set(ref(db, `users/${_uid}/${fbKey}`), value).catch(() => {});
  },
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(_cache, key)
      ? _cache[key]
      : null;
  },
  removeItem(key) {
    delete _cache[key];
    if (!_uid) return;
    const fbKey = key.replace(/[.#$[\]]/g, "_");
    remove(ref(db, `users/${_uid}/${fbKey}`)).catch(() => {});
  },
  get length() {
    return Object.keys(_cache).length;
  },
  key(i) {
    return Object.keys(_cache)[i] || null;
  },
  async hydrate(uid, callback) {
    _uid = uid;
    window._svUid = uid;
    try {
      const snap = await get(child(ref(db), `users/${uid}`));
      if (snap.exists()) {
        Object.entries(snap.val()).forEach(([k, v]) => {
          _cache[k] = v;
        });
      }
    } catch (e) {
      console.warn("[FirebaseDB] hydrate failed", e);
    }
    if (typeof callback === "function") callback();
  },
};

// ─── Comments API ────────────────────────────────────────────────
window.FirebaseComments = {
  async post(contentKey, text, authorName, authorColor, authorBadge) {
    if (!_uid) return null;
    const r = push(ref(db, `comments/${contentKey}`));
    await set(r, {
      uid: _uid,
      author: authorName || "Anonymous",
      color: authorColor || "#e8622a",
      badge: authorBadge || "🎬",
      text,
      ts: Date.now(),
    });
    return r.key;
  },
  async delete(contentKey, commentId) {
    if (!_uid) return;
    await remove(ref(db, `comments/${contentKey}/${commentId}`));
  },
  listen(contentKey, callback) {
    const r = ref(db, `comments/${contentKey}`);
    return onValue(r, (snap) => {
      const list = [];
      if (snap.exists()) {
        snap.forEach((child) => {
          list.push({ id: child.key, ...child.val() });
        });
      }
      callback(list.sort((a, b) => b.ts - a.ts));
    });
  },
};

// ─── Profile API ─────────────────────────────────────────────────
window.FirebaseProfile = {
  async save(profile) {
    if (!_uid) return;
    await set(ref(db, `profiles/${_uid}`), profile);
  },
  async load(uid) {
    const snap = await get(ref(db, `profiles/${uid || _uid}`));
    return snap.exists() ? snap.val() : null;
  },
  async loadPublic(uid) {
    const snap = await get(ref(db, `profiles/${uid}`));
    return snap.exists() ? snap.val() : null;
  },
};

// ─── Leaderboard API ─────────────────────────────────────────────
window.FirebaseLeaderboard = {
  async addTime(seconds) {
    if (!_uid || seconds <= 0) return;
    try {
      const r = ref(db, `leaderboard/${_uid}`);
      const snap = await get(r);
      const current = snap.exists() ? snap.val() : { totalSeconds: 0 };
      const profile = window._svProfile || {};
      await set(r, {
        totalSeconds: (current.totalSeconds || 0) + seconds,
        name: profile.name || current.name || "Anonymous",
        badge: profile.badge || current.badge || "🎬",
        color: profile.color || current.color || "#e8622a",
        updatedAt: Date.now(),
      });
    } catch (e) {
      console.warn("[Leaderboard] addTime failed", e);
    }
  },
  listen(callback, limit = 50) {
    const r = ref(db, "leaderboard");
    return onValue(r, (snap) => {
      const list = [];
      if (snap.exists())
        snap.forEach((c) => list.push({ uid: c.key, ...c.val() }));
      list.sort((a, b) => (b.totalSeconds || 0) - (a.totalSeconds || 0));
      callback(list.slice(0, limit));
    });
  },
  getCurrentUid() {
    return _uid;
  },
};

// ─── Reactions API (global counts stored in Firebase) ────────────
window.FirebaseReactions = {
  async toggle(contentKey, reactionType, isAdding) {
    if (!_uid) return;
    const r = ref(db, `reactions/${contentKey}/${reactionType}`);
    try {
      const snap = await get(r);
      const current = snap.exists() ? snap.val() || 0 : 0;
      await set(r, Math.max(0, current + (isAdding ? 1 : -1)));
    } catch (e) {
      console.warn("[Reactions] toggle failed", e);
    }
  },
  listenMostLoved(callback, limit = 8) {
    const r = ref(db, "reactions");
    return onValue(r, (snap) => {
      if (!snap.exists()) {
        callback([]);
        return;
      }
      const results = [];
      snap.forEach((contentSnap) => {
        let total = 0;
        contentSnap.forEach((typeSnap) => {
          total += typeSnap.val() || 0;
        });
        if (total > 0)
          results.push({ contentKey: contentSnap.key, totalReactions: total });
      });
      results.sort((a, b) => b.totalReactions - a.totalReactions);
      callback(results.slice(0, limit));
    });
  },
};

// ─── Expose RTDB helpers for non-module watch party code ────────────────────
// The watch party scripts run in regular <script> tags (not ES modules) and
// cannot import from firebase-database.js directly. We bridge the gap here.
window._firebaseRTDB = { getDatabase, ref, set, get, remove, onValue };

// ─── Auth state observer ─────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (user) {
    window._svUser = user;
    if (window._svLoaderAdvance)
      window._svLoaderAdvance(1, "Loading your profile…");
    try {
      const profile = await window.FirebaseProfile.load(user.uid);
      window._svProfile = profile || {
        name: user.displayName || user.email.split("@")[0],
        badge: "🎬",
        color: "#e8622a",
        bio: "",
      };
    } catch (e) {
      console.warn("[Auth] profile load failed", e);
    }
    if (window._svLoaderAdvance) window._svLoaderAdvance(2, "Almost ready…");
    try {
      await window.FirebaseDB.hydrate(user.uid, () => {
        window._svAuthReady = true;
        document.getElementById("authScreen").style.display = "none";
        document.getElementById("appRoot").style.display = "";
        if (typeof window._svAppReady === "function") window._svAppReady();
        else window._svAppReadyPending = true;
        if (window._svLoaderDismiss) window._svLoaderDismiss();
      });
    } catch (e) {
      console.warn("[Auth] hydrate failed", e);
      if (window._svLoaderDismiss) window._svLoaderDismiss();
    }
  } else {
    window._svUser = null;
    window._svProfile = null;
    document.getElementById("authScreen").style.display = "flex";
    document.getElementById("appRoot").style.display = "none";
    if (window._svLoaderDismiss) window._svLoaderDismiss();
  }
});

// ─── Exposed auth actions ─────────────────────────────────────────
window._fbSignUp = async (email, password, displayName) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  const profile = { name: displayName, badge: "🎬", color: "#e8622a", bio: "" };
  await window.FirebaseProfile.save(profile);
  return cred.user;
};
window._fbSignIn = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);
window._fbSignOut = () => signOut(auth);

window._fbGoogleSignIn = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const cred = await signInWithPopup(auth, provider);
  // Create a profile entry if this is the user's first Google sign-in
  const existing = await window.FirebaseProfile.load(cred.user.uid);
  if (!existing) {
    const profile = {
      name: cred.user.displayName || cred.user.email.split("@")[0],
      badge: "🎬",
      color: "#e8622a",
      bio: "",
    };
    await window.FirebaseProfile.save(profile);
  }
  return cred.user;
};
