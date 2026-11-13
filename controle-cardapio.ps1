$ErrorActionPreference = "Stop"
$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$logsPath = Join-Path $projectPath "logs"
$serverStdOut = Join-Path $logsPath "node-stdout.log"
$serverStdErr = Join-Path $logsPath "node-stderr.log"
$tunnelStdOut = Join-Path $logsPath "cloudflared-stdout.log"
$tunnelStdErr = Join-Path $logsPath "cloudflared-stderr.log"
$serverProcess = $null
$tunnelProcess = $null

try {
  try {
    $rawUi = $Host.UI.RawUI
    $rawUi.WindowSize = New-Object Management.Automation.Host.Size(76, 18)
    $rawUi.BufferSize = New-Object Management.Automation.Host.Size(76, 300)
  } catch {
    # Alguns terminais não permitem ajustar o tamanho da janela.
  }

  $Host.UI.RawUI.WindowTitle = "Cardápio Digital - Controle"

  function Stop-TrackedProcess($process, $label) {
    if ($null -ne $process) {
      $process.Refresh()
      if (-not $process.HasExited) {
        & taskkill.exe /PID $process.Id /T /F *> $null
      }
      Write-Host "$label encerrado." -ForegroundColor Yellow
    }
  }

  function Stop-Cardapio {
    Stop-TrackedProcess $script:tunnelProcess "Túnel Cloudflare"
    Stop-TrackedProcess $script:serverProcess "Servidor do cardápio"
    $script:tunnelProcess = $null
    $script:serverProcess = $null
  }

  function Test-ProcessRunning($process) {
    if ($null -eq $process) { return $false }
    $process.Refresh()
    return -not $process.HasExited
  }

  function Open-LogsTerminal {
    $viewer = Join-Path $projectPath "logs-cardapio.ps1"
    $powershellExe = Join-Path $PSHOME "powershell.exe"
    $arguments = "-NoLogo -NoExit -ExecutionPolicy Bypass -File `"$viewer`""
    Start-Process -FilePath $powershellExe -ArgumentList $arguments -WorkingDirectory $projectPath
  }

  function Start-Cardapio {
    New-Item -ItemType Directory -Path $logsPath -Force | Out-Null

    if ($null -eq $script:serverProcess -or $script:serverProcess.HasExited) {
      if (-not (Test-Path (Join-Path $projectPath ".next"))) {
        Write-Host "Preparando a versão de produção do cardápio..." -ForegroundColor Cyan
        & npm.cmd run build
        if ($LASTEXITCODE -ne 0) {
          throw "A compilação do cardápio falhou."
        }
      }

      Write-Host "Iniciando o servidor do cardápio..." -ForegroundColor Cyan
      $script:serverProcess = Start-Process -FilePath $env:ComSpec `
        -ArgumentList "/c npm run start" `
        -WorkingDirectory $projectPath `
        -WindowStyle Hidden `
        -RedirectStandardOutput $serverStdOut `
        -RedirectStandardError $serverStdErr `
        -PassThru
      Start-Sleep -Seconds 5
    } else {
      Write-Host "O servidor já está ligado." -ForegroundColor DarkGray
    }

    if ($null -eq $script:tunnelProcess -or $script:tunnelProcess.HasExited) {
      $cloudflared = Get-Command cloudflared -ErrorAction Stop
      Write-Host "Iniciando o túnel Cloudflare..." -ForegroundColor Cyan
      $script:tunnelProcess = Start-Process -FilePath $cloudflared.Source `
        -ArgumentList @("tunnel", "--config", (Join-Path $projectPath "config.yml"), "run", "4bc66d69-b9a7-4b32-90da-4d8ea868c542") `
        -WorkingDirectory $projectPath `
        -WindowStyle Hidden `
        -RedirectStandardOutput $tunnelStdOut `
        -RedirectStandardError $tunnelStdErr `
        -PassThru
    } else {
      Write-Host "O túnel já está ligado." -ForegroundColor DarkGray
    }

    Write-Host "Cardápio ligado: https://ascani-erva-doce.com.br" -ForegroundColor Green
  }

  if ($env:CARDAPIO_INICIAR_AO_ABRIR -eq "1") {
    try {
      Start-Cardapio
    } catch {
      Write-Host "Falha ao ligar: $($_.Exception.Message)" -ForegroundColor Red
      Stop-Cardapio
    }
  }

  while ($true) {
    Write-Host ""
    Write-Host "  CONTROLE DO CARDÁPIO DIGITAL" -ForegroundColor Green
    $cardapioAtivo = (Test-ProcessRunning $serverProcess) -or (Test-ProcessRunning $tunnelProcess)
    if ($cardapioAtivo) {
      Write-Host "  STATUS: LIGADO" -ForegroundColor Green
      Write-Host "  [D] Desligar o cardápio e o link público" -ForegroundColor White
      Write-Host "  [L] Abrir os logs em um novo terminal" -ForegroundColor White
    } else {
      Write-Host "  STATUS: DESLIGADO" -ForegroundColor Yellow
      Write-Host "  [Y] Ligar o cardápio e o link público" -ForegroundColor White
    }
    Write-Host ""
    $key = [Console]::ReadKey($true).KeyChar.ToString().ToUpperInvariant()

    if (-not $cardapioAtivo -and $key -eq "Y") {
      try {
        Start-Cardapio
      } catch {
        Write-Host "Falha ao ligar: $($_.Exception.Message)" -ForegroundColor Red
        Stop-Cardapio
      }
    } elseif ($cardapioAtivo -and $key -eq "D") {
      Stop-Cardapio
      Write-Host "Cardápio desligado. Este painel continua aberto." -ForegroundColor Yellow
    } elseif ($cardapioAtivo -and $key -eq "L") {
      try {
        Open-LogsTerminal
      } catch {
        Write-Host "Falha ao abrir os logs: $($_.Exception.Message)" -ForegroundColor Red
      }
    }
  }
} finally {
  Stop-Cardapio
}
