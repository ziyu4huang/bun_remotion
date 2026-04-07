$json = [Console]::In.ReadToEnd() | ConvertFrom-Json

$parts = @()

$model = $json.model.display_name
if ($model) { $parts += $model }

$currentDir = $json.workspace.current_dir
if ($currentDir) {
    $folderName = Split-Path -Leaf $currentDir
    $parts += $folderName
}

$usedPct = $json.context_window.used_percentage
if ($null -ne $usedPct) {
    $parts += "Ctx: $([math]::Round($usedPct, 1))%"
}

$totalIn  = $json.context_window.total_input_tokens
$totalOut = $json.context_window.total_output_tokens
if ($null -ne $totalIn -and $null -ne $totalOut) {
    $totalTokens = $totalIn + $totalOut
    $parts += "Tokens: $totalTokens"
}

$parts -join " | "
