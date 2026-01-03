param(
    [string]$source = "dist",
    [string]$destination = "extension.zip"
)

if (Test-Path $destination) {
    Remove-Item $destination
}

Compress-Archive -Path $source\* -DestinationPath $destination -Force
Write-Host "Created $destination from $source"