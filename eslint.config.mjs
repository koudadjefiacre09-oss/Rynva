import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  {
    // New React Compiler rules shipped with eslint-config-next 16. Existing
    // code predates them; keep them visible as warnings instead of blocking.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
    },
  },
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts", "supabase/**"] },
];

export default config;
