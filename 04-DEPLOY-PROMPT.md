Prepare this project for production deployment.

Goals:
- free/low-cost deployment
- reviewer can access without local setup
- demo credentials are available
- database persistence works in production
- no secrets committed
- environment variables documented
- production build succeeds

First inspect the current persistence architecture. If SQLite is unsuitable for the selected hosting environment, migrate to a free hosted PostgreSQL database with Prisma while preserving the same application model.

Create:
- .env.example
- deployment instructions in README
- seed/demo account instructions
- production-safe configuration

Then deploy using the simplest reliable path available.

Do not claim deployment success until you verify the live URL and exercise:
1. login
2. create document
3. edit
4. reload
5. rename
6. upload/import
7. share
8. login as shared user
9. open shared document
