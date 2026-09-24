import { spawn } from "node:child_process";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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

const serverOutput = [];
const serverErrors = [];
const server = spawn(npm, ["start", "--", "-p", "3000"], {
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, NODE_ENV: "production", PORT: "3000" }
});

server.stdout?.on("data", chunk => serverOutput.push(String(chunk)));
server.stderr?.on("data", chunk => serverErrors.push(String(chunk)));

let ready = false;
try {
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
    throw new Error(
      "El servidor de producción no respondió dentro del tiempo esperado.\n" +
      "STDOUT:\n" + serverOutput.join("") +
      "\nSTDERR:\n" + serverErrors.join("")
    );
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
  server.kill("SIGTERM");
  setTimeout(() => server.kill("SIGKILL"), 2000).unref();
}
