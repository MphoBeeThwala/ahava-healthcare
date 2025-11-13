Go-live checklist for Ahava Healthcare platform

Date: November 6, 2025
Current status: pre-production
Test coverage: 345 of 347 tests passing (ninety nine point four percent).

Test status summary: total tests three hundred forty seven, passing three hundred forty five (ninety nine point four percent), failing two (zero point six percent), eight categories of suites. Breakdown by category shows middleware, API mock tests, API integration, and workers at one hundred percent. Integration flows stand at three out of five (sixty percent) and require fixes. Services and webhooks suites exist but are not being detected. Around one hundred twelve service and webhook tests are missing from the report because the test patterns in run-full-platform-test.ts do not match the file paths. Update the configuration to use patterns such as `services.*test` and `webhooks.*test` so Jest captures these files. Existing tests include payment, Paystack, queue, Redis, WebSocket, AI diagnosis, and the webhooks suite.

Pre-production checklist:
1. Fix the remaining two integration flow failures (high priority). Tasks include correcting database cleanup order, ensuring test users persist, and resolving foreign key violations. Recommended command: `yarn test integration --verbose` to isolate issues, then repair flows.test.ts.
2. Repair test detection (medium priority). Update run-full-platform-test.ts with the new patterns, verify all service and webhook tests run, and update the report to reflect accurate counts.
3. Configure environment variables (high priority). Required values are DATABASE_URL, JWT_SECRET, PAYSTACK_SECRET_KEY, PAYSTACK_PUBLIC_KEY, PAYSTACK_WEBHOOK_SECRET, REDIS_URL (recommended), SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, OPENAI_API_KEY (optional), and NODE_ENV=production. Suggested flow: duplicate env.example to .env.production and populate secrets using a secure manager.
4. Database setup (high priority). Provision the production database, run `yarn prisma migrate deploy`, seed the initial admin, configure backups, connection pooling, and monitoring. Use commands with DATABASE_URL pointing to the production instance.
5. Security hardening (high priority). Enable HTTPS and certificates, restrict CORS to production domains, confirm rate limiting and CSRF protection, review Helmet headers, set up security monitoring (Sentry, LogRocket), define firewall rules, and establish DDoS mitigation through Cloudflare or similar providers. Verify middleware in src/index.ts includes helmet, cors, rateLimiter, and csrfProtection.
6. Infrastructure and deployment (high priority). For the backend, deploy to Railway, Render, Fly.io, or AWS, configure port 4000, use a process manager, ensure auto-restart, monitor the health endpoint, and route logs to a centralized system. For frontends, deploy the admin portal (port 3000), doctor portal (3001), patient app (3002), nurse app (3003). Point them at production API URLs, set up CDN delivery, and perform optimized builds. Deploy workers for email, PDF, and push notifications, configure scaling, and monitor their health. Use `yarn build`, install a reverse proxy such as Nginx or Caddy, and configure PM2 or systemd.
7. External service integrations (high priority). Switch Paystack from test to live mode, register the webhook endpoint at `https://yourdomain.com/api/webhooks/paystack`, test payments end-to-end, verify signatures, and establish monitoring. Configure production SMTP with templates and monitoring. Set up production Redis with persistence, monitoring, and backups. For AI diagnosis, configure the OpenAI key, limit usage, test the end-to-end flow, and keep the rule-based fallback available.
8. Monitoring and logging (high priority). Implement application monitoring (New Relic, Datadog), error tracking (Sentry), uptime monitoring (Pingdom or UptimeRobot), log aggregation, alerting for critical errors, performance metrics, and database query monitoring. Confirm the logger is imported and used globally.
9. Performance optimization (medium priority). Optimize database queries, enable Redis caching for hot data, deliver static assets via CDN, ensure compression remains on, optimize images and assets, configure connection pooling, and add load balancing if necessary.
10. Documentation (medium priority). Finalize API documentation, prepare user guides per role, document deployment processes, create runbooks for common issues, outline backup and recovery steps, and draft incident response plans.
11. Compliance and legal (high priority). Review HIPAA implications if applicable, update privacy policies, set data retention expectations, ensure encryption at rest and in transit, review terms of service, and provide user consent workflows.
12. Testing (high priority). Run the full platform test suite with `yarn test:full-platform`, perform manual validation of every user flow, test payment processing, messaging, and file uploads, conduct load testing for one hundred plus concurrent users, evaluate failover scenarios, and perform security penetration testing. Execute tests with coverage using `yarn test --coverage`, targeting at least eighty percent.
13. Backup and recovery (high priority). Establish automated database backups, practice restores, back up file storage, document recovery steps, monitor backup jobs, and set retention policies.
14. Go-live plan (high priority). One week before launch: complete the checklist, finish testing, train support, and define a rollback plan. On launch day: deploy to production, monitor logs and performance, validate critical paths, ensure the support team is ready. During the first week post-launch: monitor error and performance metrics, collect user feedback, address urgent issues, and optimize based on usage.

Success criteria for go-live:
Must have items include resolving the remaining failures, enabling all security controls, configuring production databases, payment gateway, email service, monitoring, and backups. Should have items involve fixing test detection, finishing load testing, completing documentation, and training support. Nice-to-have items cover fully configuring AI diagnosis, advanced monitoring, and performance tuning.

Immediate action items. This week: fix the two failing integration tests (approximately two hours), repair test pattern detection (one hour), set production environment variables (one hour), deploy to staging (two hours), and perform staging testing (four hours). Next week: complete the security review (four hours), set up monitoring and alerts (four hours), configure the production database (two hours), deploy to production (two hours), and continue monitoring and optimization.

Risk mitigation. The highest risk areas are payment processing (test Paystack thoroughly), database resilience (validate backups), security (complete audit before launch), and performance (load test). Maintain a rollback plan: keep staging in sync with production, ensure migrations are reversible, prepare rollback scripts, and document procedures.

Support contacts: technical lead, DevOps, security, Paystack support at support@paystack.com, and the database provider’s support channel.

Sign-off checklist: technical lead approval, security team approval, product owner approval, operations team approval remain pending.

Last updated November 6, 2025. Next review scheduled before production launch.

Document prepared by Mpho Thwala on behalf of Ahava on 88 Company.

