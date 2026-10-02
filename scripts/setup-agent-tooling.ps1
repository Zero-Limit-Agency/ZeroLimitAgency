param(
  [switch]$ApplyECC,
  [switch]$WithVideo
)

$ErrorActionPreference = "Stop"

function Step($message) {
  Write-Host ""
  Write-Host "==> $message" -ForegroundColor Cyan
}

function Has-Command($name) {
  return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

Step "Checking prerequisites"
if (-not (Has-Command "node")) {
  throw "Node.js is required. Install Node.js 20 first, then re-run this script."
}
if (-not (Has-Command "npm")) {
  throw "npm is required."
}

$nodeVersion = node -p "process.versions.node"
$nodeMajor = [int](node -p "process.versions.node.split('.')[0]")
Write-Host "Node.js $nodeVersion"

if ($nodeMajor -lt 20 -or $nodeMajor -ge 23) {
  throw "This repository expects Node.js >=20 and <23."
}

Step "Installing token-efficient Playwright CLI"
npm install -g @playwright/cli@latest
playwright-cli install --skills=agents -g

Step "Installing focused global Codex skills"
npx --yes skills add vercel-labs/agent-skills --skill web-design-guidelines --skill vercel-react-best-practices -g -a codex -y

if ($WithVideo) {
  Step "Installing Remotion skill for video/motion tasks"
  npx --yes skills add remotion-dev/skills --skill remotion-best-practices -g -a codex -y
}

Step "Preflighting ECC for Codex (no writes)"
npx --yes ecc-universal@2.2.1 install --guided --harness codex --dry-run

if ($ApplyECC) {
  Step "Installing ECC core profile for Codex"
  npx --yes ecc-universal@2.2.1 install --guided --harness codex --profile core --yes
} else {
  Write-Host ""
  Write-Host "ECC was NOT installed. The dry-run above only checked for conflicts." -ForegroundColor Yellow
  Write-Host "Re-run with -ApplyECC after reviewing the dry-run:" -ForegroundColor Yellow
  Write-Host "  .\scripts\setup-agent-tooling.ps1 -ApplyECC" -ForegroundColor Yellow
}

Step "Showing installed skills"
npx --yes skills list

Write-Host ""
Write-Host "Bootstrap complete." -ForegroundColor Green
Write-Host "Deferred intentionally: QMD (requires Node 22), Strix, Agent Reach, model routers, and other invasive/specialized tooling."
