import { spawn } from "node:child_process";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const nextBin = new URL("./node_modules/next/dist/bin/next", import.meta.url).pathname;

const request = async (path) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    return await fetch(baseUrl + path, { redirect: "manual", signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const checks = [
  { path: "/", expected: [200] },
  { path: "/login", expected: [200] },
  { path: "/legal/terminos", expected: [200] },
  { path: "/legal/cookies", expected: [200] },
  { path: "/legal/privacidad", expected: [200] },
  { path: "/dashboard", expected: [200, 301, 302, 307, 308] }
];

const server = spawn(process.execPath, [nextBin, "start", "-p", "3000"], {
  detached: true,
  stdio: "ignore",
  env: { ...process.env, NODE_ENV: "production", PORT: "3000" }
});

server.unref();

const stopServer = () => {
  if (!server.pid) return;
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {}
};

try {
  let ready = false;

  for (let attempt = 1; attempt <= 30; attempt++) {
    try {
      const response = await request("/");
      if (response.status >= 200 && response.status < 500) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (!ready) {
    throw new Error("El servidor de producción no respondió dentro de 30 segundos.");
  }

  for (const check of checks) {
    const response = await request(check.path);
    if (!check.expected.includes(response.status)) {
      throw new Error(`Smoke FAIL ${check.path}: HTTP ${response.status}; esperado ${check.expected.join(", ")}`);
    }
    console.log(`PASS ${check.path}: HTTP ${response.status}`);
  }

  console.log("SMOKE TEST: PASS");
} finally {
  stopServer();
}
