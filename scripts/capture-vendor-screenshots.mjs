import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FEATURES_DIR = path.join(__dirname, "..", "public", "features");
const BASE = "http://localhost:3000/demo?skip";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: { width: 1440, height: 900 },
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  // Load demo with skip param to bypass onboarding
  console.log("Loading demo...");
  await page.goto(BASE, { waitUntil: "networkidle0", timeout: 30000 });
  await sleep(5000); // generous wait for full React hydration

  // Take a debug screenshot to see current state
  await page.screenshot({ path: path.join(FEATURES_DIR, "_debug-start.jpg"), type: "jpeg", quality: 80 });

  // Check what's visible
  const bodyText = await page.evaluate(() => document.body.innerText?.slice(0, 500));
  console.log("Page state:", bodyText?.slice(0, 200));

  // Click All Vendors in sidebar using coordinates — sidebar vendor link is roughly at x:110, y:347
  // But first, let's find it by looking for the text
  const vendorClicked = await page.evaluate(() => {
    const allEls = document.querySelectorAll("span, a, button, div, p");
    for (const el of allEls) {
      if (el.innerText?.trim() === "All Vendors" && el.offsetParent !== null) {
        el.click();
        return true;
      }
    }
    return false;
  });
  console.log("Clicked All Vendors:", vendorClicked);

  if (!vendorClicked) {
    // Try clicking sidebar link by CSS
    const clicked2 = await page.evaluate(() => {
      // Look for sidebar nav items
      const links = document.querySelectorAll("[class*='sidebar'] span, nav span, aside span");
      for (const l of links) {
        if (l.textContent?.includes("Vendor")) { l.closest("a, button, div[role]")?.click(); return true; }
      }
      return false;
    });
    console.log("Clicked via sidebar search:", clicked2);
  }

  await sleep(3000);

  // Dismiss any popup
  await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      if (b.innerText?.trim() === "Maybe later") { b.click(); break; }
    }
  });
  await sleep(500);

  // Screenshot 1: Vendors directory
  console.log("Capturing: vendors-directory.jpg");
  await page.screenshot({
    path: path.join(FEATURES_DIR, "vendors-directory.jpg"),
    type: "jpeg", quality: 90,
    clip: { x: 220, y: 50, width: 1220, height: 750 },
  });
  console.log("  ✓ vendors-directory.jpg");

  // Check if we can find Apex
  const hasApex = await page.evaluate(() => document.body.innerText?.includes("Apex Office"));
  console.log("Apex visible:", hasApex);

  if (hasApex) {
    // Click Apex
    await page.evaluate(() => {
      const allEls = document.querySelectorAll("span, div, h2, h3, p");
      for (const el of allEls) {
        if (el.innerText?.trim().includes("Apex Office Solutions") && el.offsetParent !== null) {
          el.closest("[class*='cursor'], [class*='hover'], tr, li, div[class*='rounded']")?.click() || el.click();
          return;
        }
      }
    });
    await sleep(3000);
    await page.evaluate(() => {
      const btns = document.querySelectorAll("button");
      for (const b of btns) { if (b.innerText?.trim() === "Maybe later") { b.click(); break; } }
    });
    await sleep(500);

    // Screenshot 2: Vendor detail
    console.log("Capturing: vendor-detail.jpg");
    await page.screenshot({
      path: path.join(FEATURES_DIR, "vendor-detail.jpg"),
      type: "jpeg", quality: 90,
      clip: { x: 220, y: 50, width: 1220, height: 750 },
    });
    console.log("  ✓ vendor-detail.jpg");

    // Screenshot 3: Scroll to compliance
    await page.evaluate(() => {
      const main = document.querySelector("main") || document.querySelector("[class*='overflow-y']") || window;
      if (main.scrollBy) main.scrollBy(0, 550);
      else window.scrollBy(0, 550);
    });
    await sleep(1000);
    console.log("Capturing: vendor-compliance.jpg");
    await page.screenshot({
      path: path.join(FEATURES_DIR, "vendor-compliance.jpg"),
      type: "jpeg", quality: 90,
      clip: { x: 220, y: 0, width: 1220, height: 800 },
    });
    console.log("  ✓ vendor-compliance.jpg");

    // Screenshot 4: Scroll to files
    await page.evaluate(() => {
      const main = document.querySelector("main") || window;
      if (main.scrollBy) main.scrollBy(0, 500);
      else window.scrollBy(0, 500);
    });
    await sleep(1000);
    console.log("Capturing: vendor-files.jpg");
    await page.screenshot({
      path: path.join(FEATURES_DIR, "vendor-files.jpg"),
      type: "jpeg", quality: 90,
      clip: { x: 220, y: 0, width: 1220, height: 800 },
    });
    console.log("  ✓ vendor-files.jpg");

    // Go back
    await page.evaluate(() => {
      const btns = document.querySelectorAll("button");
      for (const b of btns) {
        if (b.innerText?.includes("Back to vendors")) { b.click(); return; }
      }
    });
    await sleep(3000);
  }

  // Screenshot 5: Add Vendor wizard
  await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    for (const b of btns) {
      if (b.innerText?.includes("Add Vendor")) { b.click(); return; }
    }
  });
  await sleep(1500);
  console.log("Capturing: vendor-wizard.jpg");
  await page.screenshot({
    path: path.join(FEATURES_DIR, "vendor-wizard.jpg"),
    type: "jpeg", quality: 90,
  });
  console.log("  ✓ vendor-wizard.jpg");

  console.log("\n✅ All screenshots saved to public/features/");
  await browser.close();
}

main().catch((e) => {
  console.error("Script failed:", e);
  process.exit(1);
});
