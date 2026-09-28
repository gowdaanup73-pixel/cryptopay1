$basePath = "c:\Users\POORNA CHANDRA D N\Downloads\cryptopay-main\cryptopay-main"

$replacements = @{
    "blue-50" = "green-50"
    "blue-100" = "green-100"
    "blue-200" = "green-200"
    "blue-300" = "green-300"
    "blue-400" = "green-400"
    "blue-500" = "green-500"
    "blue-600" = "green-600"
    "blue-700" = "green-700"
    "blue-800" = "green-800"
    "blue-900" = "green-900"
    "purple-50" = "lime-50"
    "purple-100" = "lime-100"
    "purple-200" = "lime-200"
    "purple-300" = "lime-300"
    "purple-400" = "lime-400"
    "purple-500" = "lime-500"
    "purple-600" = "lime-600"
    "purple-700" = "lime-700"
    "purple-800" = "lime-800"
    "purple-900" = "lime-900"
    "pink-50" = "emerald-50"
    "pink-100" = "emerald-100"
    "pink-200" = "emerald-200"
    "pink-300" = "emerald-300"
    "pink-400" = "emerald-400"
    "pink-500" = "emerald-500"
    "pink-600" = "emerald-600"
    "pink-700" = "emerald-700"
    "pink-800" = "emerald-800"
    "pink-900" = "emerald-900"
    "indigo-50" = "green-50"
    "indigo-100" = "green-100"
    "indigo-200" = "green-200"
    "indigo-300" = "green-300"
    "indigo-400" = "green-400"
    "indigo-500" = "green-500"
    "indigo-600" = "green-600"
    "indigo-700" = "green-700"
    "indigo-800" = "green-800"
    "indigo-900" = "green-900"
    "violet-50" = "lime-50"
    "violet-100" = "lime-100"
    "violet-200" = "lime-200"
    "violet-300" = "lime-300"
    "violet-400" = "lime-400"
    "violet-500" = "lime-500"
    "violet-600" = "lime-600"
    "violet-700" = "lime-700"
    "violet-800" = "lime-800"
    "violet-900" = "lime-900"
    "cyan-50" = "teal-50"
    "cyan-100" = "teal-100"
    "cyan-200" = "teal-200"
    "cyan-300" = "teal-300"
    "cyan-400" = "teal-400"
    "cyan-500" = "teal-500"
    "cyan-600" = "teal-600"
    "cyan-700" = "teal-700"
    "cyan-800" = "teal-800"
    "cyan-900" = "teal-900"
}

$files = @(
    "styles\globals.css",
    "pages\index.js",
    "pages\dashboard.js",
    "pages\admin.js",
    "pages\analytics.js",
    "pages\kyc.js",
    "pages\payments.js",
    "pages\payouts.js",
    "pages\products.js",
    "pages\settings.js",
    "pages\transactions.js",
    "pages\users.js",
    "pages\demo.js",
    "pages\pay\[productId].js",
    "components\Layout.jsx",
    "components\Sidebar.jsx",
    "components\StatsCard.jsx",
    "components\Transactions\TransactionDetailsModal.jsx",
    "components\Admin\UsersTab.jsx",
    "components\Admin\SettingsTab.jsx",
    "components\Admin\SecurityTab.jsx",
    "components\Admin\OverviewTab.jsx",
    "components\Admin\KYCTab.jsx",
    "components\Admin\ActivityTab.jsx"
)

foreach ($file in $files) {
    $fullPath = Join-Path $basePath $file
    if (Test-Path $fullPath) {
        $content = [System.IO.File]::ReadAllText($fullPath)
        foreach ($key in $replacements.Keys) {
            $content = $content.Replace($key, $replacements[$key])
        }
        [System.IO.File]::WriteAllText($fullPath, $content)
        Write-Host "Updated: $file"
    } else {
        Write-Host "NOT FOUND: $file"
    }
}

Write-Host "Done! All colors replaced."
