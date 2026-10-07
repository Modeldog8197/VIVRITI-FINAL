import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.js",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4173",
    launchOptions: process.env.LOCAL_BROWSER
      ? {
          executablePath: process.env.LOCAL_BROWSER,
          args: [
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--use-gl=angle",
            "--use-angle=swiftshader",
            "--single-process",
            "--no-zygote",
          ],
        }
      : {},
  },
  webServer: {
    command: "python3 -m http.server 4173 --bind 127.0.0.1",
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
});
