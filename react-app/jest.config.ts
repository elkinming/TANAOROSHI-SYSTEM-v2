import { configUmiAlias, createConfig } from '@umijs/max/test';

export default async (): Promise<any> => {
  const config = await configUmiAlias({
    ...createConfig({
      target: 'browser',
    }),
  });
  return {
    ...config,
    testEnvironmentOptions: {
      ...(config?.testEnvironmentOptions || {}),
      url: 'http://localhost:8000',
    },
    setupFiles: [...(config.setupFiles || []), './tests/setupTests.jsx'],
    globals: {
      ...config.globals,
      localStorage: null,
    },
    // Coverage configuration
    collectCoverageFrom: [
      'src/**/*.{ts,tsx}',
      '!src/**/*.d.ts',
      '!src/**/*.stories.{ts,tsx}',
      '!src/**/__tests__/**',
      '!src/**/__mocks__/**',
      '!src/**/mock/**',
      '!src/**/typings.d.ts',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html', 'json', 'clover'],
    coveragePathIgnorePatterns: [
      '/node_modules/',
      '/.umi/',
      '/.umi-production/',
      '/.umi-test/',
      '/.umi-test-production/',
      '/dist/',
      '/coverage/',
      '/mock/',
      '/tests/',
    ],
  };
};
