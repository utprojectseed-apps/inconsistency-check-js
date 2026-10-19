import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import unicorn from "eslint-plugin-unicorn";

export default [
  { ignores: ["build/"] },
  js.configs.recommended,
  reactHooks.configs.flat.recommended,
  unicorn.configs.recommended,
  {
    files: ["**/*.{js,jsx,mjs}"],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Subclasses share method signatures (getHighlights(selectedReport)) and the
      // strike API keeps documented params its callers pass; unused args are fine.
      "no-unused-vars": ["error", { args: "none" }],

      // React Compiler readiness rules. The app isn't compiled with it, and the
      // pages deliberately hold parsed lists in refs + forceUpdate; fixing these
      // means restructuring every page's state.
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",

      // --- unicorn: changes behaviour if autofixed, in strike/compensation code ---
      "unicorn/prefer-number-properties": "off", // isNaN -> Number.isNaN stops coercing strings from CSV cells
      "unicorn/prefer-number-coercion": "off", // parseInt/parseFloat -> Number() rejects "12abc", "" -> 0
      "unicorn/no-for-loop": "off", // index loops read days[i] alongside other per-day arrays
      "unicorn/no-null": "off", // null and undefined mean different things here (missing vs not computed)
      "unicorn/no-useless-undefined": "off", // useState(undefined) / fill(undefined) state intent
      "unicorn/no-computed-property-existence-check": "off", // truthiness checks also skip 0/""; `in` would not
      "unicorn/prefer-private-class-fields": "off", // _helpers like GameStrikes._toFraction are used across classes
      "unicorn/no-undeclared-class-members": "off", // class fields initialise after super() and would clobber
      // values set by base constructors calling overridden methods
      "unicorn/no-array-sort": "off", // sorts are on freshly built arrays
      "unicorn/require-array-sort-compare": "off", // string sorts; a comparator would change the order
      "unicorn/consistent-function-scoping": "off", // hoisting closures is a refactor, not a fix

      // --- unicorn: pure style, would churn most lines without catching bugs ---
      "unicorn/name-replacements": "off", // e/df/i/props names are idiomatic (danfo, React)
      "unicorn/filename-case": "off", // files are lowercase-joined (gamesfullreport.jsx); renaming breaks imports
      "unicorn/no-asterisk-prefix-in-documentation-comments": "off", // standard JSDoc style
      "unicorn/single-line-block-comment-style": "off",
      "unicorn/new-for-builtins": "off", // Array(n) and new Array(n) are identical
      "unicorn/no-negated-condition": "off",
      "unicorn/switch-case-braces": "off",
      "unicorn/prefer-ternary": "off",
      "unicorn/prefer-minimal-ternary": "off",
      "unicorn/no-nested-ternary": "off",
      "unicorn/no-useless-else": "off",
      "unicorn/no-lonely-if": "off",
      "unicorn/prefer-continue": "off",
      "unicorn/prefer-early-return": "off",
      "unicorn/prefer-combined-guards": "off",
      "unicorn/prefer-simple-condition-first": "off",
      "unicorn/no-declarations-before-early-exit": "off",
      "unicorn/consistent-boolean-name": "off",
      "unicorn/consistent-compound-words": "off",
      "unicorn/consistent-class-member-order": "off",
      "unicorn/no-useless-template-literals": "off",
      "unicorn/no-zero-fractions": "off",
      "unicorn/catch-error-name": "off",
      "unicorn/prefer-at": "off",
      "unicorn/prefer-spread": "off",
      "unicorn/prefer-split-limit": "off",
      "unicorn/prefer-includes-over-repeated-comparisons": "off",
      "unicorn/no-immediate-mutation": "off",
      "unicorn/no-array-reduce": "off",
      "unicorn/no-for-each": "off",
      "unicorn/no-break-in-nested-loop": "off",
      "unicorn/max-nested-calls": "off",
      "unicorn/operator-assignment": "off",
      "unicorn/default-export-style": "off",
      "unicorn/prefer-default-parameters": "off",
      "unicorn/no-unnecessary-parameters": "off", // flags inner helpers that shadow an outer value on purpose
      "unicorn/prefer-await": "off",
      "unicorn/empty-brace-spaces": "off",
      "unicorn/no-leading-empty-lines": "off",
    },
  },
  {
    files: ["*.config.{js,mjs}"],
    rules: { "unicorn/no-top-level-side-effects": "off" }, // `export default defineConfig(...)` is the point
  },
];
