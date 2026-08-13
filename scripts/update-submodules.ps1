#!/usr/bin/env pwsh
#Requires -Version 5.1
param(
  [switch]$Status,
  [switch]$Commit,
  [Alias('h')]
  [switch]$Help
)

$ErrorActionPreference = 'Stop'
# Avoid treating expected non-zero git exits (e.g. git diff) as terminating errors in PS 7+.
if (Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue) {
  $PSNativeCommandUseErrorActionPreference = $false
}

if ($Help) {
  Write-Host "Usage: $($MyInvocation.MyCommand.Name) [-Status] [-Commit]"
  Write-Host "  -Status  Show repos/ submodule SHAs/branches without updating"
  Write-Host "  -Commit  Commit submodule pointer updates in the parent repo"
  exit 0
}

$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $Root

function Assert-LastExitCode {
  param([string]$Message)
  if ($LASTEXITCODE -ne 0) {
    throw "$Message (exit code $LASTEXITCODE)"
  }
}

function Get-SubmoduleEntries {
  $entries = @()
  $pathLines = git config -f .gitmodules --get-regexp '^submodule\..*\.path$'
  foreach ($line in $pathLines) {
    if ($line -match '^submodule\.(.+)\.path\s+(.+)$') {
      $name = $Matches[1]
      $path = $Matches[2]
      $branch = git config -f .gitmodules --get "submodule.$name.branch"
      if (-not $branch) { $branch = 'main' }
      $entries += [pscustomobject]@{ Name = $name; Path = $path; Branch = $branch }
    }
  }
  return $entries
}

function Get-SubmoduleStatus {
  foreach ($entry in Get-SubmoduleEntries) {
    Push-Location $entry.Path
    try {
      $sha = git rev-parse --short HEAD
      Assert-LastExitCode "git rev-parse failed in $($entry.Path)"
      $branch = git branch --show-current
      Write-Host "$($entry.Name): $sha on $branch"
    } finally {
      Pop-Location
    }
  }
}

if ($Status) {
  foreach ($entry in Get-SubmoduleEntries) {
    Push-Location $entry.Path
    try {
      git fetch origin 2>$null | Out-Null
    } finally {
      Pop-Location
    }
  }
  Get-SubmoduleStatus
  exit 0
}

Write-Host 'Syncing submodule configuration...'
git submodule sync --recursive
Assert-LastExitCode 'git submodule sync failed'

Write-Host 'Initializing submodules...'
git submodule update --init --recursive
Assert-LastExitCode 'git submodule update --init failed'

Write-Host 'Updating submodules to latest tracked branch...'
git submodule update --remote --merge
Assert-LastExitCode 'git submodule update --remote failed'

Write-Host 'Checking out tracked branch in each submodule...'
foreach ($entry in Get-SubmoduleEntries) {
  Push-Location $entry.Path
  try {
    git checkout -B $entry.Branch "origin/$($entry.Branch)"
    Assert-LastExitCode "git checkout failed in $($entry.Path)"
  } finally {
    Pop-Location
  }
}

Write-Host ''
Write-Host 'Submodule status:'
Get-SubmoduleStatus

if ($Commit) {
  $submodulePaths = @(
    git config -f .gitmodules --get-regexp '^submodule\..*\.path$' |
      ForEach-Object { ($_ -split '\s+', 2)[1] }
  )

  if ($submodulePaths.Count -eq 0) {
    Write-Host ''
    Write-Host 'No submodule paths found in .gitmodules.'
    exit 0
  }

  git diff --quiet -- @submodulePaths
  if ($LASTEXITCODE -eq 0) {
    Write-Host ''
    Write-Host 'No submodule pointer changes to commit.'
  } else {
    git add -- @submodulePaths
    Assert-LastExitCode 'git add failed'

    git commit -m "chore: update submodules"
    Assert-LastExitCode 'git commit failed'

    Write-Host ''
    Write-Host 'Committed submodule pointer updates.'
  }
}
