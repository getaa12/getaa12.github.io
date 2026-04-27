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
  storageBucket: "movies-5967a.firebasestorage.app",
  messagingSenderId: "265655431989",
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

// ─── Expose RTDB helpers for non-module watch party code ────────────────────
// The watch party scripts run in regular <script> tags (not ES modules) and
// cannot import from firebase-database.js directly. We bridge the gap here.
window._firebaseRTDB = { getDatabase, ref, set, get, remove, onValue };

// ─── Auth state observer ─────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (user) {
    window._svUser = user;
    // Load profile from DB
    const profile = await window.FirebaseProfile.load(user.uid);
    window._svProfile = profile || {
      name: user.displayName || user.email.split("@")[0],
      badge: "🎬",
      color: "#e8622a",
      bio: "",
    };
    // Hydrate user data cache
    await window.FirebaseDB.hydrate(user.uid, () => {
      window._svAuthReady = true;
      document.getElementById("authScreen").style.display = "none";
      document.getElementById("appRoot").style.display = "";
      if (typeof window._svAppReady === "function") window._svAppReady();
      else window._svAppReadyPending = true;
    });
  } else {
    window._svUser = null;
    window._svProfile = null;
    document.getElementById("authScreen").style.display = "flex";
    document.getElementById("appRoot").style.display = "none";
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
