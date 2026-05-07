param(
  [Parameter(Mandatory = $true)]
  [string]$InputPath,
  [Parameter(Mandatory = $true)]
  [string]$OutputDir,
  [int]$TargetLongEdge = 5400
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

function Get-ResizedDimensions {
  param([int]$W, [int]$H, [int]$LongEdge)
  if ($W -ge $H) {
    $newW = $LongEdge
    $newH = [int][Math]::Round($H * ($LongEdge / [double]$W))
  } else {
    $newH = $LongEdge
    $newW = [int][Math]::Round($W * ($LongEdge / [double]$H))
  }
  return @($newW, $newH)
}

function Resize-HighQuality {
  param([System.Drawing.Bitmap]$Source, [int]$W, [int]$H)
  $dst = New-Object System.Drawing.Bitmap($W, $H)
  $g = [System.Drawing.Graphics]::FromImage($dst)
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.DrawImage($Source, 0, 0, $W, $H)
  $g.Dispose()
  return $dst
}

function Apply-BrightnessContrast {
  param(
    [System.Drawing.Bitmap]$Source,
    [double]$Contrast = 1.08,
    [double]$Brightness = 1.03
  )

  $w = $Source.Width
  $h = $Source.Height
  $dst = New-Object System.Drawing.Bitmap($w, $h)

  for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
      $p = $Source.GetPixel($x, $y)
      $r = (($p.R / 255.0 - 0.5) * $Contrast + 0.5) * $Brightness
      $g = (($p.G / 255.0 - 0.5) * $Contrast + 0.5) * $Brightness
      $b = (($p.B / 255.0 - 0.5) * $Contrast + 0.5) * $Brightness

      $ri = [Math]::Min(255, [Math]::Max(0, [int][Math]::Round($r * 255)))
      $gi = [Math]::Min(255, [Math]::Max(0, [int][Math]::Round($g * 255)))
      $bi = [Math]::Min(255, [Math]::Max(0, [int][Math]::Round($b * 255)))
      $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($p.A, $ri, $gi, $bi))
    }
  }
  return $dst
}

function Apply-UnsharpMaskLight {
  param([System.Drawing.Bitmap]$Source)

  $w = $Source.Width
  $h = $Source.Height
  $dst = New-Object System.Drawing.Bitmap($w, $h)
  $kernel = @(
    @(0, -1, 0),
    @(-1, 5, -1),
    @(0, -1, 0)
  )

  for ($y = 1; $y -lt $h - 1; $y++) {
    for ($x = 1; $x -lt $w - 1; $x++) {
      $sumR = 0
      $sumG = 0
      $sumB = 0
      for ($ky = -1; $ky -le 1; $ky++) {
        for ($kx = -1; $kx -le 1; $kx++) {
          $p = $Source.GetPixel($x + $kx, $y + $ky)
          $k = $kernel[$ky + 1][$kx + 1]
          $sumR += $p.R * $k
          $sumG += $p.G * $k
          $sumB += $p.B * $k
        }
      }
      $ri = [Math]::Min(255, [Math]::Max(0, $sumR))
      $gi = [Math]::Min(255, [Math]::Max(0, $sumG))
      $bi = [Math]::Min(255, [Math]::Max(0, $sumB))
      $a = $Source.GetPixel($x, $y).A
      $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($a, $ri, $gi, $bi))
    }
  }

  for ($x = 0; $x -lt $w; $x++) {
    $dst.SetPixel($x, 0, $Source.GetPixel($x, 0))
    $dst.SetPixel($x, $h - 1, $Source.GetPixel($x, $h - 1))
  }
  for ($y = 0; $y -lt $h; $y++) {
    $dst.SetPixel(0, $y, $Source.GetPixel(0, $y))
    $dst.SetPixel($w - 1, $y, $Source.GetPixel($w - 1, $y))
  }
  return $dst
}

function Blend-WithOriginal {
  param(
    [System.Drawing.Bitmap]$Original,
    [System.Drawing.Bitmap]$Sharpened,
    [double]$Amount = 0.35
  )

  $w = $Original.Width
  $h = $Original.Height
  $dst = New-Object System.Drawing.Bitmap($w, $h)
  for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
      $a = $Original.GetPixel($x, $y)
      $b = $Sharpened.GetPixel($x, $y)
      $r = [int][Math]::Round($a.R * (1.0 - $Amount) + $b.R * $Amount)
      $g = [int][Math]::Round($a.G * (1.0 - $Amount) + $b.G * $Amount)
      $bl = [int][Math]::Round($a.B * (1.0 - $Amount) + $b.B * $Amount)
      $r = [Math]::Min(255, [Math]::Max(0, $r))
      $g = [Math]::Min(255, [Math]::Max(0, $g))
      $bl = [Math]::Min(255, [Math]::Max(0, $bl))
      $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($a.A, $r, $g, $bl))
    }
  }
  return $dst
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$src = New-Object System.Drawing.Bitmap($InputPath)
try {
  $dims = Get-ResizedDimensions -W $src.Width -H $src.Height -LongEdge $TargetLongEdge
  $newW = $dims[0]
  $newH = $dims[1]
  $base = [System.IO.Path]::GetFileNameWithoutExtension($InputPath)

  $resized = Resize-HighQuality -Source $src -W $newW -H $newH
  try {
    $cleanPath = Join-Path $OutputDir ($base + "_print_clean_" + $newW + "x" + $newH + ".png")
    $resized.Save($cleanPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $boost = Apply-BrightnessContrast -Source $resized -Contrast 1.09 -Brightness 1.03
    try {
      $pixelCount = [int64]$newW * [int64]$newH
      $boostPath = Join-Path $OutputDir ($base + "_print_boost_" + $newW + "x" + $newH + ".png")
      if ($pixelCount -le 12000000) {
        $sharp = Apply-UnsharpMaskLight -Source $boost
        try {
          $blend = Blend-WithOriginal -Original $boost -Sharpened $sharp -Amount 0.35
          try {
            $blend.Save($boostPath, [System.Drawing.Imaging.ImageFormat]::Png)
          } finally {
            $blend.Dispose()
          }
        } finally {
          $sharp.Dispose()
        }
      } else {
        $boost.Save($boostPath, [System.Drawing.Imaging.ImageFormat]::Png)
      }
    } finally {
      $boost.Dispose()
    }
  } finally {
    $resized.Dispose()
  }
} finally {
  $src.Dispose()
}

Get-ChildItem -Path $OutputDir -File | Sort-Object Name | Select-Object Name, Length
