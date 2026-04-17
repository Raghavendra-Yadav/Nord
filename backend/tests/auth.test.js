const assert = require('assert');
const mongoose = require('mongoose');
const User = require('../models/User');
const crypto = require('crypto');

// Simulated DB environment configuration
mongoose.Promise = global.Promise;

async function testPasswordResetFlow() {
  console.log("Running Password Reset Flow Unit Tests...");

  /** 
   * TEST 1: verify getResetPasswordToken properly generates token and sets expiry
   */
  const user = new User({
    name: "Test User",
    email: "test@example.com",
    password: "password123"
  });

  const rawToken = user.getResetPasswordToken();
  assert.ok(rawToken, "Reset Token should be successfully generated");
  assert.ok(user.resetPasswordToken, "Hashed Token should be stored on the user document");
  assert.ok(user.resetPasswordExpire > Date.now(), "Token expiry timestamp should be explicitly set in the future");

  // Verify hash matches
  const expectedHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  assert.strictEqual(user.resetPasswordToken, expectedHash, "Stored reset token should match SHA-256 hash of raw token");

  console.log("✔ Password Reset Token generation tested successfully.");

  /** 
   * TEST 2: verify matchPassword method functions correctly
   */
  // Given pre('save') hashes it, we simulate that behavior for the test
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash("password123", salt);

  const isMatch = await user.matchPassword("password123");
  assert.strictEqual(isMatch, true, "matchPassword should return true for valid credentials");

  const isMismatch = await user.matchPassword("wrongpassword");
  assert.strictEqual(isMismatch, false, "matchPassword should return false for invalid credentials");

  console.log("✔ matchPassword tested successfully.");
}

// Ensure execution
if (require.main === module) {
  testPasswordResetFlow()
    .then(() => {
      console.log("All unit tests passed.");
      process.exit(0);
    })
    .catch(err => {
      console.error("Test execution failed:", err);
      process.exit(1);
    });
}

module.exports = { testPasswordResetFlow };
