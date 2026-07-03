import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({ baseDirectory: import.meta.dirname })

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: [
      '.next/**',
      'public/**',
      'node_modules/**',
      'pulse/**',
      'next-env.d.ts',
      'hand-controls.js',
      'config.js',
      '*.code-workspace',
    ],
  },
]

export default eslintConfig
