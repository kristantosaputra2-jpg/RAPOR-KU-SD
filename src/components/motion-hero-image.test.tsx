import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { MotionHeroImage } from "./motion-hero-image"

describe("MotionHeroImage", () => {
  it("keeps one meaningful image while motion layers stay decorative", () => {
    render(<MotionHeroImage alt="Ilustrasi sekolah" />)

    expect(screen.getByAltText("Ilustrasi sekolah")).toBeInTheDocument()
    expect(screen.getAllByRole("img")).toHaveLength(1)
    expect(screen.getByTestId("motion-hero-artwork")).toBeInTheDocument()
  })
})
