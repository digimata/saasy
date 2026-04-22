process.env.NODE_ENV ??= "test";
process.env.LOG_LEVEL ??= "error";
process.env.DATABASE_URL ??= "postgres://saasy:saasy@localhost:54330/saasy";
process.env.CLERK_SECRET_KEY ??= "sk_test_saasy";
process.env.CLERK_PUBLISHABLE_KEY ??= "pk_test_saasy";
process.env.CLERK_WEBHOOK_SIGNING_SECRET ??= "whsec_test_saasy";
process.env.WEB_ORIGIN ??= "http://localhost:5173";
