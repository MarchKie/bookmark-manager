import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { AppModule } from '../src/app.module';

// Generate a real RSA key pair for testing asymmetric JWT signatures
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const TEST_KEY_ID = 'test-rsa-key-id';
const VALID_ISSUER = 'https://dev-yg.us.auth0.com/';
const VALID_AUDIENCE = 'https://bbl-candidate-test-api';

// Mock jwks-rsa to return our test public key when kid matches
jest.mock('jwks-rsa', () => ({
  passportJwtSecret: () => {
    return (
      req: any,
      rawJwtToken: string,
      done: (err: any, secret?: string | null) => void,
    ) => {
      try {
        const decoded: any = jwt.decode(rawJwtToken, { complete: true });
        if (decoded && decoded.header && decoded.header.kid === TEST_KEY_ID) {
          return done(null, publicKey);
        }
        return done(null, null);
      } catch (err) {
        return done(err, null);
      }
    };
  },
}));

describe('Authentication & Security Invariants (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.AUTH0_ISSUER_URL = VALID_ISSUER;
    process.env.AUTH0_AUDIENCE = VALID_AUDIENCE;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Adversarial Security Failure Cases (HTTP 401 Unauthorized)', () => {
    it('1. Should reject requests without Authorization header (401)', async () => {
      const res = await request(app.getHttpServer()).get('/me');
      expect(res.status).toBe(401);
    });

    it('2. Should reject requests with malformed Authorization header (401)', async () => {
      const res = await request(app.getHttpServer())
        .get('/me')
        .set('Authorization', 'Basic invalid-token-credentials');

      expect(res.status).toBe(401);
    });

    it('3. Should reject requests with expired token (401)', async () => {
      const expiredToken = jwt.sign(
        {
          sub: 'auth0|user-expired',
          email: 'expired@test.com',
          iss: VALID_ISSUER,
          aud: VALID_AUDIENCE,
        },
        privateKey,
        {
          algorithm: 'RS256',
          keyid: TEST_KEY_ID,
          expiresIn: '-1h', // Expired 1 hour ago
        },
      );

      const res = await request(app.getHttpServer())
        .get('/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
    });

    it('4. Should reject requests with token containing wrong audience (401)', async () => {
      const wrongAudToken = jwt.sign(
        {
          sub: 'auth0|user-wrong-aud',
          email: 'wrongaud@test.com',
          iss: VALID_ISSUER,
          aud: 'https://malicious-other-api.com', // Wrong Audience
        },
        privateKey,
        {
          algorithm: 'RS256',
          keyid: TEST_KEY_ID,
          expiresIn: '1h',
        },
      );

      const res = await request(app.getHttpServer())
        .get('/me')
        .set('Authorization', `Bearer ${wrongAudToken}`);

      expect(res.status).toBe(401);
    });

    it('5. Should reject requests with token containing wrong issuer (401)', async () => {
      const wrongIssToken = jwt.sign(
        {
          sub: 'auth0|user-wrong-iss',
          email: 'wrongiss@test.com',
          iss: 'https://fake-tenant.auth0.com/', // Wrong Issuer
          aud: VALID_AUDIENCE,
        },
        privateKey,
        {
          algorithm: 'RS256',
          keyid: TEST_KEY_ID,
          expiresIn: '1h',
        },
      );

      const res = await request(app.getHttpServer())
        .get('/me')
        .set('Authorization', `Bearer ${wrongIssToken}`);

      expect(res.status).toBe(401);
    });

    it('6. Should reject requests with token signed by unknown key ID (401)', async () => {
      const unknownKeyToken = jwt.sign(
        {
          sub: 'auth0|user-unknown-key',
          email: 'unknownkey@test.com',
          iss: VALID_ISSUER,
          aud: VALID_AUDIENCE,
        },
        privateKey,
        {
          algorithm: 'RS256',
          keyid: 'untrusted-kid-999', // Unknown Key ID
          expiresIn: '1h',
        },
      );

      const res = await request(app.getHttpServer())
        .get('/me')
        .set('Authorization', `Bearer ${unknownKeyToken}`);

      expect(res.status).toBe(401);
    });
  });

  describe('Valid Security Success Case (HTTP 200 OK)', () => {
    it('7. Should accept request with valid JWT Access Token and return user profile (200)', async () => {
      const validToken = jwt.sign(
        {
          sub: 'auth0|candidate-user-123',
          email: 'candidate@test.com',
          name: 'Candidate Tester',
          picture: 'https://avatar.example.com/user.jpg',
          iss: VALID_ISSUER,
          aud: VALID_AUDIENCE,
        },
        privateKey,
        {
          algorithm: 'RS256',
          keyid: TEST_KEY_ID,
          expiresIn: '1h',
        },
      );

      const res = await request(app.getHttpServer())
        .get('/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        sub: 'auth0|candidate-user-123',
        email: 'candidate@test.com',
        name: 'Candidate Tester',
        picture: 'https://avatar.example.com/user.jpg',
      });
    });
  });
});
