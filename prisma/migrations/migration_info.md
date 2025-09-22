# Migration Required

To add referral tracking to the waitlist, run:

```bash
pnpm prisma migrate dev --name add-referral-tracking
```

This will add the following fields to the Waitlist model:
- referralCode: String @unique
- referredBy: String? (referralCode of the referrer)
- referralCount: Int @default(0)