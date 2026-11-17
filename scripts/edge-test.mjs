/**
 * Edge-case checks: certificate issued from the completion report, and an
 * expired/invalid saved session. Needs a seeded backend and direct DB access
 * (MONGODB_URI, default local) to fast-forward a learner to 100%.
 *   node scripts/edge-test.mjs
 */
import { createRequire } from "node:module";

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
let failures = 0;
const check = (c, m) => {
  if (!c) failures++;
  console.log(`  ${c ? "✓" : "✗"} ${m}`);
};
const post = (p, b, t) =>
  fetch(API + p, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) },
    body: JSON.stringify(b ?? {}),
  }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));

// A new learner buys a course, then we mark every step done in the database.
const email = `edge.${Date.now()}@example.com`;
const { body: reg } = await post("/auth/register", { name: "Edge Learner", email, password: "edgetest123" });
const t = reg.token;
const order = await post("/payments/orders", { courseId: "crs_linux", billing: { fullName: "Edge Learner", email, phone: "+91 90000 00000" } }, t);
await post(`/payments/orders/${order.body.order.id}/verify`, { outcome: "successful" }, t);

const mongoose = loadMongoose();
await mongoose.connect(process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/auctech_academy");
const db = mongoose.connection.db;
const course = await db.collection("courses").findOne({ _id: "crs_linux" });
const now = new Date().toISOString();
const lessons = {};
for (const m of course.modules)
  for (const l of m.lessons)
    lessons[l.id] = { lessonId: l.id, maxPosition: 100, watchedSeconds: 100, lastPosition: 100, completed: true, updatedAt: now };
await db
  .collection("courseprogresses")
  .updateOne(
    { userId: reg.user.id, courseId: "crs_linux" },
    { $set: { lessons, updatedAt: now }, $setOnInsert: { _id: `prg_edge_${Date.now()}`, startedAt: now } },
    { upsert: true },
  );
let n = 0;
for (const m of course.modules) {
  if (m.quizId)
    await db
      .collection("quizattempts")
      .insertOne({
        _id: `att_edge_${Date.now()}_${n++}`,
        userId: reg.user.id,
        quizId: m.quizId,
        courseId: "crs_linux",
        answers: {},
        correct: 5,
        total: 5,
        scorePercent: 90,
        passed: true,
        startedAt: now,
        submittedAt: now,
        timeTakenSeconds: 60,
      });
  if (m.assignmentId)
    await db
      .collection("assignmentsubmissions")
      .insertOne({
        _id: `sub_edge_${Date.now()}_${n++}`,
        assignmentId: m.assignmentId,
        userId: reg.user.id,
        status: "submitted",
        submittedAt: now,
        fileName: "x.pdf",
        fileSize: 1,
        attempt: 1,
      });
}
await mongoose.disconnect();

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(BASE + "/login", { waitUntil: "networkidle" });
await page.getByTestId("login-email").fill(email);
await page.getByTestId("login-password").fill("edgetest123");
await page.getByTestId("login-submit").click();
await page.waitForURL(/\/student\//);

console.log("\nCertificate from the completion report");
await page.goto(BASE + "/student/learn/crs_linux", { waitUntil: "networkidle" });
await page.locator('[data-testid="complete-course"]:visible').first().click();
await page.getByTestId("issue-certificate").click();
await page.waitForTimeout(2500);
const certs = await fetch(API + "/me/certificates", { headers: { Authorization: `Bearer ${t}` } }).then((r) => r.json());
const cert = certs.find((c) => c.courseId === "crs_linux");
check(Boolean(cert), `certificate issued by the server (${cert?.id})`);
if (cert) {
  const v = await post("/certificates/verify", { id: cert.id, source: "web" });
  check(v.body?.status === "valid", "new certificate verifies as valid");
  await page.goto(BASE + "/student/certificates", { waitUntil: "networkidle" });
  check((await page.locator("main").innerText()).includes(cert.id), "certificate listed on the student's certificates page");
}

console.log("\nExpired / invalid saved session");
await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem("auctech.session"));
  s.state.token = "not-a-real-token";
  localStorage.setItem("auctech.session", JSON.stringify(s));
});
await page.goto(BASE + "/student/dashboard", { waitUntil: "networkidle" });
await page.waitForURL(/\/login/, { timeout: 10000 }).catch(() => {});
check(page.url().includes("/login"), `bad token → sent to ${new URL(page.url()).pathname}`);
check(!(await page.evaluate(() => JSON.parse(localStorage.getItem("auctech.session") ?? "{}").state?.token)), "stale token cleared from the browser");

await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : "\nAll edge checks passed");
process.exit(failures ? 1 : 0);
