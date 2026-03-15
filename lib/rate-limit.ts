const bucket = new Map<string, { count: number; hour: number }>();

export function checkRateLimit(ip: string, limit = 20) {
  const hour = Math.floor(Date.now() / 3600000);
  const key = `${ip}:${hour}`;
  const item = bucket.get(key) || { count: 0, hour };
  item.count += 1;
  bucket.set(key, item);
  return item.count <= limit;
}
