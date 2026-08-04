// Simulated network latency for the mock service layer. Random within a small
// range so screens exercise their loading states realistically without being
// annoying to click through in dev.

const DEFAULT_MIN_MS = 80;
const DEFAULT_MAX_MS = 220;

export function simulateLatency(minMs = DEFAULT_MIN_MS, maxMs = DEFAULT_MAX_MS): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, ms));
}
