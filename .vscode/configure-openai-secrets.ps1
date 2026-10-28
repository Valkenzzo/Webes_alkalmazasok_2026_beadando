$ErrorActionPreference = 'Stop'
$project = Join-Path $PSScriptRoot '..\week1\ExpenseTracker\backend\ExpenseTracker.Api'
$project = (Resolve-Path $project).Path
$secureKey = Read-Host 'OpenAI API-kulcs (a beírás nem látszik)' -AsSecureString

if ($secureKey.Length -lt 20) {
    throw 'A kulcs üres vagy túl rövid.'
}

$pointer = [IntPtr]::Zero
try {
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
    $plainKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)

    dotnet user-secrets set 'OpenAI:ApiKey' $plainKey --project $project
    if ($LASTEXITCODE -ne 0) {
        throw 'Az API-kulcs mentése nem sikerült.'
    }

    dotnet user-secrets set 'OpenAI:Model' 'gpt-4o-mini' --project $project
    if ($LASTEXITCODE -ne 0) {
        throw 'A modellbeállítás mentése nem sikerült.'
    }

    Write-Output 'Az OpenAI-kulcs és a modell be van állítva. A kulcs értéke nem jelenik meg.'
}
finally {
    if ($pointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    }

    Remove-Variable secureKey, plainKey -ErrorAction SilentlyContinue
}
