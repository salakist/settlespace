param(
    [string]$ApiBaseUrl = "http://localhost:5279/api"
)

$ErrorActionPreference = "Stop"

function Invoke-Api {
    param(
        [string]$Method,
        [string]$Url,
        [object]$Body = $null,
        [string]$Token = ""
    )

    $headers = @{}
    if (-not [string]::IsNullOrWhiteSpace($Token)) {
        $headers["Authorization"] = "Bearer $Token"
    }

    if ($null -ne $Body) {
        $jsonBody = $Body | ConvertTo-Json -Depth 10
        return Invoke-RestMethod -Method $Method -Uri $Url -Headers $headers -Body $jsonBody -ContentType "application/json"
    }

    return Invoke-RestMethod -Method $Method -Uri $Url -Headers $headers
}

function Ensure-UserSession {
    param(
        [string]$FirstName,
        [string]$LastName,
        [string]$Password
    )

    $username = "$($FirstName.ToLowerInvariant()).$($LastName.ToLowerInvariant())"

    try {
        return Invoke-Api -Method "POST" -Url "$ApiBaseUrl/auth/login" -Body @{ username = $username; password = $Password }
    }
    catch {
        $null = Invoke-Api -Method "POST" -Url "$ApiBaseUrl/auth/register" -Body @{
            firstName = $FirstName
            lastName = $LastName
            password = $Password
            email = "$username@example.com"
            addresses = @()
        }

        return Invoke-Api -Method "POST" -Url "$ApiBaseUrl/auth/login" -Body @{ username = $username; password = $Password }
    }
}

function Ensure-Person {
    param(
        [string]$Token,
        [object[]]$AllPersons,
        [hashtable]$PersonData
    )

    $existing = $AllPersons | Where-Object {
        $_.firstName -eq $PersonData.firstName -and $_.lastName -eq $PersonData.lastName
    } | Select-Object -First 1

    if ($null -ne $existing) {
        return $existing
    }

    $null = Invoke-Api -Method "POST" -Url "$ApiBaseUrl/persons" -Token $Token -Body $PersonData
    $updated = Invoke-Api -Method "GET" -Url "$ApiBaseUrl/persons" -Token $Token

    return $updated | Where-Object {
        $_.firstName -eq $PersonData.firstName -and $_.lastName -eq $PersonData.lastName
    } | Select-Object -First 1
}

function New-SeedTransaction {
    param(
        [string]$PayerPersonId,
        [string]$PayeePersonId,
        [decimal]$Amount,
        [datetime]$TransactionDateUtc,
        [string]$Description,
        [string]$Category = "SeedData",
        [string]$CurrencyCode = "EUR",
        [string]$Status = "Completed"
    )

    return @{
        payerPersonId = $PayerPersonId
        payeePersonId = $PayeePersonId
        amount = [math]::Round([double]$Amount, 2)
        currencyCode = $CurrencyCode
        transactionDateUtc = $TransactionDateUtc.ToUniversalTime().ToString("o")
        description = "$Description [SeedData]"
        category = $Category
        status = $Status
    }
}

function Add-SeedTransactions {
    param(
        [string]$Token,
        [object[]]$Transactions
    )

    foreach ($transaction in $Transactions) {
        Invoke-Api -Method "POST" -Url "$ApiBaseUrl/transactions" -Token $Token -Body $transaction | Out-Null
    }
}

Write-Host "[seed] Starting data seeding against $ApiBaseUrl" -ForegroundColor Cyan

$johnSession = Ensure-UserSession -FirstName "John" -LastName "Doe" -Password "Seed@Pass1"
$janeSession = Ensure-UserSession -FirstName "Jane" -LastName "Smith" -Password "Seed@Pass2"

$johnToken = $johnSession.token
$janeToken = $janeSession.token

$persons = Invoke-Api -Method "GET" -Url "$ApiBaseUrl/persons" -Token $johnToken

$seedPersons = @(
    @{ firstName = "Alice"; lastName = "Walker"; password = "Seed@Pass3"; role = "USER"; email = "alice.walker@example.com"; addresses = @() },
    @{ firstName = "Bob"; lastName = "Taylor"; password = "Seed@Pass4"; role = "USER"; email = "bob.taylor@example.com"; addresses = @() }
)

foreach ($seedPerson in $seedPersons) {
    $createdPerson = Ensure-Person -Token $johnToken -AllPersons $persons -PersonData $seedPerson
    if ($null -eq $createdPerson) {
        throw "Failed to ensure person $($seedPerson.firstName) $($seedPerson.lastName)."
    }

    $persons = Invoke-Api -Method "GET" -Url "$ApiBaseUrl/persons" -Token $johnToken
}

$personByName = @{}
foreach ($person in $persons) {
    $personByName["$($person.firstName) $($person.lastName)"] = $person.id
}

foreach ($token in @($johnToken, $janeToken)) {
    $existingTransactions = Invoke-Api -Method "POST" -Url "$ApiBaseUrl/transactions/search" -Token $token -Body @{}
    foreach ($transaction in $existingTransactions) {
        if ($transaction.category -eq "SeedData" -or (($transaction.description -as [string]) -and $transaction.description.Contains("[SeedData]"))) {
            Invoke-Api -Method "DELETE" -Url "$ApiBaseUrl/transactions/$($transaction.id)" -Token $token | Out-Null
        }
    }
}

$johnTransactions = @(
    New-SeedTransaction -PayerPersonId $personByName["John Doe"] -PayeePersonId $personByName["Jane Smith"] -Amount 18.50 -CurrencyCode "EUR" -TransactionDateUtc (Get-Date).AddDays(-2) -Description "Lunch split" -Category "Food"
    New-SeedTransaction -PayerPersonId $personByName["John Doe"] -PayeePersonId $personByName["Alice Walker"] -Amount 42.00 -CurrencyCode "EUR" -TransactionDateUtc (Get-Date).AddDays(-1) -Description "Concert tickets" -Category "Events" -Status "Pending"
)
Add-SeedTransactions -Token $johnToken -Transactions $johnTransactions

$janeAliceDescriptions = @(
    "Brunch at Riverside Café",
    "Groceries for the apartment",
    "Train tickets for the weekend",
    "Cinema and snacks",
    "Shared utilities catch-up",
    "Household supplies run",
    "Museum visit",
    "Dinner by the canal",
    "Pharmacy pickup",
    "Coffee and pastries",
    "Concert tickets",
    "Sunday market haul"
)
$janeAliceCategories = @("Food", "Travel", "Leisure", "Household", "Utilities", "Events")
$janeAliceBaseDeltas = @(
    68.50, 54.25, 73.10, 61.40, 58.60, -132.40, -96.25, -74.80, 82.45,
    69.10, 57.35, 76.20, -148.90, -102.30, -84.70, 91.50, 64.80, 72.40,
    88.15, -126.60, -97.40, -79.90, 95.25, 71.60, 66.35, -154.20, -110.50,
    83.75, 59.40, 74.90, 68.30, -118.45, -86.10, 97.20, 62.85, 79.55,
    -141.35, -104.60, 85.40, 73.25, -129.75, 93.10, 67.45, -112.80, 81.65,
    58.20, -96.55, 77.90, -88.40, 69.30, 52.10, -74.25, 63.85
)
$balanceBeforeSettlement = [decimal]0
foreach ($delta in $janeAliceBaseDeltas) {
    $balanceBeforeSettlement += [decimal]$delta
}
$janeAliceDeltas = @($janeAliceBaseDeltas)
if ($balanceBeforeSettlement -ne [decimal]0) {
    $janeAliceDeltas += -$balanceBeforeSettlement
}
$historyStart = (Get-Date).Date.AddDays(-130)

$janeAliceTransactions = foreach ($index in 0..($janeAliceDeltas.Count - 1)) {
    $delta = [decimal]$janeAliceDeltas[$index]
    $transactionDateUtc = $historyStart.AddDays([double]($index * 2.45)).AddHours(10 + ($index % 8))
    $description = $janeAliceDescriptions[$index % $janeAliceDescriptions.Count]
    $category = $janeAliceCategories[$index % $janeAliceCategories.Count]

    if ($delta -ge 0) {
        New-SeedTransaction -PayerPersonId $personByName["Jane Smith"] -PayeePersonId $personByName["Alice Walker"] -Amount $delta -CurrencyCode "EUR" -TransactionDateUtc $transactionDateUtc -Description $description -Category $category
    }
    else {
        New-SeedTransaction -PayerPersonId $personByName["Alice Walker"] -PayeePersonId $personByName["Jane Smith"] -Amount ([decimal][math]::Abs([double]$delta)) -CurrencyCode "EUR" -TransactionDateUtc $transactionDateUtc -Description $description -Category $category
    }
}

$janeTransactions = @(
    New-SeedTransaction -PayerPersonId $personByName["Jane Smith"] -PayeePersonId $personByName["Bob Taylor"] -Amount 12.75 -CurrencyCode "EUR" -TransactionDateUtc (Get-Date).AddHours(-8) -Description "Taxi share" -Category "Travel"
) + $janeAliceTransactions
Add-SeedTransactions -Token $janeToken -Transactions $janeTransactions

$johnTransactionsAll = Invoke-Api -Method "POST" -Url "$ApiBaseUrl/transactions/search" -Token $johnToken -Body @{}
$janeTransactionsAll = Invoke-Api -Method "POST" -Url "$ApiBaseUrl/transactions/search" -Token $janeToken -Body @{}
$johnCount = $johnTransactionsAll.Count
$janeCount = $janeTransactionsAll.Count
$janeAlicePairTransactions = @($janeTransactionsAll | Where-Object {
    (($_.payerPersonId -eq $personByName["Jane Smith"]) -and ($_.payeePersonId -eq $personByName["Alice Walker"])) -or
    (($_.payerPersonId -eq $personByName["Alice Walker"]) -and ($_.payeePersonId -eq $personByName["Jane Smith"]))
})
$sortedJaneAlicePairTransactions = @($janeAlicePairTransactions | Sort-Object transactionDateUtc)
$firstJaneAliceDate = if ($sortedJaneAlicePairTransactions.Count -gt 0) { [datetime]$sortedJaneAlicePairTransactions[0].transactionDateUtc } else { $null }
$lastJaneAliceDate = if ($sortedJaneAlicePairTransactions.Count -gt 0) { [datetime]$sortedJaneAlicePairTransactions[$sortedJaneAlicePairTransactions.Count - 1].transactionDateUtc } else { $null }
$janeAliceNet = [decimal]0
$janeAliceMinBalance = [decimal]0
$janeAliceMaxBalance = [decimal]0
foreach ($transaction in $sortedJaneAlicePairTransactions) {
    if ($transaction.payerPersonId -eq $personByName["Jane Smith"]) {
        $janeAliceNet += [decimal]$transaction.amount
    }
    else {
        $janeAliceNet -= [decimal]$transaction.amount
    }

    if ($janeAliceNet -lt $janeAliceMinBalance) {
        $janeAliceMinBalance = $janeAliceNet
    }

    if ($janeAliceNet -gt $janeAliceMaxBalance) {
        $janeAliceMaxBalance = $janeAliceNet
    }
}

Write-Host "[seed] Persons available: $($persons.Count)"
Write-Host "[seed] John involved transactions: $johnCount"
Write-Host "[seed] Jane involved transactions: $janeCount"
Write-Host "[seed] Jane/Alice history transactions: $($janeAlicePairTransactions.Count)"
if ($null -ne $firstJaneAliceDate -and $null -ne $lastJaneAliceDate) {
    Write-Host "[seed] Jane/Alice history window: $($firstJaneAliceDate.ToString('yyyy-MM-dd')) to $($lastJaneAliceDate.ToString('yyyy-MM-dd'))"
}
Write-Host "[seed] Jane/Alice running balance range: EUR $([math]::Round([double]$janeAliceMinBalance, 2)) to EUR $([math]::Round([double]$janeAliceMaxBalance, 2))"
Write-Host "[seed] Jane/Alice ending balance from Jane's perspective: EUR $([math]::Round([double]$janeAliceNet, 2))"
Write-Host "[seed] Use jane.smith / Seed@Pass2 to inspect the debt history with Alice Walker."
Write-Host "[seed] Done" -ForegroundColor Green
