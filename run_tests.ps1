Write-Host "Running auth-flow.yml..."
npx artillery run load-tests/auth-flow.yml | Out-File load-tests/results-auth.txt -Encoding UTF8

Write-Host "Running read-heavy.yml..."
npx artillery run load-tests/read-heavy.yml | Out-File load-tests/results-read.txt -Encoding UTF8

Write-Host "Running practice-session.yml..."
npx artillery run load-tests/practice-session.yml | Out-File load-tests/results-practice.txt -Encoding UTF8

Write-Host "Running mixed-realistic.yml..."
npx artillery run load-tests/mixed-realistic.yml | Out-File load-tests/results-mixed.txt -Encoding UTF8

