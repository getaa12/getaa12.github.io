/**
 * ═══════════════════════════════════════════════════════════════
 *  StreamVault — Weekly Challenge Writer
 *  Run with: node challenge-writer.js
 *
 *  PURPOSE: Writes a new challenge to Firebase `challenges/current`
 *           every Monday. Can be run as a cron job or manually.
 *
 *  SETUP:
 *    1. npm install firebase-admin
 *    2. Download your Firebase service account key from:
 *       Firebase Console → Project Settings → Service Accounts → Generate new private key
 *    3. Save it as serviceAccountKey.json next to this file
 *    4. Run: node challenge-writer.js
 *
 *  CRON (run every Monday at 00:05 UTC):
 *    5 0 * * 1  node /path/to/challenge-writer.js >> /var/log/sv-challenge.log 2>&1
 * ═══════════════════════════════════════════════════════════════
 */

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://movies-5967a-default-rtdb.firebaseio.com",
});

const db = admin.database();

// ── Challenge rotation ──────────────────────────────────────────
const CHALLENGES = [
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

// ── Helpers ─────────────────────────────────────────────────────

/** Returns ISO week ID e.g. "2025-W18" based on Monday-anchored week */
function getWeekId(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay() || 7; // Mon=1…Sun=7
  d.setDate(d.getDate() + 1 - day); // move to this Monday
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const week = Math.ceil(((d - jan4) / 86400000 + jan4.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Pick challenge deterministically based on week number */
function pickChallenge(weekId) {
  const weekNum = parseInt(weekId.split("W")[1], 10);
  return CHALLENGES[weekNum % CHALLENGES.length];
}

// ── Main ────────────────────────────────────────────────────────

async function writeChallenge(force = false) {
  const today = new Date();
  const isMonday = today.getDay() === 1;

  if (!isMonday && !force) {
    console.log(
      `[${today.toISOString()}] Not Monday — skipping. Use --force to override.`,
    );
    process.exit(0);
  }

  const weekId = getWeekId(today);
  const ref = db.ref("challenges/current");

  // Check if already written for this week
  const snap = await ref.once("value");
  if (snap.exists() && snap.val().weekId === weekId && !force) {
    console.log(
      `[${today.toISOString()}] Challenge for ${weekId} already exists — skipping.`,
    );
    process.exit(0);
  }

  const challenge = pickChallenge(weekId);
  const payload = {
    ...challenge,
    weekId,
    createdAt: Date.now(),
  };

  await ref.set(payload);
  console.log(`[${today.toISOString()}] ✅ Challenge written for ${weekId}:`);
  console.log(`   "${payload.title}" — ${payload.description}`);
  console.log(`   Badge: ${payload.badge} ${payload.badgeLabel}`);
  process.exit(0);
}

const force = process.argv.includes("--force");
writeChallenge(force).catch((err) => {
  console.error("[challenge-writer] Error:", err);
  process.exit(1);
});
