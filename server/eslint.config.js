import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";

const moduleEntryOnly = {
    regex: "modules/[^/]+/(?!index\\.js$)[^/]+$",
    message: "Import a module only through its index.js.",
};

const siblingModuleEntryOnly = {
    regex: "^\\.\\./(?!\\.\\.)[^/]+/(?!index\\.js$)[^/]+$",
    message: "Import another module only through its index.js.",
};

const sharedStaysShared = {
    regex: "modules/",
    message: "Shared code must not depend on a module.",
};

export default defineConfig(
    { ignores: ["dist/"] },
    js.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
          parserOptions: {
            projectService: true,
            tsconfigRootDir: import.meta.dirname,
          } ,  

        },
    },
    {
        rules: {
            "@typescript-eslint/no-non-null-assertion": "error",
            eqeqeq: ["error", "always"],
        },
    },
    {
        rules: {
            "no-restricted-imports": ["error", { patterns: [moduleEntryOnly] }],
        },
    },
    {
        files: ["src/modules/**/*.ts"],
        rules: {
            "no-restricted-imports": [
                "error",
                { patterns: [moduleEntryOnly, siblingModuleEntryOnly] },
            ],
        },
    },
    {
        files: ["src/shared/**/*.ts"],
        rules: {
            "no-restricted-imports": ["error", { patterns: [sharedStaysShared] }],
        },
    },
    {
       files: ["**/*.js"],
       extends: [tseslint.configs.disableTypeChecked],
    },
);