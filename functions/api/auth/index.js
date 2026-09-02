function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json;charset=UTF-8",
      "cache-control": "no-store"
    }
  });
}

// 恒定时间字符串比较，避免时序侧信道泄露凭据信息
function safeEqual(a, b) {
  const left = String(a || "");
  const right = String(b || "");
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i++) {
    diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return diff === 0;
}

// 登录失败限流：同一客户端连续失败 MAX_FAILURES 次后锁定 LOCK_MS 毫秒。
// 注意：Cloudflare Workers 是多 isolate/多地域模型，模块级 Map 只在同一 isolate 内有效，
// 这是"尽力而为"的防护；生产环境强烈建议同时开启 Cloudflare Rate Limiting 规则，
// 并配合强密码（ADMIN_PASS）使用。
const failedAttempts = new Map();
const MAX_FAILURES = 5;
const LOCK_MS = 10 * 60 * 1000;
const ATTEMPT_TTL_MS = 30 * 60 * 1000; // 未触发锁定的失败记录 30 分钟后过期
const MAX_ENTRIES = 1000; // Map 上限，防止恶意灌入导致内存膨胀
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 每 5 分钟执行一次过期清理
let lastCleanup = 0;

function clientKey(request) {
  // 只信任 Cloudflare 注入的可信 IP 头；X-Forwarded-For 可由客户端伪造，不作为 key。
  // 非 Cloudflare 环境（如本地 dev）没有该头，返回 null 表示跳过限流，
  // 避免所有客户端共用一个 "unknown" 桶互相误锁
  return request.headers.get("CF-Connecting-IP");
}

function cleanupAttempts(now) {
  // 每 5 分钟清理一次过期记录，避免失败记录常驻内存（TTL 真正生效）
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, record] of failedAttempts) {
    if (record.lastFail + ATTEMPT_TTL_MS <= now) failedAttempts.delete(key);
  }
  // 仍超限则清掉最老的一半
  if (failedAttempts.size > MAX_ENTRIES) {
    const keys = [...failedAttempts.keys()];
    keys.sort((a, b) => failedAttempts.get(a).lastFail - failedAttempts.get(b).lastFail);
    keys.slice(0, Math.floor(keys.length / 2)).forEach((key) => failedAttempts.delete(key));
  }
}

export async function onRequestPost({ request, env }) {
  const adminUser = env.ADMIN_USER;
  const adminPass = env.ADMIN_PASS;
  const adminToken = env.ADMIN_TOKEN;

  if (!adminUser || !adminPass || !adminToken) {
    return json({ error: "登录凭据未配置，请联系管理员。" }, 500);
  }

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "请求格式错误。" }, 400);

  const username = String(body.username || "").trim();
  const password = String(body.password || "");

  if (!username || !password) {
    return json({ error: "请输入用户名和密码。" }, 400);
  }

  const key = clientKey(request);
  const now = Date.now();
  cleanupAttempts(now);

  const record = key ? failedAttempts.get(key) : null;
  if (record && record.lockedUntil > now) {
    const remainingMin = Math.ceil((record.lockedUntil - now) / 60000);
    return json({ error: `尝试次数过多，请 ${remainingMin} 分钟后再试。` }, 429);
  }

  if (!safeEqual(username, adminUser) || !safeEqual(password, adminPass)) {
    if (key) {
      const failures = (failedAttempts.get(key)?.count || 0) + 1;
      const lockedUntil = failures >= MAX_FAILURES ? now + LOCK_MS : 0;
      failedAttempts.set(key, { count: failures, lockedUntil, lastFail: now });
    }
    return json({ error: "用户名或密码错误。" }, 401);
  }

  // 登录成功：清除该客户端的失败计数
  if (key) failedAttempts.delete(key);
  return json({ ok: true, token: adminToken });
}
