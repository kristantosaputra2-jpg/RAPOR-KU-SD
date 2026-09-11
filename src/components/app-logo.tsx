type AppLogoProps = Readonly<{
  className?: string
  decorative?: boolean
}>

export function AppLogo({
  className = "size-11",
  decorative = true,
}: AppLogoProps) {
  return (
    <img
      alt={decorative ? "" : "Logo RaporKu"}
      aria-hidden={decorative || undefined}
      className={`shrink-0 rounded-2xl object-cover ${className}`}
      decoding="async"
      src="/images/raporku-logo-192.png"
    />
  )
}
