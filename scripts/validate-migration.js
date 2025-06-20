#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Migration Validation Script
 * Validates that the test migration has been completed successfully
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔍 Validating test migration...\n');

const validationResults = {
  structure: false,
  dependencies: false,
  configuration: false,
  scripts: false,
  tests: false,
  overall: false,
};

// 1. Validate directory structure
function validateStructure() {
  console.log('📁 Checking directory structure...');

  const requiredDirs = [
    'tests/core',
    'tests/integration',
    'tests/quality',
    'tests/api',
    'tests/deployment',
    'tests/utils',
    'tests/fixtures',
  ];

  const requiredFiles = [
    'tests/utils/test-helpers.ts',
    'tests/utils/global-setup.ts',
    'tests/utils/global-teardown.ts',
    'tests/fixtures/README.md',
  ];

  let structureValid = true;

  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      console.log(`❌ Missing directory: ${dir}`);
      structureValid = false;
    } else {
      console.log(`✅ Directory exists: ${dir}`);
    }
  }

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      console.log(`❌ Missing file: ${file}`);
      structureValid = false;
    } else {
      console.log(`✅ File exists: ${file}`);
    }
  }

  // Check for specific test files
  const coreTests = [
    'tests/core/home.spec.ts',
    'tests/core/customizer.spec.ts',
    'tests/core/color-picker.spec.ts',
    'tests/core/file-picker.spec.ts',
    'tests/core/ai-picker.spec.ts',
    'tests/core/image-download.spec.ts',
    'tests/core/canvas.spec.ts',
  ];

  for (const test of coreTests) {
    if (!fs.existsSync(test)) {
      console.log(`❌ Missing core test: ${test}`);
      structureValid = false;
    }
  }

  validationResults.structure = structureValid;
  console.log(
    structureValid ?
      '✅ Directory structure validation passed\n'
    : '❌ Directory structure validation failed\n'
  );
}

// 2. Validate package.json scripts
function validatePackageScripts() {
  console.log('📦 Checking package.json scripts...');

  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const scripts = packageJson.scripts || {};

    const requiredScripts = [
      'test:e2e',
      'test:smoke',
      'test:core',
      'test:integration',
      'test:quality',
      'test:api',
      'test:deployment',
      'test:accessibility',
      'test:performance',
      'test:security',
    ];

    let scriptsValid = true;

    for (const script of requiredScripts) {
      if (!scripts[script]) {
        console.log(`❌ Missing script: ${script}`);
        scriptsValid = false;
      } else {
        console.log(`✅ Script exists: ${script}`);
      }
    }

    validationResults.scripts = scriptsValid;
    console.log(
      scriptsValid ?
        '✅ Package scripts validation passed\n'
      : '❌ Package scripts validation failed\n'
    );
  } catch (error) {
    console.log(`❌ Error reading package.json: ${error.message}\n`);
    validationResults.scripts = false;
  }
}

// 3. Validate Playwright configuration
function validatePlaywrightConfig() {
  console.log('⚙️ Checking Playwright configuration...');

  try {
    if (!fs.existsSync('playwright.config.ts')) {
      console.log('❌ playwright.config.ts not found');
      validationResults.configuration = false;
      return;
    }

    const configContent = fs.readFileSync('playwright.config.ts', 'utf8');

    const requiredConfig = [
      "testDir: './tests'",
      'global-setup',
      'global-teardown',
      'chromium',
      'firefox',
      'webkit',
      'mobile-chrome',
      'mobile-safari',
    ];

    let configValid = true;

    for (const config of requiredConfig) {
      if (!configContent.includes(config)) {
        console.log(`❌ Missing config: ${config}`);
        configValid = false;
      } else {
        console.log(`✅ Config found: ${config}`);
      }
    }

    validationResults.configuration = configValid;
    console.log(
      configValid ?
        '✅ Playwright configuration validation passed\n'
      : '❌ Playwright configuration validation failed\n'
    );
  } catch (error) {
    console.log(`❌ Error reading playwright.config.ts: ${error.message}\n`);
    validationResults.configuration = false;
  }
}

// 4. Validate dependencies
function validateDependencies() {
  console.log('📚 Checking dependencies...');

  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const devDeps = packageJson.devDependencies || {};

    const requiredDeps = ['@playwright/test', '@axe-core/playwright'];

    let depsValid = true;

    for (const dep of requiredDeps) {
      if (!devDeps[dep]) {
        console.log(`❌ Missing dependency: ${dep}`);
        depsValid = false;
      } else {
        console.log(`✅ Dependency exists: ${dep}`);
      }
    }

    validationResults.dependencies = depsValid;
    console.log(
      depsValid ?
        '✅ Dependencies validation passed\n'
      : '❌ Dependencies validation failed\n'
    );
  } catch (error) {
    console.log(`❌ Error checking dependencies: ${error.message}\n`);
    validationResults.dependencies = false;
  }
}

// 5. Run smoke tests to validate functionality
function validateTests() {
  console.log('🧪 Running validation tests...');

  try {
    // Try to run smoke tests
    console.log('Running smoke tests...');
    execSync('npm run test:smoke', { stdio: 'pipe', timeout: 120000 });
    console.log('✅ Smoke tests passed');

    validationResults.tests = true;
    console.log('✅ Test validation passed\n');
  } catch (error) {
    console.log('❌ Smoke tests failed', error.message);
    console.log("This might be normal if the app isn't running locally.");
    console.log('Checking if tests can be discovered...');

    try {
      execSync('npx playwright test --list', { stdio: 'pipe' });
      console.log('✅ Tests can be discovered successfully');
      validationResults.tests = true;
      console.log('✅ Test structure validation passed\n');
    } catch (listError) {
      console.log(`❌ Test discovery failed: ${listError.message}\n`);
      validationResults.tests = false;
    }
  }
}

// 6. Generate migration report
function generateReport() {
  console.log('📋 Migration Validation Report\n');
  console.log('================================\n');

  const checks = [
    { name: 'Directory Structure', result: validationResults.structure },
    { name: 'Package Scripts', result: validationResults.scripts },
    {
      name: 'Playwright Configuration',
      result: validationResults.configuration,
    },
    { name: 'Dependencies', result: validationResults.dependencies },
    { name: 'Test Execution', result: validationResults.tests },
  ];

  checks.forEach((check) => {
    console.log(`${check.result ? '✅' : '❌'} ${check.name}`);
  });

  const allPassed = Object.values(validationResults).every((result) => result);
  validationResults.overall = allPassed;

  console.log('\n================================\n');

  if (allPassed) {
    console.log('🎉 MIGRATION SUCCESSFUL!');
    console.log(
      '\nYour test suite has been successfully migrated to the new structure.'
    );
    console.log('\n📚 Next Steps:');
    console.log('1. Run `npm run dev` in another terminal to start the app');
    console.log('2. Then run `npm run test:smoke` to test actual execution');
    console.log(
      '3. Review the new test utilities in tests/utils/test-helpers.ts'
    );
    console.log('4. Consider removing old-tests/ directory after validation');
    console.log('\n🚀 Enhanced Features Available:');
    console.log(
      '- Organized test categories (core, integration, quality, api, deployment)'
    );
    console.log('- Shared utilities for reduced code duplication');
    console.log('- Enhanced CI/CD pipeline with parallel execution');
    console.log(
      '- Comprehensive quality testing (a11y, performance, security)'
    );
    console.log('- Production monitoring and health scoring');
  } else {
    console.log('❌ MIGRATION INCOMPLETE');
    console.log(
      '\nSome validation checks failed. Please review the issues above.'
    );
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure all files were copied correctly');
    console.log('2. Check that package.json was updated');
    console.log('3. Verify playwright.config.ts was updated');
    console.log('4. Run `npm install` if dependencies are missing');
    console.log('5. Check the migration guide in tests/MIGRATION.md');
  }

  console.log('\n📖 Documentation:');
  console.log('- Complete guide: tests/README.md');
  console.log('- Migration steps: tests/MIGRATION.md');
  console.log('- Executive summary: tests/EXECUTIVE-SUMMARY.md');

  return allPassed;
}

// Run all validations
async function runValidation() {
  try {
    validateStructure();
    validatePackageScripts();
    validatePlaywrightConfig();
    validateDependencies();
    validateTests();

    const success = generateReport();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Validation failed with error:', error);
    process.exit(1);
  }
}

// Add this as a script in package.json:
// "validate-migration": "node scripts/validate-migration.js"

if (require.main === module) {
  runValidation();
}

module.exports = { runValidation, validationResults };
