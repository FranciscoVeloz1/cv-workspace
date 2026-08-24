#!/usr/bin/env pwsh
#Requires -Version 5.1
param(
  [switch]$Status,
  [switch]$Commit,
  [Parameter(Position = 0)]
  [string]$Folder,
  [Alias('h')]
  [switch]$Help
)

$ErrorActionPreference = 'Stop'
if (Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue) {
  $PSNativeCommandUseErrorActionPreference = $false
}

$ValidFolders = @('docs', 'templates', 'productive-apps', 'utils', 'personal-projects')

if ($Help) {
  Write-Host "Usage: $($MyInvocation.MyCommand.Name) [-Status] [-Commit] [folder]"
  Write-Host "  -Status  Show submodule SHAs/branches without updating"
  Write-Host "  -Commit  Commit submodule pointer updates in the parent repo"
  Write-Host "  folder   Limit to repos/<folder>/ : $($ValidFolders -join ', ')"
  exit 0
}

if ($Folder -and $ValidFolders -notcontains $Folder) {
  throw "Unknown folder '$Folder'. Use: $($ValidFolders -join ', ')"
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
      if ($Folder -and $path -notlike "repos/$Folder/*") { continue }
      $branch = git config -f .gitmodules --get "submodule.$name.branch"
      if (-not $branch) { $branch = 'main' }
      $entries += [pscustomobject]@{ Name = $name; Path = $path; Branch = $branch }
    }
  }
  return $entries
}

$entries = @(Get-SubmoduleEntries)
if ($entries.Count -eq 0) {
  throw "No submodule paths matched$(if ($Folder) { " in repos/$Folder/" })."
}

function Get-SubmoduleStatus {
  foreach ($entry in $entries) {
    Push-Location $entry.Path
    try {
      $sha = git rev-parse --short HEAD
      Assert-LastExitCode "git rev-parse failed in $($entry.Path)"
      $branch = git branch --show-current
      Write-Host "$($entry.Path): $sha on $branch"
    } finally {
      Pop-Location
    }
  }
}

if ($Status) {
  foreach ($entry in $entries) {
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

$submodulePaths = @($entries.Path)

Write-Host 'Syncing submodule configuration...'
git submodule sync --recursive
Assert-LastExitCode 'git submodule sync failed'

Write-Host 'Initializing matched submodules...'
git submodule update --init --recursive -- @submodulePaths
Assert-LastExitCode 'git submodule update --init failed'

Write-Host 'Updating matched submodules to latest tracked branch...'
git submodule update --remote --merge -- @submodulePaths
Assert-LastExitCode 'git submodule update --remote failed'

Write-Host 'Checking out tracked branch in each matched submodule...'
foreach ($entry in $entries) {
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
