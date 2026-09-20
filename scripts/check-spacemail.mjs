// Optional, read-only network diagnostic: no credentials, AUTH, or email delivery.
// Uses Wrangler's installed compiler/runtime to exercise the actual SMTP library.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const { build } = require("esbuild");
const { Miniflare, convertV4MiniflareOptions } = require("miniflare");
const config = JSON.parse(readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8").replace(/^\s*\/\/.*$/gm, ""));
const compiled = await build({
  stdin: {
    contents: `import { createSpacemailTransport } from './server/spacemail';
      export default { async fetch() {
        const transport = createSpacemailTransport();
        try { await transport.verify(); return Response.json({ ok: true, tlsAndSmtp: 'connected', authenticated: false, emailSent: false }); }
        catch (error) { return Response.json({ ok: false, code: error.code, message: error.message }, { status: 502 }); }
        finally { transport.close(); }
      } };`,
    resolveDir: process.cwd(), loader: "ts",
  },
  bundle: true, write: false, format: "esm", platform: "node", target: "es2022",
});
const runtime = new Miniflare(convertV4MiniflareOptions({
  modules: true, script: compiled.outputFiles[0].text,
  compatibilityDate: config.compatibility_date,
  compatibilityFlags: config.compatibility_flags,
}));
try {
  const response = await runtime.dispatchFetch("https://diagnostic.invalid");
  console.log(await response.text());
  if (!response.ok) process.exitCode = 1;
} finally { await runtime.dispose(); }
