import { pRateLimit } from "p-ratelimit"; // TypeScript

// create a rate limiter that allows up to 30 API calls per second,
// with max concurrency of 10
export const limit = pRateLimit({
  interval: 30000, // 1000 ms == 1 second
  rate: 280, // 30 API calls per interval
  concurrency: 48, // no more than 10 running at once
  maxDelay: 0, // an API call delayed > 30 sec is rejected
});

// New rate limiter for plc.directory
// These are example values; adjust based on observation or if plc.directory publishes limits.
// E.g., 5 requests per second, with a concurrency of 3.
export const plcDirectoryLimiter = pRateLimit({
  interval: 1000, // 1 second
  rate: 5, // 5 calls per second
  concurrency: 3, // Max 3 concurrent calls to plc.directory
  maxDelay: 2000, // Optional: Reject if a call is delayed by more than 2 seconds
});
