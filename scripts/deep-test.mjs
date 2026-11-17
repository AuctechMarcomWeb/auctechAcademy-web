/**
 * Extra end-to-end checks for the student website (run after smoke-test.mjs, on a seeded backend):
 * loading states, profile & settings, password change/reset, notes, assignment upload,
 * internship application with résumé, paid-video protection, purchase → instant playback.
 *   node scripts/deep-test.mjs
 * Needs MONGODB_URI (defaults to the local dev database) to prepare learner progress.
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
// The database driver comes from the backend folder next to this app (backend/ or auctech-backend/), or BACKEND_DIR.
function loadMongoose() {
  const dirs = [process.env.BACKEND_DIR, "../../backend", "../../auctech-backend"].filter(Boolean);
  for (const d of dirs) {
    try {
      return require(new URL(`${d.startsWith("/") ? "file://" + d : d}/node_modules/mongoose/index.js`, import.meta.url).pathname);
    } catch {}
  }
  throw new Error("Could not find the backend's node_modules/mongoose. Set BACKEND_DIR to the backend folder (and run npm install there).");
}

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const API = (process.env.API_URL ?? "http://localhost:5000") + "/api";
const API_LOG = process.env.API_LOG ?? "/tmp/api.log";

let failures = 0;
const check = (cond, msg) => {
  if (!cond) failures += 1;
  console.log(`  ${cond ? "✓" : "✗"} ${msg}`);
};
const json = async (path, init = {}, token) => {
  const res = await fetch(API + path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers ?? {}) },
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};
async function uiLogin(page, email, password) {
  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
  await page.waitForURL(/\/student\//, { timeout: 15000 });
}
const tokenOf = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("auctech.session") ?? "{}").state?.token);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

/* ---------- 1. No "not found" flash while data loads ---------- */
console.log("\nLoading states (API delayed by 1.5 s)");
await page.route("**/api/sync", async (route) => {
  await new Promise((r) => setTimeout(r, 1500));
  await route.continue().catch(() => {});
});
await page.goto(BASE + "/courses/full-stack-web-development", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(700);
const early = await page.locator("main").innerText();
check(!/not available|not found/i.test(early), "course page shows a placeholder, not 'not available', while loading");
await page.waitForTimeout(2000);
check((await page.locator("h1").first().innerText()).includes("Full Stack"), "course page renders after data arrives");
await page.goto(BASE + "/explore", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(700);
check(!/No courses match/i.test(await page.locator("main").innerText()), "explore shows skeletons, not 'No courses match', while loading");
await page.goto(BASE + "/internships/frontend-development-internship", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(700);
check(!/Internship not found/i.test(await page.locator("main").innerText()), "internship page shows a placeholder while loading");
await page.unroute("**/api/sync");

/* ---------- 2. Paid videos are not exposed ---------- */
console.log("\nPaid-content protection");
const anon = await json("/sync");
const paidLessons = anon.body.courses.flatMap((c) => c.modules.flatMap((m) => m.lessons)).filter((l) => !l.isPreview);
check(paidLessons.length > 0 && paidLessons.every((l) => !l.videoUrl), `visitors get no video URLs for ${paidLessons.length} paid lessons`);

/* ---------- 3. Profile, notifications, password ---------- */
console.log("\nProfile & settings (seeded student)");
await uiLogin(page, "student@auctech.in", "password123");
await page.goto(BASE + "/student/profile", { waitUntil: "networkidle" });
const headline = `Full-stack learner ${Date.now() % 1000}`;
await page.locator("#headline").fill(headline);
await page.getByRole("button", { name: /save/i }).first().click();
await page.waitForTimeout(1200);
let me = await json("/auth/me", {}, await tokenOf(page));
check(me.body?.user?.headline === headline, "profile headline saved on the server");

await page.goto(BASE + "/student/settings", { waitUntil: "networkidle" });
const before = me.body.user.notificationPrefs?.marketing ?? false;
await page.locator("#notif-marketing").click();
await page.waitForTimeout(1200);
me = await json("/auth/me", {}, await tokenOf(page));
check(me.body?.user?.notificationPrefs?.marketing === !before, "notification preference saved on the server");
await page.reload({ waitUntil: "networkidle" });
check(
  (await page.locator("#notif-marketing").getAttribute("data-state")) === (!before ? "checked" : "unchecked"),
  "preference still set after reload",
);

await page.locator("#current").fill("password123");
await page.locator("#next").fill("newpassword9");
await page.locator("#confirm").fill("newpassword9");
await page.getByRole("button", { name: /update password/i }).click();
await page.waitForTimeout(1500);
check(
  (await json("/auth/login", { method: "POST", body: JSON.stringify({ email: "student@auctech.in", password: "newpassword9" }) })).status === 200,
  "new password works",
);
check(
  (await json("/auth/login", { method: "POST", body: JSON.stringify({ email: "student@auctech.in", password: "password123" }) })).status === 401,
  "old password rejected",
);
await page.goto(BASE + "/student/dashboard", { waitUntil: "networkidle" });
check(page.url().includes("/student/dashboard"), "still signed in on this device after the change");

/* ---------- 4. Forgot / reset password (link read from the API log) ---------- */
console.log("\nForgot & reset password");
await page.evaluate(() => localStorage.removeItem("auctech.session"));
await page.goto(BASE + "/forgot-password", { waitUntil: "networkidle" });
await page.locator("#email").fill("student@auctech.in");
await page.getByRole("button", { name: /send reset link/i }).click();
await page.waitForTimeout(1500);
const links = [...readFileSync(API_LOG, "utf8").matchAll(/(http:\/\/localhost:3000\/reset-password\?token=[a-f0-9]+&email=[^\s]+)/g)];
check(links.length > 0, "reset link generated (printed by the API without SMTP)");
if (links.length) {
  await page.goto(links.at(-1)[1], { waitUntil: "networkidle" });
  await page.locator("#password").fill("password123");
  await page.locator("#confirm").fill("password123");
  await page.getByRole("button", { name: /set new password/i }).click();
  await page.waitForURL(/\/student\//, { timeout: 15000 }).catch(() => {});
  check(page.url().includes("/student/"), "reset signs the learner in");
  check(
    (await json("/auth/login", { method: "POST", body: JSON.stringify({ email: "student@auctech.in", password: "password123" }) })).status === 200,
    "password restored via reset link",
  );
  await page.goto(links.at(-1)[1], { waitUntil: "networkidle" });
  await page.locator("#password").fill("password123");
  await page.locator("#confirm").fill("password123");
  await page.getByRole("button", { name: /set new password/i }).click();
  await page.waitForTimeout(1200);
  check(
    /invalid or has expired/i.test(
      await page
        .locator('[role="alert"]')
        .first()
        .innerText()
        .catch(() => ""),
    ),
    "a reset link works only once",
  );
}

/* ---------- 5. Notes (desktop width) ---------- */
console.log("\nNotes in the course player");
await uiLogin(page, "student@auctech.in", "password123");
await page.goto(BASE + "/student/learn/crs_fullstack?item=crs_fullstack_m1_l1", { waitUntil: "networkidle" });
// On wide screens the notes box is in the right-hand panel (no tab).
const noteBox = page.locator('textarea[aria-label="New note"]:visible').first();
check(await noteBox.isVisible().catch(() => false), "notes box visible at 1440px");
if (await noteBox.isVisible().catch(() => false)) {
  await noteBox.fill("Semantic HTML first, then CSS");
  await page
    .locator("button:visible", { hasText: /save note/i })
    .first()
    .click();
  await page.waitForTimeout(1000);
  const notes = (await json("/learning/courses/crs_fullstack", {}, await tokenOf(page))).body?.notes ?? [];
  check(
    notes.some((n) => n.body.includes("Semantic HTML")),
    "note stored on the server",
  );
  await page.reload({ waitUntil: "networkidle" });
  check(
    await page
      .locator(":visible", { hasText: /^Semantic HTML first, then CSS$/ })
      .first()
      .isVisible()
      .catch(() => false),
    "note shown after reload",
  );
  await page.locator('button[aria-label="Delete note"]:visible').first().click();
  await page.waitForTimeout(1000);
  const after = (await json("/learning/courses/crs_fullstack", {}, await tokenOf(page))).body?.notes ?? [];
  check(!after.some((n) => n.body.includes("Semantic HTML")), "note deleted on the server");
}

/* ---------- 6. Internship application with résumé ---------- */
console.log("\nInternship application with résumé upload");
await page.goto(BASE + "/internships/graphic-design-internship", { waitUntil: "networkidle" });
await page
  .getByRole("button", { name: /apply now/i })
  .first()
  .click();
await page.locator("#college").fill("COEP Technological University");
await page.locator("#graduationYear").fill("2027");
await page.locator("#coverLetter").fill("I enjoy brand design and have built a portfolio of identity projects for student clubs.");
await page
  .locator("#resume")
  .setInputFiles({ name: "ananya_resume.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n% test resume\n") });
await page.getByRole("button", { name: /submit application/i }).click();
await page.waitForTimeout(2000);
const apps = (await json("/me/applications", {}, await tokenOf(page))).body ?? [];
const app = apps.find((a) => a.internshipId === "int_design");
check(Boolean(app), "application stored on the server");
check(Boolean(app?.resumeUploadId), "résumé uploaded and linked to the application");

/* ---------- 7. Buy a course → playable immediately; assignment upload ---------- */
console.log("\nPurchase → instant playback, then assignment upload");
const email = `deep.${Date.now()}@example.com`;
const reg = await json("/auth/register", { method: "POST", body: JSON.stringify({ name: "Deep Tester", email, password: "deeptest123" }) });
await page.evaluate(() => localStorage.removeItem("auctech.session"));
await uiLogin(page, email, "deeptest123");
await page.goto(BASE + "/checkout/crs_ux", { waitUntil: "networkidle" });
for (const [id, v] of [
  ["#address", "21 FC Road"],
  ["#city", "Pune"],
  ["#state", "Maharashtra"],
  ["#pincode", "411004"],
  ["#phone", "+91 90000 12345"],
])
  if (await page.locator(id).count()) await page.locator(id).fill(v);
await page.getByTestId("checkout-pay").click();
await page.getByTestId("gateway-success").click();
await page
  .waitForFunction(() => document.querySelector('[data-testid="checkout-status"]')?.getAttribute("data-status") === "successful", null, {
    timeout: 15000,
  })
  .catch(() => {});
await page.goto(BASE + "/student/learn/crs_ux?item=crs_ux_m1_l2", { waitUntil: "networkidle" });
await page.goto(BASE + "/student/learn/crs_ux", { waitUntil: "networkidle" });
const src = await page
  .locator('[data-testid="video-player"] source')
  .first()
  .getAttribute("src")
  .catch(() => null);
check(Boolean(src), `video loads right after purchase (${src ? new URL(src, BASE).hostname : "no src"})`);

// Fast-forward this learner to the module-2 assignment (lessons + quiz done), using the database directly.
const mongoose = loadMongoose();
await mongoose.connect(process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/auctech_academy");
const db = mongoose.connection.db;
const userId = reg.body.user.id;
const course = await db.collection("courses").findOne({ _id: "crs_ux" });
const lessons = {};
const now = new Date().toISOString();
for (const m of course.modules.slice(0, 2))
  for (const l of m.lessons)
    lessons[l.id] = { lessonId: l.id, maxPosition: 100, watchedSeconds: 100, lastPosition: 100, completed: true, updatedAt: now };
await db
  .collection("courseprogresses")
  .updateOne(
    { userId, courseId: "crs_ux" },
    { $set: { lessons, updatedAt: now }, $setOnInsert: { _id: `prg_deep_${Date.now()}`, startedAt: now } },
    { upsert: true },
  );
const m1 = course.modules[0];
if (m1.quizId)
  await db
    .collection("quizattempts")
    .insertOne({
      _id: `att_deep_${Date.now()}`,
      userId,
      quizId: m1.quizId,
      courseId: "crs_ux",
      answers: {},
      correct: 5,
      total: 5,
      scorePercent: 100,
      passed: true,
      startedAt: now,
      submittedAt: now,
      timeTakenSeconds: 60,
    });
await mongoose.disconnect();

const assignmentId = course.modules[1].assignmentId;
await page.goto(`${BASE}/student/learn/crs_ux?item=${assignmentId}`, { waitUntil: "networkidle" });
await page
  .locator("#assignment-file")
  .setInputFiles({ name: "wireframes.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n% wireframes\n") });
await page.getByTestId("assignment-submit").click();
await page.waitForTimeout(2500);
const subs = (await json("/me/submissions", {}, await tokenOf(page))).body ?? [];
const sub = subs.find((s) => s.assignmentId === assignmentId);
check(sub?.status === "submitted" && Boolean(sub?.fileUrl), "assignment file uploaded and submission recorded");
if (sub?.fileUrl) {
  const dl = await fetch(sub.fileUrl, { headers: { Authorization: `Bearer ${await tokenOf(page)}` } });
  check(dl.status === 200 && (await dl.text()).includes("wireframes"), "learner can download their own file");
  check((await fetch(sub.fileUrl)).status === 401, "file is private without a token");
}

console.log("\nPage errors");
check(errors.length === 0, errors.length ? errors.slice(0, 5).join(" | ") : "no uncaught page errors");

await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : "\nAll deep checks passed");
process.exit(failures ? 1 : 0);
