import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { AppModule } from '../src/app.module';

// Generate a real RSA key pair for test JWT signatures
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

describe('Cross-User Data Isolation & Security Invariants (e2e)', () => {
  let app: INestApplication;
  let tokenUserA: string;
  let tokenUserB: string;

  beforeAll(async () => {
    process.env.AUTH0_ISSUER_URL = VALID_ISSUER;
    process.env.AUTH0_AUDIENCE = VALID_AUDIENCE;

    // Generate JWT Access Tokens for User A and User B
    tokenUserA = jwt.sign(
      {
        sub: 'auth0|user-a-candidate',
        email: 'usera@test.com',
        name: 'User A',
        iss: VALID_ISSUER,
        aud: VALID_AUDIENCE,
      },
      privateKey,
      { algorithm: 'RS256', keyid: TEST_KEY_ID, expiresIn: '1h' },
    );

    tokenUserB = jwt.sign(
      {
        sub: 'auth0|user-b-adversary',
        email: 'userb@test.com',
        name: 'User B',
        iss: VALID_ISSUER,
        aud: VALID_AUDIENCE,
      },
      privateKey,
      { algorithm: 'RS256', keyid: TEST_KEY_ID, expiresIn: '1h' },
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Adversarial Cross-User Privacy Scoping (Strict 404 Not Found)', () => {
    let collectionUserA: any;
    let bookmarkUserA: any;

    it('Step 1: User A creates a collection and a bookmark', async () => {
      // User A creates collection
      const resCol = await request(app.getHttpServer())
        .post('/collections')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ name: "User A's Secret Collection" });

      expect(resCol.status).toBe(201);
      expect(resCol.body.name).toBe("User A's Secret Collection");
      expect(resCol.body.ownerId).toBe('auth0|user-a-candidate');
      collectionUserA = resCol.body;

      // User A creates bookmark in Collection A
      const resBm = await request(app.getHttpServer())
        .post('/bookmarks')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          url: 'https://nestjs.com',
          title: 'NestJS Framework',
          notes: 'User A private notes',
          collectionId: collectionUserA.id,
        });

      expect(resBm.status).toBe(201);
      expect(resBm.body.collectionId).toBe(collectionUserA.id);
      expect(resBm.body.ownerId).toBe('auth0|user-a-candidate');
      bookmarkUserA = resBm.body;
    });

    it('Step 2: User B cannot see User A collection in GET /collections (List Isolation)', async () => {
      const res = await request(app.getHttpServer())
        .get('/collections')
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(200);
      const collections = res.body;
      const found = collections.some((c: any) => c.id === collectionUserA.id);
      expect(found).toBe(false);
    });

    it('Step 3: User B requesting GET /collections/:id for User A collection receives 404', async () => {
      const res = await request(app.getHttpServer())
        .get(`/collections/${collectionUserA.id}`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('not found');
    });

    it('Step 4: User B requesting PUT /collections/:id for User A collection receives 404', async () => {
      const res = await request(app.getHttpServer())
        .put(`/collections/${collectionUserA.id}`)
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({ name: 'Hacked Collection Name' });

      expect(res.status).toBe(404);
    });

    it('Step 5: User B requesting PATCH /collections/:id for User A collection receives 404', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/collections/${collectionUserA.id}`)
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({ name: 'Hacked Collection Name' });

      expect(res.status).toBe(404);
    });

    it('Step 6: User B requesting DELETE /collections/:id for User A collection receives 404', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/collections/${collectionUserA.id}`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(404);
    });

    it('Step 7: User B requesting GET /collections/:id/bookmarks for User A collection receives 404', async () => {
      const res = await request(app.getHttpServer())
        .get(`/collections/${collectionUserA.id}/bookmarks`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(404);
    });

    it('Step 8: User B requesting GET /bookmarks/:id for User A bookmark receives 404', async () => {
      const res = await request(app.getHttpServer())
        .get(`/bookmarks/${bookmarkUserA.id}`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(404);
    });

    it('Step 9: User B requesting DELETE /bookmarks/:id for User A bookmark receives 404', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/bookmarks/${bookmarkUserA.id}`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(404);
    });

    it('Step 10: User B attempting to create bookmark in User A collection receives 404', async () => {
      const res = await request(app.getHttpServer())
        .post('/bookmarks')
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({
          url: 'https://attacker.com',
          title: 'Malicious Bookmark',
          collectionId: collectionUserA.id, // User B trying to inject into User A collection
        });

      expect(res.status).toBe(404);
    });

    it('Step 11: User A deletes collection -> bookmark remains as uncategorized (collectionId = null)', async () => {
      // User A deletes collection
      const resDel = await request(app.getHttpServer())
        .delete(`/collections/${collectionUserA.id}`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(resDel.status).toBe(204);

      // User A fetches bookmark -> collectionId is null
      const resBm = await request(app.getHttpServer())
        .get(`/bookmarks/${bookmarkUserA.id}`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(resBm.status).toBe(200);
      expect(resBm.body.collectionId).toBeNull();
    });
  });
});
