[CmdletBinding()]
param(
  [string]$OutputDirectory,
  # 只打指定架构的 MSIX。默认 all（x64 + arm64），CI 只打 x64 以缩短时间
  [ValidateSet("all", "x64", "arm64")]
  [string]$Architectures = "all"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$packageIdentityName = "muxidream.1999WallpaperArchive"
$packagePublisher = "CN=21C7B139-325F-40DD-A212-9EAC8106A008"
$publisherDisplayName = [regex]::Unescape("\u9ed8\u9ed8(muxidream)")
$executableName = "re1999-archive.exe"

$tauriDirectory = Split-Path -Parent $PSScriptRoot
$repositoryRoot = (Resolve-Path (Join-Path $tauriDirectory "..\..")).Path
$baseConfigPath = Join-Path $tauriDirectory "tauri.conf.json"
$windowsConfigPath = Join-Path $tauriDirectory "tauri.windows.conf.json"
$storeConfigPath = Join-Path $tauriDirectory "tauri.microsoftstore.conf.json"

if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
  $OutputDirectory = Join-Path $tauriDirectory "target\microsoft-store"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputDirectory)) {
  $OutputDirectory = Join-Path $repositoryRoot $OutputDirectory
}
$OutputDirectory = [System.IO.Path]::GetFullPath($OutputDirectory)

$tauriConfig = [System.IO.File]::ReadAllText($baseConfigPath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json
$windowsConfig = [System.IO.File]::ReadAllText($windowsConfigPath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json
$applicationDisplayName = [string]$tauriConfig.productName
$applicationDescription = $applicationDisplayName
# tauri build 按 base -> windows -> store 顺序合并配置；store 不含 version，故 windows 优先、base 兜底
$semver = if ($windowsConfig.PSObject.Properties.Name -contains "version" -and $windowsConfig.version) {
  [string]$windowsConfig.version
} else {
  [string]$tauriConfig.version
}
if ($semver -notmatch '^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$') {
  throw "Tauri version '$semver' cannot be converted to an MSIX version. Expected major.minor.patch."
}
$versionParts = @([int]$Matches[1], [int]$Matches[2], [int]$Matches[3], 0)
if (@($versionParts | Where-Object { $_ -gt 65535 }).Count -gt 0) {
  throw "MSIX version components must be between 0 and 65535."
}
$packageVersion = $versionParts -join "."

$makeAppx = Get-Command "makeappx.exe" -ErrorAction SilentlyContinue
if ($null -eq $makeAppx) {
  $windowsKitsBin = Join-Path ${env:ProgramFiles(x86)} "Windows Kits\10\bin"
  if (Test-Path -LiteralPath $windowsKitsBin) {
    $makeAppx = Get-ChildItem -LiteralPath $windowsKitsBin -Filter "makeappx.exe" -File -Recurse |
      Where-Object { $_.Directory.Name -eq "x64" } |
      Sort-Object { [version]$_.Directory.Parent.Name } -Descending |
      Select-Object -First 1
  }
}
if ($null -eq $makeAppx) {
  throw "MakeAppx.exe was not found. Install the Windows 10 or Windows 11 SDK, then run this command again."
}
$makeAppxPath = if ($null -ne $makeAppx.PSObject.Properties["Path"]) {
  $makeAppx.Path
} else {
  $makeAppx.FullName
}

function Import-Arm64MsvcEnvironment {
  $vswhereCandidates = @(
    (Join-Path ${env:ProgramFiles(x86)} "Microsoft Visual Studio\Installer\vswhere.exe"),
    (Join-Path $env:ProgramFiles "Microsoft Visual Studio\Installer\vswhere.exe")
  ) | Where-Object { Test-Path -LiteralPath $_ }
  $vswhereCandidates = @($vswhereCandidates)
  if (@($vswhereCandidates).Count -eq 0) {
    throw "Visual Studio Build Tools were not found. Install Visual Studio 2026 with the MSVC ARM64 build tools component."
  }
  $vswherePath = $vswhereCandidates[0]

  # Prefer VS2026 (major version 18) and then the newest installed instance.
  # VS2026 uses a different component catalog, so ARM64 availability is
  # verified by the actual vcvarsall/cl.exe files below instead of an old
  # VS2022-only component id.
  $instances = & $vswherePath -products * -format json | ConvertFrom-Json
  $installationPath = $instances |
    Where-Object { $_.isComplete -and $_.installationVersion -like '18.*' } |
    Sort-Object { [version]$_.installationVersion } -Descending |
    Select-Object -First 1 -ExpandProperty installationPath
  if ([string]::IsNullOrWhiteSpace($installationPath)) {
    $installationPath = $instances |
      Where-Object { $_.isComplete } |
      Sort-Object { [version]$_.installationVersion } -Descending |
      Select-Object -First 1 -ExpandProperty installationPath
  }
  if ([string]::IsNullOrWhiteSpace($installationPath)) {
    throw "MSVC ARM64 build tools were not found in Visual Studio 2026. Add the ARM64 C++ build tools component in Visual Studio Installer."
  }

  $vcvarsPath = Join-Path $installationPath "VC\Auxiliary\Build\vcvarsall.bat"
  if (-not (Test-Path -LiteralPath $vcvarsPath)) {
    throw "Visual Studio ARM64 environment script was not found: $vcvarsPath"
  }

  $msvcToolsRoot = Join-Path $installationPath "VC\Tools\MSVC"
  $arm64Toolset = Get-ChildItem -LiteralPath $msvcToolsRoot -Directory |
    Where-Object {
      Test-Path -LiteralPath (Join-Path $_.FullName "bin\Hostx64\arm64\cl.exe")
    } |
    Sort-Object { [version]$_.Name } -Descending |
    Select-Object -First 1
  if ($null -eq $arm64Toolset) {
    throw "VS2026 is installed, but no MSVC toolset containing Hostx64\arm64\cl.exe was found. Add the MSVC ARM64/ARM64EC build tools component."
  }

  $environmentLines = & cmd.exe /s /c "`"$vcvarsPath`" amd64_arm64 -vcvars_ver=$($arm64Toolset.Name) >nul && set"
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to initialize the MSVC ARM64 cross-compilation environment."
  }
  foreach ($line in $environmentLines) {
    if ($line -match '^([^=]+)=(.*)$') {
      [System.Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], "Process")
    }
  }
  $arm64BinDirectory = Join-Path $arm64Toolset.FullName "bin\Hostx64\arm64"
  $clPath = Join-Path $arm64BinDirectory "cl.exe"
  $libPath = Join-Path $arm64BinDirectory "lib.exe"
  if (-not (Test-Path -LiteralPath $clPath) -or -not (Test-Path -LiteralPath $libPath)) {
    throw "VS2026 is installed, but its ARM64 compiler was not found at '$arm64BinDirectory'. Add the MSVC ARM64/ARM64EC build tools component in Visual Studio Installer."
  }
  $env:Path = "$arm64BinDirectory;$env:Path"
  [System.Environment]::SetEnvironmentVariable("CC_aarch64-pc-windows-msvc", $clPath, "Process")
  [System.Environment]::SetEnvironmentVariable("AR_aarch64-pc-windows-msvc", $libPath, "Process")

  $clang = Get-ChildItem -LiteralPath $installationPath -Filter "clang.exe" -File -Recurse -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -match '\\Llvm\\.*\\bin\\clang\.exe$' } |
    Sort-Object FullName -Descending |
    Select-Object -First 1
  if ($null -eq $clang) {
    throw "VS2026 ARM64 tools are installed, but clang.exe was not found. Add the C++ Clang tools for Windows component."
  }
  $env:Path = "$($clang.Directory.FullName);$env:Path"
}

# 外层 @() 保证单架构时也是数组，避免退化成单个 hashtable 影响后续遍历
# 变量名不能叫 $architectures：PowerShell 变量名大小写不敏感，会和参数 $Architectures 撞车并被其 [string] 约束转成字符串
$architectureList = @(switch ($Architectures) {
  "x64" { @{ Name = "x64"; RustTarget = "x86_64-pc-windows-msvc" } }
  "arm64" { @{ Name = "arm64"; RustTarget = "aarch64-pc-windows-msvc" } }
  default {
    @{ Name = "x64"; RustTarget = "x86_64-pc-windows-msvc" }
    @{ Name = "arm64"; RustTarget = "aarch64-pc-windows-msvc" }
  }
})

New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$temporaryRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("1999-wallpaper-msix-" + [guid]::NewGuid().ToString("N"))
$packageDirectory = Join-Path $temporaryRoot "packages"
New-Item -ItemType Directory -Path $packageDirectory -Force | Out-Null

try {
  foreach ($architecture in $architectureList) {
    if ($architecture.Name -eq "arm64") {
      Import-Arm64MsvcEnvironment
    }

    & rustup target add $architecture.RustTarget
    if ($LASTEXITCODE -ne 0) { throw "Failed to install Rust target $($architecture.RustTarget)." }

    & pnpm -F app_tauri tauri build `
      --config $windowsConfigPath `
      --config $storeConfigPath `
      --target $architecture.RustTarget `
      --no-bundle
    if ($LASTEXITCODE -ne 0) { throw "Tauri build failed for $($architecture.Name)." }

    $binaryPath = Join-Path $repositoryRoot "target\$($architecture.RustTarget)\release\$executableName"
    if (-not (Test-Path -LiteralPath $binaryPath)) {
      throw "Built executable was not found at '$binaryPath'."
    }

    $stageDirectory = Join-Path $temporaryRoot ("stage-" + $architecture.Name)
    $assetDirectory = Join-Path $stageDirectory "Assets"
    New-Item -ItemType Directory -Path $assetDirectory -Force | Out-Null
    Copy-Item -LiteralPath $binaryPath -Destination (Join-Path $stageDirectory $executableName)
    Copy-Item -LiteralPath (Join-Path $tauriDirectory "icons\StoreLogo.png") -Destination $assetDirectory
    Copy-Item -LiteralPath (Join-Path $tauriDirectory "icons\Square44x44Logo.png") -Destination $assetDirectory
    Copy-Item -LiteralPath (Join-Path $tauriDirectory "icons\Square150x150Logo.png") -Destination $assetDirectory

    $manifest = @"
<?xml version="1.0" encoding="utf-8"?>
<Package
  xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10"
  xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10"
  xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities"
  IgnorableNamespaces="uap rescap">
  <Identity Name="$packageIdentityName" Publisher="$packagePublisher" Version="$packageVersion" ProcessorArchitecture="$($architecture.Name)" />
  <Properties>
    <DisplayName>$applicationDisplayName</DisplayName>
    <PublisherDisplayName>$publisherDisplayName</PublisherDisplayName>
    <Description>$applicationDescription</Description>
    <Logo>Assets\StoreLogo.png</Logo>
  </Properties>
  <Resources>
    <Resource Language="zh-CN" />
  </Resources>
  <Dependencies>
    <TargetDeviceFamily Name="Windows.Desktop" MinVersion="10.0.17763.0" MaxVersionTested="10.0.26100.0" />
  </Dependencies>
  <Applications>
    <Application Id="App" Executable="$executableName" EntryPoint="Windows.FullTrustApplication">
      <uap:VisualElements
        DisplayName="$applicationDisplayName"
        Description="$applicationDescription"
        BackgroundColor="transparent"
        Square44x44Logo="Assets\Square44x44Logo.png"
        Square150x150Logo="Assets\Square150x150Logo.png" />
    </Application>
  </Applications>
  <Capabilities>
    <Capability Name="internetClient" />
    <rescap:Capability Name="runFullTrust" />
  </Capabilities>
</Package>
"@
    $manifestPath = Join-Path $stageDirectory "AppxManifest.xml"
    [System.IO.File]::WriteAllText($manifestPath, $manifest, [System.Text.UTF8Encoding]::new($false))

    $packagePath = Join-Path $packageDirectory ("1999WallpaperArchive_{0}_{1}.msix" -f $packageVersion, $architecture.Name)
    & $makeAppxPath pack /d $stageDirectory /p $packagePath /o
    if ($LASTEXITCODE -ne 0) { throw "MSIX packaging failed for $($architecture.Name)." }

    $verifyDirectory = Join-Path $temporaryRoot ("verify-" + $architecture.Name)
    & $makeAppxPath unpack /p $packagePath /d $verifyDirectory /o | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "MSIX verification unpack failed for $($architecture.Name)." }
    $verifiedManifestPath = Join-Path $verifyDirectory "AppxManifest.xml"
    [xml]$verifiedManifest = [System.IO.File]::ReadAllText($verifiedManifestPath, [System.Text.Encoding]::UTF8)
    $manifestNamespace = [System.Xml.XmlNamespaceManager]::new($verifiedManifest.NameTable)
    $manifestNamespace.AddNamespace("f", "http://schemas.microsoft.com/appx/manifest/foundation/windows10")
    $verifiedPublisherDisplayName = $verifiedManifest.SelectSingleNode("/f:Package/f:Properties/f:PublisherDisplayName", $manifestNamespace).InnerText
    $verifiedLanguage = $verifiedManifest.SelectSingleNode("/f:Package/f:Resources/f:Resource", $manifestNamespace).Language
    if ($verifiedPublisherDisplayName -ne $publisherDisplayName) {
      throw "PublisherDisplayName verification failed for $($architecture.Name): '$verifiedPublisherDisplayName'."
    }
    if ($verifiedLanguage -ne "zh-CN") {
      throw "Language verification failed for $($architecture.Name): '$verifiedLanguage'."
    }
    foreach ($assetName in @("StoreLogo.png", "Square44x44Logo.png", "Square150x150Logo.png")) {
      $verifiedAssetPath = Join-Path $verifyDirectory ("Assets\" + $assetName)
      if (-not (Test-Path -LiteralPath $verifiedAssetPath)) {
        throw "MSIX asset verification failed for $($architecture.Name): $assetName was not packaged."
      }
    }
  }

  # 文件名按实际架构列表生成：all -> _x64_arm64，单架构 -> _x64 / _arm64
  $architectureSuffix = (($architectureList | ForEach-Object { $_.Name }) -join "_")
  $bundlePath = Join-Path $OutputDirectory ("1999WallpaperArchive_{0}_{1}.msixbundle" -f $packageVersion, $architectureSuffix)
  & $makeAppxPath bundle /d $packageDirectory /p $bundlePath /bv $packageVersion /o
  if ($LASTEXITCODE -ne 0) { throw "MSIXBundle creation failed." }

  Write-Host "Microsoft Store bundle created: $bundlePath"
} finally {
  if (Test-Path -LiteralPath $temporaryRoot) {
    Remove-Item -LiteralPath $temporaryRoot -Recurse -Force
  }
}
