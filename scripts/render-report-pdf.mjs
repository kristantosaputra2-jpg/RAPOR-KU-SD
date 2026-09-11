import { mkdir } from "node:fs/promises"
import path from "node:path"

import { chromium } from "@playwright/test"

const outputPath = path.resolve("output/pdf/raporku-contoh-rapor-a4.pdf")
await mkdir(path.dirname(outputPath), { recursive: true })

const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage()
  await page.goto("http://127.0.0.1:5173/e2e/report-print-fixture.html", {
    waitUntil: "networkidle",
  })
  await page.emulateMedia({ media: "print" })
  await page.pdf({
    path: outputPath,
    format: "A4",
    preferCSSPageSize: true,
    printBackground: true,
  })
} finally {
  await browser.close()
}
