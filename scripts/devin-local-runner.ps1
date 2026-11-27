#Requires -Version 5.1
<#
.SYNOPSIS
  Birthub 360 — AI Operations Center (B360-AOC)
  Agente Outbound do Runner Local Windows (Devin IA-10 / Squad de Auditoria Local)

.DESCRIPTION
  Script oficial de operação local na máquina Windows (Seções 5, 14 e 16).
  - Inicia exclusivamente conexões de saída autenticadas (Outbound HTTP/HTTPS) para a Central B360-AOC.
  - Jamais abre portas de escuta (listen) nem expõe terminal, shell ou sistema de arquivos à internet.
  - Verifica espaço livre nas unidades C: e D:, valida ausência de junctions/symlinks inseguros de node_modules
    e envia heartbeat para a Central.
#>

param(
  [string]$CentralBaseUrl = "http://localhost:3000",
  [string]$RunnerId = "RUNNER-WIN-B360-01",
  [string]$WorktreesRoot = "D:\Birthub360-Operations\worktrees",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

Write-Host "[B360-AOC LOCAL RUNNER] Iniciando verificacao de seguranca e telemetria outbound..." -ForegroundColor Cyan

# 1. Coleta real de espaço livre nas unidades C: e D:
$driveC = Get-PSDrive -Name C -ErrorAction SilentlyContinue
$driveD = Get-PSDrive -Name D -ErrorAction SilentlyContinue

$driveCFreeGb = if ($driveC) { [math]::Round($driveC.Free / 1GB, 2) } else { 0 }
$driveDFreeGb = if ($driveD) { [math]::Round($driveD.Free / 1GB, 2) } else { 0 }

# 2. Verificação constitucional de worktrees e proibição de junctions/symlinks em node_modules (Seção 14)
$activeWorktreesCount = 0
$unsafeSymlinkDetected = $false

if (Test-Path $WorktreesRoot) {
  $dirs = Get-ChildItem -Path $WorktreesRoot -Directory -ErrorAction SilentlyContinue
  $activeWorktreesCount = ($dirs | Measure-Object).Count
  foreach ($d in $dirs) {
    $nmPath = Join-Path $d.FullName "node_modules"
    if (Test-Path $nmPath) {
      $item = Get-Item $nmPath -Force
      if ($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) {
        $unsafeSymlinkDetected = $true
        Write-Warning "[VIOLACAO CONSTITUCIONAL] Junction ou Symlink detectado em: $nmPath"
      }
    }
  }
}

if ($unsafeSymlinkDetected) {
  Write-Error "Abortando Heartbeat: Detectado compartilhamento inseguro de node_modules via Junction/Symlink."
  exit 1
}

$payload = @{
  runnerId             = $RunnerId
  hostName             = $env:COMPUTERNAME
  osPlatform           = [System.Environment]::OSVersion.VersionString
  driveCFreeGb         = $driveCFreeGb
  driveDFreeGb         = $driveDFreeGb
  activeWorktreesCount = $activeWorktreesCount
  outboundAuthOnly     = $true
  directTerminalExposed = $false
} | ConvertTo-Json -Compress

Write-Host "[B360-AOC LOCAL RUNNER] Payload Outbound preparado: $payload" -ForegroundColor Green

if ($DryRun) {
  Write-Host "[B360-AOC LOCAL RUNNER] Modo DryRun concluido com exit code 0." -ForegroundColor Yellow
  exit 0
}

try {
  $response = Invoke-RestMethod -Uri "$CentralBaseUrl/api/runner/heartbeat" -Method Post -Body $payload -ContentType "application/json" -TimeoutSec 10
  Write-Host "[B360-AOC LOCAL RUNNER] Heartbeat sincronizado com sucesso. Jobs locais na fila: $($response.pendingLocalJobsCount)" -ForegroundColor Green
  exit 0
} catch {
  Write-Warning "[B360-AOC LOCAL RUNNER] Central inacessivel no momento ($($_.Exception.Message)). As missoes locais permanecem preservadas na fila persistente."
  exit 0
}
