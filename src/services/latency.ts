/**
 * Utility helper to simulate network latency for mock API service contracts.
 * Default random delay between min and max milliseconds.
 */
export async function simulateLatency(min = 300, max = 800): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}
