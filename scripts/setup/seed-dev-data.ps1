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
    $existingTransactions = Invoke-Api -Method "GET" -Url "$ApiBaseUrl/transactions/me" -Token $token
    foreach ($transaction in $existingTransactions) {
        if ($transaction.category -eq "SeedData") {
            Invoke-Api -Method "DELETE" -Url "$ApiBaseUrl/transactions/$($transaction.id)" -Token $token | Out-Null
        }
    }
}

$johnTransactions = @(
    @{
        payerPersonId = $personByName["John Doe"]
        payeePersonId = $personByName["Jane Smith"]
        amount = 18.50
        currencyCode = "EUR"
        transactionDateUtc = (Get-Date).AddDays(-2).ToUniversalTime().ToString("o")
        description = "Lunch split"
        category = "SeedData"
        status = "Completed"
    },
    @{
        payerPersonId = $personByName["John Doe"]
        payeePersonId = $personByName["Alice Walker"]
        amount = 42.00
        currencyCode = "EUR"
        transactionDateUtc = (Get-Date).AddDays(-1).ToUniversalTime().ToString("o")
        description = "Concert tickets"
        category = "SeedData"
        status = "Pending"
    }
)

foreach ($transaction in $johnTransactions) {
    Invoke-Api -Method "POST" -Url "$ApiBaseUrl/transactions" -Token $johnToken -Body $transaction | Out-Null
}

$janeTransaction = @{
    payerPersonId = $personByName["Jane Smith"]
    payeePersonId = $personByName["Bob Taylor"]
    amount = 12.75
    currencyCode = "EUR"
    transactionDateUtc = (Get-Date).AddHours(-8).ToUniversalTime().ToString("o")
    description = "Taxi share"
    category = "SeedData"
    status = "Completed"
}
Invoke-Api -Method "POST" -Url "$ApiBaseUrl/transactions" -Token $janeToken -Body $janeTransaction | Out-Null

$johnCount = (Invoke-Api -Method "GET" -Url "$ApiBaseUrl/transactions/me" -Token $johnToken).Count
$janeCount = (Invoke-Api -Method "GET" -Url "$ApiBaseUrl/transactions/me" -Token $janeToken).Count

Write-Host "[seed] Persons available: $($persons.Count)"
Write-Host "[seed] John involved transactions: $johnCount"
Write-Host "[seed] Jane involved transactions: $janeCount"
Write-Host "[seed] Done" -ForegroundColor Green
