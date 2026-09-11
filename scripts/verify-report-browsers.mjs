import { mkdir } from "node:fs/promises"
import path from "node:path"

import { chromium, devices } from "@playwright/test"

const fixtureUrl = "http://127.0.0.1:5173/e2e/report-print-fixture.html"
const outputDirectory = path.resolve("output/report-browser-qa")

function ensure(condition, message) {
  if (!condition) throw new Error(message)
}

async function readLayout(page) {
  return page.evaluate(() => {
    const headline = document.querySelector(".report-cover-headline")
    const logo = document.querySelector(".report-tut-wuri-logo")
    const resultScroller = document.querySelector(".report-results-scroll")
    const sheet = document.querySelector(".report-sheet")
    const pageRule = [...document.styleSheets]
      .flatMap((styleSheet) => [...styleSheet.cssRules])
      .find((rule) => rule.cssText.startsWith("@page"))
    const sheetStyle = sheet ? getComputedStyle(sheet) : null
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      headlineBeforeLogo: Boolean(
        headline &&
          logo &&
          headline.compareDocumentPosition(logo) &
            Node.DOCUMENT_POSITION_FOLLOWING,
      ),
      horizontalTableContained: Boolean(
        resultScroller &&
          resultScroller.scrollWidth >= resultScroller.clientWidth &&
          resultScroller.getBoundingClientRect().right <= window.innerWidth + 1,
      ),
      sheetWidth: sheetStyle ? Number.parseFloat(sheetStyle.width) : 0,
      sheetHeight: sheetStyle ? Number.parseFloat(sheetStyle.minHeight) : 0,
      pageRule: pageRule?.cssText.toLowerCase() ?? "",
    }
  })
}

await mkdir(outputDirectory, { recursive: true })
const browser = await chromium.launch({ channel: "chrome", headless: true })

try {
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  })
  const desktopPage = await desktopContext.newPage()
  await desktopPage.goto(fixtureUrl, { waitUntil: "networkidle" })
  const desktopScreen = await readLayout(desktopPage)
  ensure(
    desktopScreen.documentWidth <= desktopScreen.viewportWidth,
    "Preview desktop melebar keluar layar.",
  )
  ensure(desktopScreen.headlineBeforeLogo, "Logo belum berada di bawah judul.")
  await desktopPage.screenshot({
    path: path.join(outputDirectory, "chrome-desktop.png"),
    fullPage: false,
  })

  await desktopPage.emulateMedia({ media: "print" })
  const desktopPrint = await readLayout(desktopPage)
  ensure(desktopPrint.pageRule.includes("size: a4"), "Aturan cetak bukan A4.")
  ensure(
    Math.abs(desktopPrint.sheetWidth - 793.7) < 2,
    "Lebar halaman cetak tidak setara 210 mm.",
  )
  ensure(
    Math.abs(desktopPrint.sheetHeight - 1122.5) < 2,
    "Tinggi halaman cetak tidak setara 297 mm.",
  )
  await desktopContext.close()

  const androidContext = await browser.newContext({ ...devices["Pixel 5"] })
  const androidPage = await androidContext.newPage()
  await androidPage.goto(fixtureUrl, { waitUntil: "networkidle" })
  const androidScreen = await readLayout(androidPage)
  ensure(
    androidScreen.documentWidth <= androidScreen.viewportWidth,
    "Preview Android melebar keluar layar.",
  )
  ensure(
    androidScreen.horizontalTableContained,
    "Tabel nilai Android tidak berada di area gulir yang aman.",
  )
  ensure(androidScreen.headlineBeforeLogo, "Urutan sampul Android berbeda.")
  await androidPage.screenshot({
    path: path.join(outputDirectory, "chrome-android-pixel-5.png"),
    fullPage: false,
  })
  await androidContext.close()

  console.log(
    JSON.stringify(
      {
        chromeDesktop: "lulus",
        chromeAndroidPixel5: "lulus",
        a4Print: "210 x 297 mm",
      },
      null,
      2,
    ),
  )
} finally {
  await browser.close()
}
