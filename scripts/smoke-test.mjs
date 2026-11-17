/**
 * End-to-end smoke test for the student website against a running backend.
 *   backend:  npm run seed && npm start          (http://localhost:5000)
 *   frontend: npm run build && npm run start     (http://localhost:3000)
 *   node scripts/smoke-test.mjs
 * Re-seed the backend before each run (the test buys a course and passes quizzes).
 */
import { createRequire } from "node:module";

// createRequire also resolves a globally installed Playwright (NODE_PATH).
const { chromium } = createRequire(import.meta.url)("playwright");

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const API = (process.env.API_URL ?? "http://localhost:5000") + "/api";
const STUDENT = { email: "student@auctech.in", password: "password123" };
const ADMIN = { email: "admin@auctech.in", password: "password123" };

const PUBLIC_ROUTES = [
  "/",
  "/explore",
  "/courses",
  "/courses/full-stack-web-development",
  "/internships",
  "/internships/frontend-development-internship",
  "/certifications",
  "/about",
  "/contact",
  "/pricing",
  "/login",
  "/register",
  "/forgot-password",
  "/verify",
  "/verify/AUC-DM-2026-000124",
  "/privacy",
  "/terms",
  "/refund-policy",
  "/explore?q=python",
  "/does-not-exist",
];
const STUDENT_ROUTES = [
  "/student/dashboard",
  "/student/my-courses",
  "/student/internships",
  "/student/progress",
  "/student/quizzes",
  "/student/assignments",
  "/student/certificates",
  "/student/payments",
  "/student/profile",
  "/student/settings",
  "/student/learn/crs_fullstack",
  "/student/learn/crs_python_da",
  "/student/learn/crs_dm",
  "/checkout/crs_seo",
];

const IGNORED_CONSOLE = [/Failed to load resource/, /net::ERR/, /favicon/, /storage\.googleapis\.com/, /MEDIA_ELEMENT_ERROR/, /hydration/i];

let failures = 0;
const ok = (msg) => console.log(`  ✓ ${msg}`);
const fail = (msg) => {
  failures += 1;
  console.log(`  ✗ ${msg}`);
};
const check = (cond, msg) => (cond ? ok(msg) : fail(msg));

async function visitAll(page, routes, label, consoleErrors) {
  console.log(`\n${label}`);
  for (const route of routes) {
    consoleErrors.length = 0;
    const res = await page.goto(BASE + route, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    const status = res?.status();
    const expected = route === "/does-not-exist" ? 404 : 200;
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    const errs = consoleErrors.filter((e) => !IGNORED_CONSOLE.some((re) => re.test(e)));
    const empty = (await page.locator("main, body").first().innerText()).trim().length < 40;
    check(
      status === expected && errs.length === 0 && !overflow && !empty,
      `${route} → ${status}${errs.length ? ` console: ${errs[0].slice(0, 120)}` : ""}${overflow ? " [horizontal overflow]" : ""}${empty ? " [empty page]" : ""}`,
    );
  }
}

async function login(page, { email, password }) {
  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
}

/** Calls the backend directly with the browser's session token. */
async function apiAs(page, path) {
  const token = await page.evaluate(() => JSON.parse(localStorage.getItem("auctech.session") ?? "{}").state?.token);
  const res = await fetch(API + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return res.json();
}

/** Plays the lesson video fast until "Mark as completed" unlocks, then clicks it. */
async function watchAndComplete(page, courseId, lessonId) {
  await page.goto(`${BASE}/student/learn/${courseId}?item=${lessonId}`, { waitUntil: "networkidle" });
  const video = page.getByTestId("video-player");
  await video.waitFor();
  await video.evaluate((v) => {
    v.muted = true;
    v.playbackRate = 2;
    return v.play().catch(() => {});
  });
  await page
    .waitForFunction(() => !document.querySelector('[data-testid="mark-complete"]')?.hasAttribute("disabled"), null, { timeout: 40000 })
    .catch(() => {});
  const btn = page.getByTestId("mark-complete");
  const enabled = !(await btn.isDisabled());
  if (enabled) await btn.click();
  await page.waitForTimeout(1200);
  return enabled;
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
const page = await context.newPage();
const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));

await visitAll(page, PUBLIC_ROUTES, "Public routes (data from the API)", consoleErrors);

console.log("\nCatalogue comes from MongoDB");
await page.goto(BASE + "/explore", { waitUntil: "networkidle" });
const total = await page.getByTestId("course-card").count();
const apiCourses = await (await fetch(API + "/courses?pageSize=100")).json();
check(total > 0 && apiCourses.total >= total, `explore shows ${total} cards (API has ${apiCourses.total} published)`);
await page.getByTestId("course-search").fill("python");
await page.waitForTimeout(600);
const filtered = await page.getByTestId("course-card").count();
check(total > filtered && filtered >= 1, `search narrows ${total} → ${filtered} cards`);

console.log("\nCertificate verification (server)");
for (const [id, expected] of [
  ["AUC-DM-2026-000124", "valid"],
  ["AUC-FSWD-2026-000033", "revoked"],
  ["AUC-XX-2026-999999", "not_found"],
  ["hello", "invalid"],
]) {
  await page.goto(BASE + "/verify", { waitUntil: "networkidle" });
  await page.getByTestId("verify-input").fill(id);
  await page.getByTestId("verify-submit").click();
  const result = page.getByTestId("verify-result");
  await result.waitFor({ timeout: 10000 });
  const status = await result.getAttribute("data-status");
  check(status === expected, `${id} → ${status}`);
}

console.log("\nAuth");
await page.goto(BASE + "/student/dashboard", { waitUntil: "networkidle" });
check(page.url().includes("/login"), `unauthenticated → ${new URL(page.url()).pathname}`);
await login(page, { email: STUDENT.email, password: "wrong-password" });
await page.waitForTimeout(1000);
check(
  (
    await page
      .locator('[role="alert"]')
      .first()
      .innerText()
      .catch(() => "")
  )
    .toLowerCase()
    .includes("incorrect password"),
  "wrong password rejected by the API",
);
await login(page, ADMIN);
await page.waitForTimeout(1500);
check(
  (
    await page
      .locator('[role="alert"]')
      .first()
      .innerText()
      .catch(() => "")
  )
    .toLowerCase()
    .includes("admin portal"),
  "admin account is sent to the admin portal",
);
await login(page, STUDENT);
await page.waitForURL(/\/student\//, { timeout: 15000 });
check(page.url().includes("/student/dashboard"), `student landed on ${new URL(page.url()).pathname}`);
await visitAll(page, STUDENT_ROUTES, "Student routes", consoleErrors);

console.log("\nCourse player: server-side sequential locking (Python for Data Analytics)");
await page.goto(BASE + "/student/learn/crs_python_da", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
const l1 = page.getByTestId("lesson-item-crs_python_da_m1_l1");
const l2 = page.getByTestId("lesson-item-crs_python_da_m1_l2");
const l3 = page.getByTestId("lesson-item-crs_python_da_m1_l3");
const q1 = page.getByTestId("lesson-item-crs_python_da_m1_quiz");
check((await l1.getAttribute("data-state")) === "completed", "lesson 1 is completed (seeded in MongoDB)");
check((await l3.getAttribute("data-state")) === "locked", "lesson 3 is locked");
check((await q1.getAttribute("data-state")) === "locked", "module quiz is locked");
const token = await page.evaluate(() => JSON.parse(localStorage.getItem("auctech.session")).state.token);
const lockedComplete = await fetch(`${API}/learning/courses/crs_python_da/lessons/crs_python_da_m1_l3/complete`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
});
check(lockedComplete.status === 403, `API refuses to complete a locked lesson (${lockedComplete.status})`);
const unwatched = await fetch(`${API}/learning/courses/crs_python_da/lessons/crs_python_da_m1_l2/complete`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
});
check(unwatched.status === 412, `API refuses to complete an unwatched lesson (${unwatched.status})`);
const cheatQuiz = await fetch(`${API}/learning/quizzes/crs_python_da_m1_quiz/attempts`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ answers: {} }),
});
check(cheatQuiz.status === 403, `API refuses a quiz attempt while it is locked (${cheatQuiz.status})`);
const sync = await apiAs(page, "/sync");
check(
  sync.quizzes.every((q) => q.questions.every((qq) => !("correctOptionId" in qq))),
  "students never receive quiz answers",
);

console.log("\nCourse player: watch threshold, seek guard, completion stored on the server");
await page.goto(BASE + "/student/learn/crs_python_da?item=crs_python_da_m1_l2", { waitUntil: "networkidle" });
const video = page.getByTestId("video-player");
await video.waitFor();
check(await page.getByTestId("mark-complete").isDisabled(), "Mark as completed is disabled before watching");
await video.evaluate((v) => v.play().catch(() => {}));
await page.waitForTimeout(2000);
const seekResult = await video.evaluate(async (v) => {
  v.currentTime = v.duration - 0.5;
  await new Promise((r) => setTimeout(r, 600));
  return { t: v.currentTime, d: v.duration };
});
check(seekResult.t < seekResult.d - 2, `forward seek reverted (now at ${seekResult.t.toFixed(1)}s of ${seekResult.d.toFixed(1)}s)`);
check(await watchAndComplete(page, "crs_python_da", "crs_python_da_m1_l2"), "Mark as completed enabled after reaching the watch threshold");
check((await l2.getAttribute("data-state")) === "completed", "lesson 2 now completed");
check((await l3.getAttribute("data-state")) !== "locked", "lesson 3 unlocked after completion");
const serverProgress = (await apiAs(page, "/learning/courses/crs_python_da")).progress;
check(serverProgress?.lessons?.crs_python_da_m1_l2?.completed === true, "completion persisted in MongoDB");
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(500);
check((await l2.getAttribute("data-state")) === "completed", "still completed after a page reload");

console.log("\nQuiz engine: graded on the server, fail then pass");
check(await watchAndComplete(page, "crs_python_da", "crs_python_da_m1_l3"), "watched lesson 3");
await page.goto(BASE + "/student/learn/crs_python_da?item=crs_python_da_m1_quiz", { waitUntil: "networkidle" });
check((await q1.getAttribute("data-state")) !== "locked", "quiz available after all lessons complete");
async function takeQuiz(correctCount) {
  await page.waitForTimeout(300);
  const startBtn = page.getByTestId("quiz-start");
  if (await startBtn.isVisible().catch(() => false)) await startBtn.click();
  const n = 5;
  for (let i = 0; i < n; i++) {
    const qid = `crs_python_da_m1_q${i + 1}`;
    const correctIdx = [0, 1, 2, 0, 0][i]; // generic questions
    const pick = i < correctCount ? correctIdx : (correctIdx + 1) % 4;
    await page.getByTestId(`quiz-option-${qid}_o${pick + 1}`).click();
    if (i < n - 1) await page.getByTestId("quiz-next").click();
  }
  await page.getByTestId("quiz-submit").click();
  const confirm = page.getByRole("button", { name: /submit/i }).last();
  if (await confirm.isVisible().catch(() => false)) await confirm.click();
  const status = page.getByTestId("quiz-result-status");
  await status.waitFor({ timeout: 10000 });
  return (await status.innerText()).toLowerCase();
}
const first = await takeQuiz(3);
check(first.includes("fail"), `3/5 correct → ${first}`);
check((await page.getByTestId("lesson-item-crs_python_da_m2_l1").getAttribute("data-state")) === "locked", "next module still locked after failing");
await page.getByTestId("quiz-retake").click();
const second = await takeQuiz(5);
check(second.includes("pass"), `5/5 correct → ${second}`);
await page.waitForTimeout(400);
check((await page.getByTestId("lesson-item-crs_python_da_m2_l1").getAttribute("data-state")) !== "locked", "next module unlocked after passing");
const attempts = (await apiAs(page, "/learning/courses/crs_python_da")).attempts;
check(attempts.filter((a) => a.quizId === "crs_python_da_m1_quiz").length === 2, "both attempts stored on the server");

console.log("\nNotes");
await page.goto(BASE + "/student/learn/crs_python_da?item=crs_python_da_m1_l1", { waitUntil: "networkidle" });
const notesTab = page.getByRole("tab", { name: /notes/i });
if (await notesTab.isVisible().catch(() => false)) {
  await notesTab.click();
  await page.getByLabel("New note").fill("Remember: df.groupby returns a GroupBy object");
  await page.getByRole("button", { name: /save note/i }).click();
  await page.waitForTimeout(800);
  const notes = (await apiAs(page, "/learning/courses/crs_python_da")).notes;
  check(
    notes.some((n) => n.body.includes("groupby")),
    "note saved to the server",
  );
} else ok("notes tab not visible at this width (skipped)");

console.log("\nCertificate eligibility");
await page.goto(BASE + "/student/learn/crs_python_da", { waitUntil: "networkidle" });
check((await page.getByTestId("issue-certificate").count()) === 0, "no certificate CTA while course incomplete");
const early = await fetch(`${API}/learning/courses/crs_python_da/complete`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
check(early.status === 412, `API refuses a certificate for an incomplete course (${early.status})`);
await page.goto(BASE + "/student/learn/crs_dm", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
check((await page.getByTestId("complete-course").count()) > 0, "completed course shows completion report CTA");

console.log("\nCheckout flow (demo gateway, verified by the API)");
async function fillBilling(p) {
  await p.locator("#address").fill("21 FC Road");
  await p.locator("#city").fill("Pune");
  await p.locator("#state").fill("Maharashtra");
  await p.locator("#pincode").fill("411004");
}
await page.goto(BASE + "/checkout/crs_seo", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await fillBilling(page);
await page.getByTestId("checkout-pay").click();
await page.getByTestId("gateway-failure").click();
const st = page.getByTestId("checkout-status");
await st.waitFor({ timeout: 15000 });
await page.waitForFunction(() => document.querySelector('[data-testid="checkout-status"]')?.getAttribute("data-status") !== "pending", null, {
  timeout: 15000,
});
check((await st.getAttribute("data-status")) === "failed", "simulated failure → failed state");
let enr = await apiAs(page, "/me/enrollments");
check(!enr.some((e) => e.courseId === "crs_seo"), "no enrollment created on failed payment");
await page.goto(BASE + "/checkout/crs_seo", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await fillBilling(page);
await page.getByTestId("checkout-pay").click();
await page.getByTestId("gateway-success").click();
await page
  .waitForFunction(() => document.querySelector('[data-testid="checkout-status"]')?.getAttribute("data-status") === "successful", null, {
    timeout: 15000,
  })
  .catch(() => {});
check((await st.getAttribute("data-status")) === "successful", "simulated success → successful state");
enr = await apiAs(page, "/me/enrollments");
check(
  enr.some((e) => e.courseId === "crs_seo"),
  "enrollment created in MongoDB after verified payment",
);
const orders = await apiAs(page, "/me/orders");
check(
  orders.some((o) => o.courseId === "crs_seo" && o.status === "failed") && orders.some((o) => o.courseId === "crs_seo" && o.status === "successful"),
  "failed and successful orders both recorded",
);

console.log("\nContact form");
await page.goto(BASE + "/contact", { waitUntil: "networkidle" });
await page.locator("#name").fill("Smoke Test");
await page.locator("#email").fill("smoke@example.com");
await page.locator("#message").fill("Hello from the automated smoke test — please ignore.");
await page.getByRole("button", { name: /send message/i }).click();
await page.waitForTimeout(1000);
check(await page.getByText("Message sent").isVisible(), "contact message stored by the API");

console.log("\nRegistration creates a real account");
await page.evaluate(() => localStorage.removeItem("auctech.session"));
const email = `new.learner.${Date.now()}@example.com`;
await page.goto(BASE + "/register", { waitUntil: "networkidle" });
await page.locator("#name").fill("New Learner");
await page.locator("#email").fill(email);
if (await page.locator("#phone").count()) await page.locator("#phone").fill("+91 90000 12345");
await page.locator("#password").fill("supersecret1");
if (await page.locator("#confirm").count()) await page.locator("#confirm").fill("supersecret1");
const terms = page.locator('button[role="checkbox"]').first();
if (await terms.count()) await terms.click();
await page.getByRole("button", { name: /create account/i }).click();
await page.waitForURL(/\/student\//, { timeout: 15000 }).catch(() => {});
check(page.url().includes("/student/"), `registered and signed in → ${new URL(page.url()).pathname}`);
const loginRes = await fetch(API + "/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password: "supersecret1" }),
});
check(loginRes.status === 200, "new account can sign in through the API");

console.log("\nMobile viewport (390×844)");
await page.evaluate(() => localStorage.removeItem("auctech.session"));
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const mpage = await mobile.newPage();
const mErrors = [];
mpage.on("console", (m) => m.type() === "error" && mErrors.push(m.text()));
mpage.on("pageerror", (e) => mErrors.push(`pageerror: ${e.message}`));
await visitAll(mpage, ["/", "/explore", "/courses/full-stack-web-development", "/login", "/verify/AUC-DM-2026-000124"], "Mobile public", mErrors);
await login(mpage, STUDENT);
await mpage.waitForURL(/\/student\//, { timeout: 15000 });
await visitAll(mpage, ["/student/dashboard", "/student/learn/crs_fullstack", "/student/certificates"], "Mobile student", mErrors);

await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : "\nAll smoke checks passed");
process.exit(failures ? 1 : 0);
