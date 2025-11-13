# Comprehensive platform test script
# This script tests service availability, authentication, and key APIs.

$ErrorActionPreference = "Continue"
$global:testResults = @()

function Test-Service {
    param($name, $url, $method = "GET")
    try {
        $response = Invoke-WebRequest -Uri $url -Method $method -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        Write-Host "$name: OK ($($response.StatusCode))" -ForegroundColor Green
        return @{Success=$true; StatusCode=$response.StatusCode; Response=$response}
    } catch {
        Write-Host "$name: FAILED - $($_.Exception.Message)" -ForegroundColor Red
        return @{Success=$false; Error=$_.Exception.Message}
    }
}

function Test-Authentication {
    param($email, $password, $appName)
    try {
        $body = @{ email = $email; password = $password } | ConvertTo-Json
        $response = Invoke-WebRequest -Uri "http://localhost:4000/api/auth/login" `
            -Method POST `
            -Body $body `
            -ContentType "application/json" `
            -SessionVariable session `
            -TimeoutSec 10 `
            -UseBasicParsing `
            -ErrorAction Stop

        $result = $response.Content | ConvertFrom-Json
        if ($result.success) {
            Write-Host "$appName login succeeded" -ForegroundColor Green
            return @{Success=$true; Session=$session; User=$result.user}
        } else {
            Write-Host "$appName login failed: invalid response" -ForegroundColor Red
            return @{Success=$false}
        }
    } catch {
        Write-Host "$appName login failed: $($_.Exception.Message)" -ForegroundColor Red
        return @{Success=$false; Error=$_.Exception.Message}
    }
}

Write-Host "Comprehensive platform test" -ForegroundColor Yellow

# Step 1: Service health checks
Write-Host "Step 1: Service health checks" -ForegroundColor Yellow
$backendHealth = Test-Service "Backend API" "http://localhost:4000/health"
$adminHealth = Test-Service "Admin Portal" "http://localhost:3000" -ErrorAction SilentlyContinue
$doctorHealth = Test-Service "Doctor Portal" "http://localhost:3001" -ErrorAction SilentlyContinue
$patientHealth = Test-Service "Patient App" "http://localhost:3002" -ErrorAction SilentlyContinue
$nurseHealth = Test-Service "Nurse App" "http://localhost:3003" -ErrorAction SilentlyContinue

# Step 2: Authentication tests
Write-Host "Step 2: Authentication tests" -ForegroundColor Yellow
$adminAuth = Test-Authentication "admin@example.com" "Test1234!@#$" "Admin"
Start-Sleep -Seconds 1
$doctorAuth = Test-Authentication "doctor@example.com" "Test1234!@#$" "Doctor"
Start-Sleep -Seconds 1
$nurseAuth = Test-Authentication "nurse@example.com" "Test1234!@#$" "Nurse"
Start-Sleep -Seconds 1
$patientAuth = Test-Authentication "patient@example.com" "Test1234!@#$" "Patient"

# Step 3: API endpoint tests (requires admin login)
Write-Host "Step 3: API endpoint tests" -ForegroundColor Yellow
if ($adminAuth.Success) {
    try {
        $visitsResponse = Invoke-WebRequest -Uri "http://localhost:4000/api/visits" `
            -Method GET `
            -WebSession $adminAuth.Session `
            -TimeoutSec 10 `
            -UseBasicParsing `
            -ErrorAction Stop
        $visits = ($visitsResponse.Content | ConvertFrom-Json).visits
        Write-Host "Visits API returned $($visits.Count) records" -ForegroundColor Green

        $wsTokenResponse = Invoke-WebRequest -Uri "http://localhost:4000/api/auth/ws-token" `
            -Method GET `
            -WebSession $adminAuth.Session `
            -TimeoutSec 10 `
            -UseBasicParsing `
            -ErrorAction Stop
        $wsToken = ($wsTokenResponse.Content | ConvertFrom-Json).token
        if ($wsToken) {
            Write-Host "WebSocket token retrieved" -ForegroundColor Green
        } else {
            Write-Host "WebSocket token request returned no token" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "API tests failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "Skipping API tests because admin authentication failed" -ForegroundColor Yellow
}

# Step 4: Summary
Write-Host "Test summary" -ForegroundColor Yellow
$tests = @(
    @{Name="Backend API"; Result=$backendHealth.Success},
    @{Name="Admin Portal"; Result=$adminHealth.Success},
    @{Name="Doctor Portal"; Result=$doctorHealth.Success},
    @{Name="Patient App"; Result=$patientHealth.Success},
    @{Name="Nurse App"; Result=$nurseHealth.Success},
    @{Name="Admin Auth"; Result=$adminAuth.Success},
    @{Name="Doctor Auth"; Result=$doctorAuth.Success},
    @{Name="Nurse Auth"; Result=$nurseAuth.Success},
    @{Name="Patient Auth"; Result=$patientAuth.Success}
)
$passed = ($tests | Where-Object {$_.Result -eq $true}).Count
$total = $tests.Count
$percentage = [math]::Round(($passed / $total) * 100, 1)
Write-Host "Tests passed: $passed / $total ($percentage%)" -ForegroundColor $(if ($percentage -ge 80) { "Green" } elseif ($percentage -ge 50) { "Yellow" } else { "Red" })
if ($percentage -ge 80) {
    Write-Host "Platform status: operational" -ForegroundColor Green
} elseif ($percentage -ge 50) {
    Write-Host "Platform status: partially operational" -ForegroundColor Yellow
} else {
    Write-Host "Platform status: issues detected" -ForegroundColor Red
}

# Step 5: Next steps
Write-Host "Next steps" -ForegroundColor Yellow
Write-Host "1. Test real-time messaging:" -ForegroundColor White
Write-Host "   - Open patient at http://localhost:3002" -ForegroundColor Gray
Write-Host "   - Open nurse at http://localhost:3003" -ForegroundColor Gray
Write-Host "   - Load the same visit and exchange messages" -ForegroundColor Gray
Write-Host "2. Test GPS maps:" -ForegroundColor White
Write-Host "   - Install Leaflet with npm install leaflet @types/leaflet" -ForegroundColor Gray
Write-Host "   - Confirm the patient visit detail map renders" -ForegroundColor Gray
Write-Host "   - Update nurse status to EN_ROUTE and verify location tracking" -ForegroundColor Gray
Write-Host "3. Test real-time status updates:" -ForegroundColor White
Write-Host "   - Update visit status as a nurse" -ForegroundColor Gray
Write-Host "   - Confirm patient sees an immediate toast notification" -ForegroundColor Gray

