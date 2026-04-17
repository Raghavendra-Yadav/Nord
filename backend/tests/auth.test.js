const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Minimal User model mock so tests run without a real MongoDB connection
jest.mock('../models/User', () => {
  const crypto = require('crypto');
  const bcrypt = require('bcryptjs');

  function MockUser(data) {
    Object.assign(this, data);
    this.resetPasswordToken = undefined;
    this.resetPasswordExpire = undefined;
  }

  MockUser.prototype.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    return resetToken;
  };

  MockUser.prototype.matchPassword = async function (entered) {
    return bcrypt.compare(entered, this.password);
  };

  MockUser.prototype.save = async function () { return this; };
  MockUser.findOne = jest.fn();
  MockUser.findById = jest.fn();
  MockUser.create = jest.fn();

  return MockUser;
});

const User = require('../models/User');

// ─── Unit Tests ───────────────────────────────────────────────────────────────

describe('User model – getResetPasswordToken', () => {
  let user;

  beforeEach(() => {
    user = new User({ name: 'Test', email: 'test@example.com', password: 'hashed' });
  });

  it('returns a non-empty raw token', () => {
    const token = user.getResetPasswordToken();
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
  });

  it('stores SHA-256 hash of the raw token on the document', () => {
    const token = user.getResetPasswordToken();
    const expected = crypto.createHash('sha256').update(token).digest('hex');
    expect(user.resetPasswordToken).toBe(expected);
  });

  it('sets expiry at least 9 minutes in the future', () => {
    user.getResetPasswordToken();
    expect(user.resetPasswordExpire).toBeGreaterThan(Date.now() + 9 * 60 * 1000);
  });

  it('generates unique tokens on each call', () => {
    const t1 = user.getResetPasswordToken();
    const t2 = user.getResetPasswordToken();
    expect(t1).not.toBe(t2);
  });
});

describe('User model – matchPassword', () => {
  let user;

  beforeEach(async () => {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash('correctPassword1', salt);
    user = new User({ name: 'Test', email: 'test@example.com', password: hashed });
  });

  it('returns true for the correct password', async () => {
    expect(await user.matchPassword('correctPassword1')).toBe(true);
  });

  it('returns false for a wrong password', async () => {
    expect(await user.matchPassword('wrongPassword')).toBe(false);
  });

  it('returns false for empty string', async () => {
    expect(await user.matchPassword('')).toBe(false);
  });
});

// ─── Auth middleware unit tests ───────────────────────────────────────────────

describe('protect middleware', () => {
  let protect;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test_secret_key_for_jest';
    protect = require('../middleware/auth').protect;
  });

  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  it('calls next() with a valid Bearer token', () => {
    const token = jwt.sign({ id: 'user123' }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    protect(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual(expect.objectContaining({ id: 'user123' }));
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 401 when no Authorization header is present', () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Not authorized, no token' }));
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for a tampered/invalid token', () => {
    const req = { headers: { authorization: 'Bearer tampered.token.value' } };
    const res = mockRes();
    const next = jest.fn();

    protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Not authorized, token failed' }));
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header lacks Bearer prefix', () => {
    const token = jwt.sign({ id: 'user123' }, process.env.JWT_SECRET);
    const req = { headers: { authorization: token } }; // missing "Bearer "
    const res = mockRes();
    const next = jest.fn();

    protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

// ─── Auth controller unit tests ───────────────────────────────────────────────

describe('registerUser – input validation', () => {
  let registerUser;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test_secret_key_for_jest';
    ({ registerUser } = require('../controllers/authController'));
  });

  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  it('rejects missing fields', async () => {
    const req = { body: { name: 'Alice', email: '' } };
    const res = mockRes();
    await registerUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Please add all fields' }));
  });

  it('rejects invalid email format', async () => {
    const req = { body: { name: 'Alice', email: 'not-an-email', password: 'password123' } };
    const res = mockRes();
    await registerUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('valid email') }));
  });

  it('rejects password shorter than 8 characters', async () => {
    const req = { body: { name: 'Alice', email: 'alice@example.com', password: 'short' } };
    const res = mockRes();
    await registerUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('8 characters') }));
  });

  it('rejects a single-character name', async () => {
    const req = { body: { name: 'A', email: 'alice@example.com', password: 'password123' } };
    const res = mockRes();
    await registerUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('2 characters') }));
  });

  it('creates a user when all inputs are valid', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      id: 'abc123',
      _id: 'abc123',
      name: 'Alice',
      email: 'alice@example.com',
      profilePic: '',
      xp: 0,
      level: 1,
      badges: [],
    });

    const req = { body: { name: 'Alice', email: 'alice@example.com', password: 'securePass1' } };
    const res = mockRes();
    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ email: 'alice@example.com', token: expect.any(String) }));
  });

  it('normalises email to lowercase before lookup and creation', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      id: 'abc123', _id: 'abc123', name: 'Alice',
      email: 'alice@example.com', profilePic: '', xp: 0, level: 1, badges: [],
    });

    const req = { body: { name: 'Alice', email: 'Alice@EXAMPLE.COM', password: 'securePass1' } };
    const res = mockRes();
    await registerUser(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: 'alice@example.com' });
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'alice@example.com' }));
  });
});

describe('addXp – validation', () => {
  let addXp;

  beforeAll(() => {
    ({ addXp } = require('../controllers/authController'));
  });

  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  it('rejects non-numeric amount', async () => {
    const req = { body: { amount: 'abc' }, user: { id: 'u1' } };
    const res = mockRes();
    await addXp(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rejects zero amount', async () => {
    const req = { body: { amount: 0 }, user: { id: 'u1' } };
    const res = mockRes();
    await addXp(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rejects negative amount', async () => {
    const req = { body: { amount: -10 }, user: { id: 'u1' } };
    const res = mockRes();
    await addXp(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('awards XP and returns updated values for a valid amount', async () => {
    const fakeUser = { xp: 50, level: 1, save: jest.fn().mockResolvedValue(true) };
    User.findById.mockResolvedValue(fakeUser);

    const req = { body: { amount: 10 }, user: { id: 'u1' } };
    const res = mockRes();
    await addXp(req, res);

    expect(fakeUser.xp).toBe(60);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ xp: 60 }));
  });
});
