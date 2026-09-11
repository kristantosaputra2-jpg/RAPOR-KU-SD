param(
  [string]$Source = (Join-Path $PSScriptRoot "..\Logo master.jpeg")
)

Add-Type -AssemblyName System.Drawing

$sourcePath = (Resolve-Path -LiteralPath $Source).Path
$imagesPath = Join-Path $PSScriptRoot "..\public\images"
$sourceImage = [System.Drawing.Image]::FromFile($sourcePath)

try {
  $side = [Math]::Min($sourceImage.Width, $sourceImage.Height)
  $crop = [System.Drawing.Rectangle]::new(
    [int](($sourceImage.Width - $side) / 2),
    [int](($sourceImage.Height - $side) / 2),
    $side,
    $side
  )

  foreach ($size in @(32, 180, 192, 512)) {
    $bitmap = [System.Drawing.Bitmap]::new($size, $size)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.DrawImage(
          $sourceImage,
          [System.Drawing.Rectangle]::new(0, 0, $size, $size),
          $crop,
          [System.Drawing.GraphicsUnit]::Pixel
        )
      } finally {
        $graphics.Dispose()
      }

      $outputPath = Join-Path $imagesPath "raporku-logo-$size.png"
      $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
      $bitmap.Dispose()
    }
  }
} finally {
  $sourceImage.Dispose()
}
