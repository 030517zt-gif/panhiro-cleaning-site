param(
  [string]$ApiKey = $env:MYCODEXHUB_API_KEY,
  [string]$BaseUrl = "https://sub2api.mycodexhub.xyz/antigravity",
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$ClaudeArgs
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($ApiKey)) {
  $ApiKey = $env:ANTHROPIC_AUTH_TOKEN
}

if ([string]::IsNullOrWhiteSpace($ApiKey)) {
  $secureKey = Read-Host "MyCodexHub API Key" -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
  try {
    $ApiKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  } finally {
    if ($bstr -ne [IntPtr]::Zero) {
      [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
  }
}

if ([string]::IsNullOrWhiteSpace($ApiKey)) {
  throw "API Key is required. Pass -ApiKey, set MYCODEXHUB_API_KEY, or set ANTHROPIC_AUTH_TOKEN."
}

$env:ANTHROPIC_BASE_URL = $BaseUrl
$env:ANTHROPIC_AUTH_TOKEN = $ApiKey
$env:CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = "1"

$claudeCommand = Get-Command claude -ErrorAction SilentlyContinue
if ($claudeCommand) {
  & $claudeCommand.Source @ClaudeArgs
  exit $LASTEXITCODE
}

$npmPrefix = npm prefix -g
$claudeCmd = Join-Path $npmPrefix "claude.cmd"
if (Test-Path $claudeCmd) {
  & $claudeCmd @ClaudeArgs
  exit $LASTEXITCODE
}

throw "Claude Code is not installed or is not on PATH. Install it with: npm install -g @anthropic-ai/claude-code"
