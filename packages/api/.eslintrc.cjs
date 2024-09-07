/** @type {import('eslint').Linter.Config} */
module.exports = {
	root: true,
	parserOptions: {
		ecmaVersion: "latest",
		sourceType: "module",
	},
	env: {
		commonjs: true,
		es6: true,
	},
	extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
	overrides: [
		{
			files: ["**/*.{ts,tsx}"],
			ignorePatterns: ["**/*.d.ts", "**/*.js", "**/*.mjs"],
			plugins: ["@typescript-eslint"],
			parser: "@typescript-eslint/parser",
			settings: {
				"import/resolver": {
					typescript: {},
				},
			},
			rules: {
				"@typescript-eslint/consistent-type-imports": "error",
				"@typescript-eslint/no-explicit-any": "off",
			},
		},
		{
			files: [".eslintrc.cjs"],
			env: {
				node: true,
			},
		},
	],
};
