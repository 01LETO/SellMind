import js from '@eslint/js';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';

export default [
	{
		ignores: ['node_modules/**', 'dist/**', 'e2e/**'],
	},
	{
		...js.configs.recommended,
		files: ['src/**/*.{js,jsx}'],
		plugins: {
			react: reactPlugin,
			'react-hooks': reactHooks,
			import: importPlugin,
		},
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: {
				...globals.browser,
			},
			parserOptions: {
				ecmaFeatures: { jsx: true },
			},
		},
		settings: {
			react: { version: 'detect' },
		},
		rules: {
			...reactPlugin.configs.recommended.rules,
			...reactHooks.configs.recommended.rules,
			'react/react-in-jsx-scope': 'off',
			'react/prop-types': 'off',
			'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
			'import/no-unresolved': 'off',
		},
	},
	{
		files: ['*.config.js', 'tools/**/*.js'],
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
	},
];
