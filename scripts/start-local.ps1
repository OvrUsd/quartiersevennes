param(
  [int]$Port = 8000
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$LocalUrl = "http://127.0.0.1:$Port/"

function Find-Python {
  $codexPython = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
  if (Test-Path -LiteralPath $codexPython) {
    return @{
      File = $codexPython
      Args = @()
    }
  }

  $pyLauncher = Get-Command "py" -ErrorAction SilentlyContinue
  if ($pyLauncher) {
    return @{
      File = $pyLauncher.Source
      Args = @("-3")
    }
  }

  $python = Get-Command "python" -ErrorAction SilentlyContinue
  if ($python) {
    return @{
      File = $python.Source
      Args = @()
    }
  }

  return $null
}

$listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue

if (-not $listener) {
  $python = Find-Python
  if (-not $python) {
    Write-Host "Python est introuvable. Installe Python ou lance ce dossier depuis Codex."
    exit 1
  }

  $serverArgs = @()
  $serverArgs += $python.Args
  $serverArgs += @("-m", "http.server", "$Port", "--bind", "127.0.0.1")

  Start-Process -FilePath $python.File -ArgumentList $serverArgs -WorkingDirectory $RepoRoot -WindowStyle Minimized
  Start-Sleep -Seconds 2
}

Start-Process $LocalUrl
Write-Host "Site local ouvert : $LocalUrl"
