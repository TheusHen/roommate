# Integration Test

This file tests the complete functionality of the MongoDB Handler and Grabber components without requiring external dependencies.

## Running the Integration Test

⚠️ **Important**: Due to ES module configuration, the integration test requires specific commands to run properly.

### Quick Start

```bash
# Install dependencies (required)
npm install

# Run the integration test (recommended method)
npm run test:integration
```

### Alternative Methods

```bash
# Method 1: Using tsx (fastest)
npx tsx test_integration.ts

# Method 2: Using ts-node with ESM support
npm run test:integration:ts-node

# Method 3: Using Node.js directly with ts-node loader
node --loader ts-node/esm test_integration.ts
```

### ❌ Known Issues

The following command **will NOT work** due to ES module configuration:
```bash
npx ts-node test_integration.ts  # ❌ This fails with "Unknown file extension .ts"
```

### What This Test Does

1. **Pattern Recognition**: Tests MongoDB Handler's ability to extract memories from user sentences
2. **Query Analysis**: Tests keyword extraction and type guessing from user queries  
3. **Context Building**: Tests Grabber's context creation from stored memories
4. **Integration Simulation**: Tests end-to-end memory enrichment workflow

### Expected Output

When successful, you'll see:
- ✅ MongoDB Handler: Pattern recognition working
- ✅ Grabber: Context building working  
- ✅ Server: Memory enrichment working
- ✅ End-to-end: Ready for production

This test runs completely offline and doesn't require MongoDB, making it perfect for CI/CD and development environments.