import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { App } from "@/app/app"

describe("App", () => {
  it("menampilkan status bahwa fondasi aplikasi siap", () => {
    render(<App />)

    expect(
      screen.getByRole("heading", { name: "Fondasi aplikasi sudah siap." }),
    ).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent(
      "Fondasi terverifikasi",
    )
  })
})
