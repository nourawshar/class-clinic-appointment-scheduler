// Functional smoke test for the Class Clinic frontend using Puppeteer.
const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push("console.error: " + msg.text());
  });

  await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });
  console.log("URL:", await page.url());
  console.log("title:", await page.title());
  console.log("root children:", await page.evaluate(() => document.getElementById("root")?.children.length));
  console.log("root innerHTML:", (await page.evaluate(() => document.getElementById("root")?.innerHTML)) || "(empty)");

  // Log in as admin (seed user) to reach the daily view.
  await page.type("#login-username", "admin");
  await page.type("#login-password", "admin123");
  await page.click("button[type=submit]");
  await page.waitForSelector(".doctor-card", { timeout: 10000 }).catch(() => {});

  const daily = await page.evaluate(() => {
    const el = document.getElementById("root");
    return {
      rootChildren: el ? el.children.length : 0,
      rootHTML: el ? el.innerHTML.slice(0, 300) : "(none)",
      bodyHTML: document.body.innerHTML.slice(0, 300),
      errorCount: errors.length,
    };
  });
  console.log("DAILY VIEW STATE:", JSON.stringify(daily));
  if (errors.length) console.log("JS ERRORS:", errors.slice(0, 5));

  // Take a screenshot for inspection.
  await page.screenshot({ path: "/tmp/classclinic-daily.png", fullPage: true });
  console.log("screenshot saved /tmp/classclinic-daily.png");

  await browser.close();
})();
