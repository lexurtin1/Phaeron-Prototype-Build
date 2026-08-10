// Calastone Pulse — local API config template (optional fallback)
// Preferred: set ANTHROPIC_API_KEY in .env.local or Vercel Project Settings
// so /api/claude can proxy requests without exposing the key.
//
// Optional local static fallback:
//   Copy this file to config.js and paste your Anthropic key.
//   config.js is gitignored and must never be committed.

window.CONFIG = {
  ANTHROPIC_API_KEY: "PASTE-YOUR-KEY-HERE", // e.g. "sk-ant-..."
  CLAUDE_MODEL: "claude-sonnet-4-6",
};
