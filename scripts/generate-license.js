#!/usr/bin/env node
/* eslint-disable no-console */
const { createHmac } = require("node:crypto");
const { createInterface } = require("node:readline/promises");
const { stdin, stdout, exit } = require("node:process");

const LICENSE_SECRET = process.env.LICENSE_SECRET ?? "devicecontrol-license-secret";

const base64UrlEncode = (value) => Buffer.from(value).toString("base64url");

const generateLicenseKey = (fingerprint, durationDays) => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  const payload = {
    fingerprint,
    issuedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  const data = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac("sha256", LICENSE_SECRET)
    .update(data)
    .digest("base64url");

  return `${data}.${signature}`;
};

const main = async () => {
  const rl = createInterface({ input: stdin, output: stdout });

  try {
    const fingerprint = (await rl.question("System fingerprint: ")).trim();

    if (!fingerprint) {
      console.error("Fingerprint is required");
      exit(1);
    }

    const defaultDuration = 365;
    const durationAnswer = (await rl.question(`License duration in days (default ${defaultDuration}): `)).trim();
    const durationDays = durationAnswer ? Number.parseInt(durationAnswer, 10) : defaultDuration;

    if (!Number.isFinite(durationDays) || durationDays <= 0) {
      console.error("Duration must be a positive integer");
      exit(1);
    }

    const licenseKey = generateLicenseKey(fingerprint, durationDays);

    console.log("\nLicense generated successfully!\n");
    console.log(`Fingerprint: ${fingerprint}`);
    console.log(`Valid for: ${durationDays} day(s)`);
    console.log("License key:\n");
    console.log(licenseKey);
  } finally {
    rl.close();
  }
};

main().catch((error) => {
  console.error("Failed to generate license", error);
  exit(1);
});
