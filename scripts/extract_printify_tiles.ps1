param(
  [string]$InputDir = "C:\Projects\Silent-Spirits-Legacy\Logo_N_Galaxy_Fill_Space\New_Logos_AOP",
  [string]$OutputDir = "C:\Projects\Silent-Spirits-Legacy\output\printify-ready\aop-single"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

function Get-DarkLineRuns {
  param(
    [System.Drawing.Bitmap]$Bmp,
    [bool]$Horizontal
  )

  $runs = New-Object System.Collections.Generic.List[object]
  $length = if ($Horizontal) { $Bmp.Height } else { $Bmp.Width }
  $orth = if ($Horizontal) { $Bmp.Width } else { $Bmp.Height }

  $inRun = $false
  $start = 0
  for ($i = 0; $i -lt $length; $i++) {
    $darkCount = 0
    for ($j = 0; $j -lt $orth; $j++) {
      $px = if ($Horizontal) { $Bmp.GetPixel($j, $i) } else { $Bmp.GetPixel($i, $j) }
      $lum = (0.299 * $px.R) + (0.587 * $px.G) + (0.114 * $px.B)
      if ($lum -lt 24) { $darkCount++ }
    }
    $ratio = $darkCount / [double]$orth
    $isLine = $ratio -ge 0.88

    if ($isLine -and -not $inRun) {
      $inRun = $true
      $start = $i
    } elseif (-not $isLine -and $inRun) {
      $runs.Add([pscustomobject]@{ Start = $start; End = $i - 1 })
      $inRun = $false
    }
  }
  if ($inRun) {
    $runs.Add([pscustomobject]@{ Start = $start; End = $length - 1 })
  }
  return $runs
}

function Get-CutPoints {
  param(
    [int]$Size,
    [object[]]$Runs
  )
  $points = New-Object System.Collections.Generic.List[int]
  $points.Add(0)
  foreach ($r in $Runs) {
    $thick = $r.End - $r.Start + 1
    if ($thick -ge 2) {
      $points.Add([Math]::Max(0, $r.Start))
      $points.Add([Math]::Min($Size, $r.End + 1))
    }
  }
  $points.Add($Size)
  return ($points | Sort-Object -Unique)
}

function Save-ResizedTile {
  param(
    [System.Drawing.Bitmap]$Tile,
    [string]$OutPath
  )

  $srcW = $Tile.Width
  $srcH = $Tile.Height
  $ratio = $srcW / [double]$srcH

  if ($ratio -gt 1.2) {
    $dstW = 5400
    $dstH = [int][Math]::Round($dstW / $ratio)
  } elseif ($ratio -lt 0.85) {
    $dstH = 5400
    $dstW = [int][Math]::Round($dstH * $ratio)
  } else {
    $dstW = 4500
    $dstH = 4500
  }

  $dst = New-Object System.Drawing.Bitmap($dstW, $dstH)
  $g = [System.Drawing.Graphics]::FromImage($dst)
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.DrawImage($Tile, 0, 0, $dstW, $dstH)
  $g.Dispose()

  $jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/png" }
  $dst.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $dst.Dispose()
}

New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

$files = Get-ChildItem -Path $InputDir -File -Filter "*.png" | Sort-Object Name
foreach ($file in $files) {
  $bmp = New-Object System.Drawing.Bitmap($file.FullName)
  try {
    $hRuns = Get-DarkLineRuns -Bmp $bmp -Horizontal $true
    $vRuns = Get-DarkLineRuns -Bmp $bmp -Horizontal $false
    $ys = Get-CutPoints -Size $bmp.Height -Runs $hRuns
    $xs = Get-CutPoints -Size $bmp.Width -Runs $vRuns

    $tileIndex = 1
    for ($yi = 0; $yi -lt $ys.Count - 1; $yi++) {
      $y1 = $ys[$yi]
      $y2 = $ys[$yi + 1]
      $h = $y2 - $y1
      if ($h -lt 220) { continue }

      for ($xi = 0; $xi -lt $xs.Count - 1; $xi++) {
        $x1 = $xs[$xi]
        $x2 = $xs[$xi + 1]
        $w = $x2 - $x1
        if ($w -lt 220) { continue }

        $rect = New-Object System.Drawing.Rectangle($x1, $y1, $w, $h)
        $tile = $bmp.Clone($rect, $bmp.PixelFormat)
        try {
          $nonDark = 0
          for ($sy = 0; $sy -lt [Math]::Min(40, $tile.Height); $sy += 2) {
            for ($sx = 0; $sx -lt [Math]::Min(40, $tile.Width); $sx += 2) {
              $px = $tile.GetPixel($sx, $sy)
              $lum = (0.299 * $px.R) + (0.587 * $px.G) + (0.114 * $px.B)
              if ($lum -gt 20) { $nonDark++ }
            }
          }
          if ($nonDark -lt 10) { continue }

          $stem = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
          $outName = "{0}_tile_{1:D2}.png" -f $stem, $tileIndex
          $outPath = Join-Path $OutputDir $outName
          Save-ResizedTile -Tile $tile -OutPath $outPath
          $tileIndex++
        }
        finally {
          $tile.Dispose()
        }
      }
    }
  }
  finally {
    $bmp.Dispose()
  }
}

Get-ChildItem -Path $OutputDir -File -Filter "*.png" |
  Select-Object Name, Length |
  Sort-Object Name
