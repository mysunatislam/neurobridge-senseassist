param(
  [Parameter(Mandatory = $true)]
  [ValidateScript({ Test-Path -LiteralPath $_ -PathType Leaf })]
  [string]$SourceTranscript,

  [string]$OutputPath = (Join-Path $PSScriptRoot 'DEVELOPMENT_TRACE.redacted.jsonl')
)

$ErrorActionPreference = 'Stop'
$sourceConversationId = 'be982013-e243-4138-9402-54fa1a1d3b3a'
$projectName = 'neurobridge-senseassist'

function Get-Sha256Text {
  param([AllowNull()][string]$Text)

  $bytes = [System.Text.Encoding]::UTF8.GetBytes($(if ($null -eq $Text) { '' } else { $Text }))
  $algorithm = [System.Security.Cryptography.SHA256]::Create()
  try {
    return (($algorithm.ComputeHash($bytes) | ForEach-Object { $_.ToString('x2') }) -join '')
  }
  finally {
    $algorithm.Dispose()
  }
}

function Replace-TrackedPattern {
  param(
    [Parameter(Mandatory = $true)][AllowEmptyString()][string]$InputText,
    [Parameter(Mandatory = $true)][string]$Pattern,
    [Parameter(Mandatory = $true)][string]$Replacement,
    [Parameter(Mandatory = $true)][string]$Category,
    [Parameter(Mandatory = $true)][AllowEmptyCollection()][System.Collections.Generic.List[string]]$Categories
  )

  if ([regex]::IsMatch($InputText, $Pattern)) {
    if (-not $Categories.Contains($Category)) {
      $Categories.Add($Category)
    }
    return [regex]::Replace($InputText, $Pattern, $Replacement)
  }
  return $InputText
}

function Protect-TraceContent {
  param([AllowNull()][string]$Content)

  $categories = [System.Collections.Generic.List[string]]::new()
  if ($null -eq $Content) {
    return [pscustomobject]@{ Content = $null; Categories = @() }
  }

  $safe = $Content

  # Preserve useful project-relative evidence while removing the workstation identity.
  $safe = Replace-TrackedPattern $safe '(?i)file:///[a-z]:/users/[^/\s"''<>]+/\.gemini/antigravity/scratch/neurobridge-senseassist/?' '<PROJECT_ROOT>/' 'project-root' $categories
  $safe = Replace-TrackedPattern $safe '(?i)file:/+[a-z]%3a/users/[^/\s"''<>]+/\.gemini/antigravity/scratch/neurobridge-senseassist/?' '<PROJECT_ROOT>/' 'project-root' $categories
  $safe = Replace-TrackedPattern $safe '(?i)[a-z]:\\users\\[^\\\r\n"''<>]+\\\.gemini\\antigravity\\scratch\\neurobridge-senseassist\\?' '<PROJECT_ROOT>\\' 'project-root' $categories
  $safe = Replace-TrackedPattern $safe '(?i)file:/+[a-z]%3a/[^\s"''<>]+' '<LOCAL_FILE>' 'local-path' $categories
  $safe = Replace-TrackedPattern $safe '(?i)(?:file:/+)?[a-z]:[\\/]+users[\\/]+[^\\/\r\n"''<>\s]+' '<USER_HOME>' 'local-path' $categories
  $safe = Replace-TrackedPattern $safe '(?i)file:///[a-z]:/[^\s"''<>]+' '<LOCAL_FILE>' 'local-path' $categories
  $safe = Replace-TrackedPattern $safe '(?i)\b[a-z]:\\[^\r\n"''<>]+' '<LOCAL_PATH>' 'local-path' $categories
  $safe = Replace-TrackedPattern $safe '(?i)file:/+(?:<LOCAL_PATH>|<LOCAL_FILE>|<USER_HOME>)' '<LOCAL_FILE>' 'local-path' $categories
  $safe = Replace-TrackedPattern $safe '(?i)\b[\w.%+\-]+@[\w.\-]+\.[a-z]{2,}\b' '<EMAIL>' 'email' $categories
  $safe = Replace-TrackedPattern $safe ([regex]::Escape($sourceConversationId)) '<SOURCE_CONVERSATION_ID>' 'conversation-id' $categories

  # Redact well-known credentials, JWTs, bearer values, secret assignments,
  # private-key blocks, and database connection strings.
  $credentialPattern = '(?i)\b(?:sk-(?:proj-)?[a-z0-9_\-]{12,}|AIza[a-z0-9_\-]{20,}|gh[pousr]_[a-z0-9]{20,}|github_pat_[a-z0-9_]{20,}|xox[baprs]-[a-z0-9\-]{10,})\b|\beyJ[a-z0-9_\-]{10,}\.[a-z0-9_\-]{10,}\.[a-z0-9_\-]{10,}\b|(?s)-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----.*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'
  $safe = Replace-TrackedPattern $safe $credentialPattern '<REDACTED_CREDENTIAL>' 'credential' $categories
  $safe = Replace-TrackedPattern $safe '(?i)(\bBearer\s+)[a-z0-9._~+/\-]+=*' '${1}<REDACTED_CREDENTIAL>' 'credential' $categories
  $safe = Replace-TrackedPattern $safe '(?i)(["'']?(?:api[_-]?key|access[_-]?token|refresh[_-]?token|secret|password|authorization|vite_gemini_api_key)["'']?\s*[:=]\s*["'']?)[^\s,"'';}]+' '${1}<REDACTED_CREDENTIAL>' 'credential' $categories
  $safe = Replace-TrackedPattern $safe '(?i)\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^\s"''<>]+' '<REDACTED_CONNECTION_STRING>' 'connection-string' $categories

  # Query parameters can carry signed URLs or session identifiers. Retain only
  # the origin and path so tool navigation remains understandable.
  $safe = Replace-TrackedPattern $safe '(?i)(https?://[^\s?"''<>]+)\?[^\s"''<>]+' '${1}?<REDACTED_QUERY>' 'url-query' $categories

  # Fail closed if a recognizable secret survives the substitutions.
  $survivorPattern = '(?i)\b(?:sk-(?:proj-)?[a-z0-9_\-]{12,}|AIza[a-z0-9_\-]{20,}|gh[pousr]_[a-z0-9]{20,}|github_pat_[a-z0-9_]{20,}|xox[baprs]-[a-z0-9\-]{10,})\b|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'
  if ([regex]::IsMatch($safe, $survivorPattern)) {
    $safe = '[WITHHELD: content failed the post-redaction credential check]'
    if (-not $categories.Contains('safety-fallback-withheld')) {
      $categories.Add('safety-fallback-withheld')
    }
  }

  return [pscustomobject]@{ Content = $safe; Categories = @($categories) }
}

$outputDirectory = Split-Path -Parent $OutputPath
if (-not (Test-Path -LiteralPath $outputDirectory)) {
  New-Item -ItemType Directory -Path $outputDirectory | Out-Null
}

$sequence = 0
$outputLines = [System.Collections.Generic.List[string]]::new()
foreach ($line in [System.IO.File]::ReadLines((Resolve-Path -LiteralPath $SourceTranscript))) {
  if ([string]::IsNullOrWhiteSpace($line)) { continue }

  $sourceEvent = $line | ConvertFrom-Json
  $sourceContent = if ($null -eq $sourceEvent.content) { $null } else { [string]$sourceEvent.content }
  $protected = Protect-TraceContent $sourceContent
  $timestamp = ([DateTime]$sourceEvent.created_at).ToUniversalTime().ToString('o')

  $event = [ordered]@{
    schemaVersion = '1.0.0'
    sequence = $sequence
    sourceStepIndex = [int64]$sourceEvent.step_index
    timestampUtc = $timestamp
    source = [string]$sourceEvent.source
    eventType = [string]$sourceEvent.type
    status = [string]$sourceEvent.status
    sourceContentSha256 = Get-Sha256Text $sourceContent
    content = $protected.Content
    redactionsApplied = @($protected.Categories)
    sourceTruncatedFields = if ($null -eq $sourceEvent.truncated_fields) { $null } else { @($sourceEvent.truncated_fields) }
  }

  $outputLines.Add(($event | ConvertTo-Json -Depth 20 -Compress))
  $sequence++
}

[System.IO.File]::WriteAllLines($OutputPath, $outputLines, [System.Text.UTF8Encoding]::new($false))
Write-Output "Exported $sequence redacted trace events to $OutputPath"
