$ErrorActionPreference = "Continue"
$logsDirectory = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) "logs"
$sources = @(
  @{ Name = "NODE / NEXT.JS"; Path = (Join-Path $logsDirectory "node-stdout.log") },
  @{ Name = "ERROS NODE / NEXT.JS"; Path = (Join-Path $logsDirectory "node-stderr.log") },
  @{ Name = "CLOUDFLARED"; Path = (Join-Path $logsDirectory "cloudflared-stdout.log") },
  @{ Name = "ERROS CLOUDFLARED"; Path = (Join-Path $logsDirectory "cloudflared-stderr.log") }
)
$positions = @{}
$pending = @{}

try {
  $Host.UI.RawUI.WindowTitle = "Logs - Cardápio e Cloudflare"
  try {
    $Host.UI.RawUI.WindowSize = New-Object Management.Automation.Host.Size(100, 28)
    $Host.UI.RawUI.BufferSize = New-Object Management.Automation.Host.Size(100, 2000)
  } catch {
    # Alguns terminais não permitem ajustar o tamanho da janela.
  }

  Write-Host "LOGS DO CARDÁPIO E DO TÚNEL CLOUDFLARED" -ForegroundColor Green
  Write-Host "Acompanhamento ao vivo. Feche esta janela para parar de acompanhar."

  foreach ($source in $sources) {
    $positions[$source.Path] = 0L
    $pending[$source.Path] = ""
    Write-Host ""
    Write-Host "--- $($source.Name) ---" -ForegroundColor Cyan
    if (Test-Path -LiteralPath $source.Path) {
      Get-Content -LiteralPath $source.Path -Tail 25 | ForEach-Object { Write-Host "[$($source.Name)] $_" }
      $positions[$source.Path] = (Get-Item -LiteralPath $source.Path).Length
    } else {
      Write-Host "[$($source.Name)] Aguardando o primeiro registro..." -ForegroundColor DarkGray
    }
  }

  while ($true) {
    foreach ($source in $sources) {
      if (-not (Test-Path -LiteralPath $source.Path)) { continue }

      $stream = $null
      $reader = $null
      try {
        $stream = [System.IO.File]::Open(
          $source.Path,
          [System.IO.FileMode]::Open,
          [System.IO.FileAccess]::Read,
          [System.IO.FileShare]::ReadWrite
        )
        if ($stream.Length -lt $positions[$source.Path]) {
          $positions[$source.Path] = 0L
          $pending[$source.Path] = ""
        }
        $stream.Position = $positions[$source.Path]
        $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::UTF8, $true)
        $chunk = $reader.ReadToEnd()
        $positions[$source.Path] = $stream.Position

        if ($chunk) {
          $parts = ($pending[$source.Path] + $chunk) -split "`r?`n"
          $pending[$source.Path] = $parts[-1]
          for ($index = 0; $index -lt $parts.Length - 1; $index++) {
            if ($parts[$index]) { Write-Host "[$($source.Name)] $($parts[$index])" }
          }
        }
      } catch {
        # Os processos podem estar escrevendo no arquivo enquanto ele é lido.
      } finally {
        if ($null -ne $reader) { $reader.Dispose() }
        elseif ($null -ne $stream) { $stream.Dispose() }
      }
    }
    Start-Sleep -Milliseconds 400
  }
} finally {
  Write-Host "Acompanhamento encerrado." -ForegroundColor Yellow
}
