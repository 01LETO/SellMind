import js from '@eslint/js';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';

export default [
	{
		ignores: ['node_modules/**', 'dist/**'],
	},
	{
		...js.configs.recommended,
		files: ['src/**/*.js'],
		plugins: {
			import: importPlugin,
		},
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: {
				...globals.node,
			},
		},
		rules: {
			'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
			'no-console': 'off',
			'import/no-unresolved': 'off',
		},
	},
	{
		files: ['src/__tests__/**/*.js'],
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
	},
];
