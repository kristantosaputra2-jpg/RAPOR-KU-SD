import { cn } from "@/lib/utils"

type MotionHeroImageProps = Readonly<{
  alt: string
  className?: string
  imageClassName?: string
}>

const heroImagePath = "/images/rapotku-school-hero.png"

export function MotionHeroImage({
  alt,
  className,
  imageClassName,
}: MotionHeroImageProps) {
  const sharedImageClass = cn(
    "size-full object-cover object-center",
    imageClassName,
  )

  return (
    <div
      className={cn("motion-hero-artwork relative overflow-hidden", className)}
      data-testid="motion-hero-artwork"
    >
      <img className={sharedImageClass} src={heroImagePath} alt={alt} />
      <div className="motion-hero-parallax" aria-hidden="true">
        <img
          className={cn(
            "motion-hero-layer motion-hero-leaves",
            sharedImageClass,
          )}
          src={heroImagePath}
          alt=""
        />
        <img
          className={cn(
            "motion-hero-layer motion-hero-characters",
            sharedImageClass,
          )}
          src={heroImagePath}
          alt=""
        />
        <img
          className={cn("motion-hero-layer motion-hero-bird", sharedImageClass)}
          src={heroImagePath}
          alt=""
        />
      </div>
    </div>
  )
}
