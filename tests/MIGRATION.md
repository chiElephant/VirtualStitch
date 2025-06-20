# Migration Checklist

## Pre-Migration Tasks

- [ ] **Backup existing tests**
  ```bash
  cp -r tests/ tests-backup/
  ```

- [ ] **Review current test coverage**
  - Note any custom configurations
  - Document any project-specific requirements
  - Identify tests that may need special attention

## Migration Steps

### Step 1: File Structure Setup
- [ ] Create new directory structure
- [ ] Copy reorganized test files to new structure
- [ ] Copy fixture files (emblem.png, emblem2.png, sample.txt)
- [ ] Verify all files are in correct locations

### Step 2: Configuration Updates
- [ ] Update `playwright.config.ts` to point to new test directory
- [ ] Update any custom test scripts in `package.json`
- [ ] Update CI/CD pipeline configurations
- [ ] Update any IDE test runner configurations

### Step 3: Dependency Verification
- [ ] Ensure all imports in test files resolve correctly
- [ ] Verify fixture file paths are accessible
- [ ] Test that utilities are properly imported
- [ ] Check that all test tags work correctly

### Step 4: Test Execution Validation
- [ ] Run smoke tests: `npx playwright test --grep "@smoke"`
- [ ] Run core tests: `npx playwright test core/`
- [ ] Run integration tests: `npx playwright test integration/`
- [ ] Run quality tests: `npx playwright test quality/`
- [ ] Run API tests: `npx playwright test api/`
- [ ] Run deployment tests: `npx playwright test deployment/`

### Step 5: CI/CD Pipeline Updates
- [ ] Update GitHub Actions (or other CI) workflows
- [ ] Test pipeline execution with new structure
- [ ] Verify test reporting still works
- [ ] Update any deployment scripts that reference tests

### Step 6: Documentation Updates
- [ ] Update project README with new test structure
- [ ] Update developer onboarding docs
- [ ] Update any test-related documentation
- [ ] Share migration notes with team

## Post-Migration Verification

### Functional Verification
- [ ] All existing test scenarios still pass
- [ ] New utility functions work correctly
- [ ] Test execution time has improved
- [ ] No regressions in test coverage

### Performance Verification  
- [ ] Overall test suite runs faster
- [ ] No memory leaks in test execution
- [ ] CI/CD pipeline completes in reasonable time
- [ ] Resource usage is optimized

### Maintenance Verification
- [ ] Adding new tests is straightforward
- [ ] Updating utilities affects all relevant tests
- [ ] Test failures are easy to debug
- [ ] Test organization is intuitive for new developers

## Rollback Plan (if needed)

### If Issues Arise
- [ ] **Immediate rollback**
  ```bash
  rm -rf tests/
  mv tests-backup/ tests/
  ```
- [ ] Revert configuration changes
- [ ] Restore CI/CD pipeline configurations
- [ ] Document issues encountered for future resolution

### Troubleshooting Common Issues

#### Import/Path Issues
```typescript
// If relative imports break, verify paths:
import { TestUtils } from '../utils/test-helpers';
// Should resolve to the utils directory
```

#### Fixture File Issues
```bash
# Ensure fixture files are copied correctly:
ls -la tests/fixtures/
# Should show: emblem.png, emblem2.png, sample.txt, README.md
```

#### CI/CD Issues
```yaml
# Verify test directory in CI config:
testDir: './tests'  # Should point to reorganized structure
```

## Success Criteria

The migration is successful when:

✅ **All tests pass** with the new structure  
✅ **Test execution is faster** than before  
✅ **Maintenance is easier** with shared utilities  
✅ **CI/CD pipeline works** with new organization  
✅ **Team can easily** add new tests using utilities  
✅ **Test coverage remains** the same or improves  
✅ **Documentation is updated** and accessible  

## Team Communication

### Before Migration
- [ ] Share migration plan with development team
- [ ] Schedule migration during low-activity period  
- [ ] Ensure all team members understand new structure
- [ ] Plan for training on new utilities

### During Migration
- [ ] Communicate migration progress
- [ ] Address any immediate concerns
- [ ] Document any unexpected issues
- [ ] Keep backup plan ready

### After Migration
- [ ] Share success metrics (speed improvements, etc.)
- [ ] Provide training on new test utilities
- [ ] Update team processes for test creation
- [ ] Gather feedback for future improvements

---

## Quick Reference Commands

### Running Specific Test Categories
```bash
# Smoke tests (fastest, critical path)
npx playwright test --grep "@smoke"

# Core functionality tests
npx playwright test core/

# Integration workflows
npx playwright test integration/

# Quality assurance (accessibility, performance, security)
npx playwright test quality/

# API tests
npx playwright test api/

# Deployment validation
npx playwright test deployment/
```

### Development Commands
```bash
# Run tests in headed mode for debugging
npx playwright test core/ --headed

# Run specific test file
npx playwright test core/color-picker.spec.ts

# Debug specific test
npx playwright test core/color-picker.spec.ts --debug
```

### CI/CD Commands
```bash
# Full test suite (for CI)
npx playwright test

# Generate HTML report
npx playwright show-report

# Run tests with retries (for CI stability)
npx playwright test --retries=2
```
