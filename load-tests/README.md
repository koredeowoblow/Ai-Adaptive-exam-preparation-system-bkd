# Load Tests

This directory contains Artillery load tests for the AI Adaptive Exam Preparation System backend.

> [!WARNING]
> Do NOT run these load tests against a production environment. The tests are designed to apply significant stress to the database, Redis cache, and application server. Running them in production will degrade performance for real users and pollute the database with mock data.

## Setup

Before running the tests, ensure the local database is populated with the correct test data:

```bash
npm run seed:load
```
*(You may need to add `seed:load: ts-node load-tests/seed.ts` to package.json, or run it directly `ts-node load-tests/seed.ts`)*

## Scenarios

- `test:load:auth`: Tests signup and login endpoints.
- `test:load:practice`: Tests the adaptive practice session flow and batch exam submission.
- `test:load:read`: Hammers the read-only paginated list endpoints.
- `test:load:mixed`: Simulates a realistic traffic distribution across all features.
- `test:load:grading-burst`: Tests the capacity of the async grading worker queue under heavy submission load.
