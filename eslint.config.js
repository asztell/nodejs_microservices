import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import nodePlugin from 'eslint-plugin-n'
import securityPlugin from 'eslint-plugin-security'
import safeql from '@ts-safeql/eslint-plugin/config'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default tseslint.config(
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  nodePlugin.configs['flat/recommended'],
  securityPlugin.configs.recommended,
  {
    files: ['apps/**/*.ts', 'packages/shared/**/*.ts', 'scripts/**/*.ts'],
    settings: {
      // 'import/resolver': {
      //   typescript: true
      // },
      node: {
        tryExtensions: ['.js', '.json', '.node', '.ts', '.tsx', '.d.ts'],
        // packageDir: [
        //   __dirname,
        //   './apps/auth-service',
        //   './apps/api-gateway',
        //   './apps/task-service',
        //   './packages/*'
        // ]
      }
    },
    languageOptions: {
      parserOptions: {
        project: [
          './tsconfig.base.json',
          './apps/*/tsconfig.json',
          './packages/*/tsconfig.json'
        ],
        tsconfigRootDir: __dirname
      }
    },
    rules: {
      'no-console': 'off', // Keep open for backend/microservice terminal logs
      'security/detect-object-injection': 'warn', // Catches req.params security flaws
      '@typescript-eslint/no-explicit-any': 'error',
      // Fixes resolution issues for node-next module scripts
      'n/no-missing-import': 'off',
      'n/no-extraneous-import': [
        'warn',
        {
          allowModules: ['zod', 'express', 'dotenv']
        }
      ],
      'n/no-unsupported-features/node-builtins': 'warn'
    }
  },
  safeql.configs.connections({
    targets: [
      {
        // tag: "sql",
        wrapper: 'getPool().query',
        transform: '{type}'
        // skipTypeAnnotations: true
      }
    ],
    connectionUrl: 'postgres://postgres:postgres@localhost:5432/postgres',
    migrationsDir: '../../sql',
    watchMode: true
  })
)
