import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { AppModule } from '../src/app.module';

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const TEST_KEY_ID = 'test-rsa-key-id';
const VALID_ISSUER = 'https://dev-yg.us.auth0.com/';
const VALID_AUDIENCE = 'https://bbl-candidate-test-api';

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

describe('ADR-05 Collection Sharing & Security Isolation (e2e)', () => {
  let app: INestApplication;
  let tokenUserA: string;
  let tokenUserB: string;

  beforeAll(async () => {
    process.env.AUTH0_ISSUER_URL = VALID_ISSUER;
    process.env.AUTH0_AUDIENCE = VALID_AUDIENCE;

    tokenUserA = jwt.sign(
      {
        sub: 'auth0|user-a-share-owner',
        email: 'usera_share@test.com',
        name: 'User A Share Owner',
        iss: VALID_ISSUER,
        aud: VALID_AUDIENCE,
      },
      privateKey,
      { algorithm: 'RS256', keyid: TEST_KEY_ID, expiresIn: '1h' },
    );

    tokenUserB = jwt.sign(
      {
        sub: 'auth0|user-b-share-attacker',
        email: 'userb_share@test.com',
        name: 'User B Share Attacker',
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

  describe('Read-Only Collection Share Flow & Revocation', () => {
    let collectionUserA: any;
    let bookmark1: any;
    let bookmark2: any;
    let shareToken1: string;

    it('Step 1: User A creates a collection and two bookmarks', async () => {
      const resCol = await request(app.getHttpServer())
        .post('/collections')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ name: 'User A Shared Dev Resources' });

      expect(resCol.status).toBe(201);
      collectionUserA = resCol.body;

      const resBm1 = await request(app.getHttpServer())
        .post('/bookmarks')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          url: 'https://nestjs.com',
          title: 'NestJS Framework',
          notes: 'Backend framework notes',
          collectionId: collectionUserA.id,
        });

      expect(resBm1.status).toBe(201);
      bookmark1 = resBm1.body;

      const resBm2 = await request(app.getHttpServer())
        .post('/bookmarks')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          url: 'https://prisma.io',
          title: 'Prisma ORM',
          notes: 'Database ORM notes',
          collectionId: collectionUserA.id,
        });

      expect(resBm2.status).toBe(201);
      bookmark2 = resBm2.body;
    });

    it('Step 2: User B attempting to generate a share token for User A collection receives 404', async () => {
      const res = await request(app.getHttpServer())
        .post('/collections/share')
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({ collectionId: collectionUserA.id });

      expect(res.status).toBe(404);
    });

    it('Step 3: User A generates a read-only share token for Collection A', async () => {
      const res = await request(app.getHttpServer())
        .post('/collections/share')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ collectionId: collectionUserA.id });

      expect(res.status).toBe(201);
      expect(res.body.collectionId).toBe(collectionUserA.id);
      expect(res.body.shareToken).toBeDefined();
      shareToken1 = res.body.shareToken;
    });

    it('Step 4: Unauthenticated user can view shared collection & bookmarks via token (No Auth Header)', async () => {
      const res = await request(app.getHttpServer()).get(
        `/collections/share/${shareToken1}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.shareToken).toBe(shareToken1);
      expect(res.body.collection.id).toBe(collectionUserA.id);
      expect(res.body.collection.name).toBe('User A Shared Dev Resources');
      expect(res.body.collection.bookmarks).toHaveLength(2);

      // Verify privacy invariant: ownerId must NOT be exposed in public response
      expect(res.body.collection.ownerId).toBeUndefined();
      expect(res.body.collection.bookmarks[0].ownerId).toBeUndefined();
    });

    it('Step 5: User B attempting to revoke User A share token receives 404', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/collections/share/${shareToken1}`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(404);
    });

    it('Step 6: User A regenerates share token -> Old share token is invalidated', async () => {
      const resRegen = await request(app.getHttpServer())
        .post('/collections/share')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ collectionId: collectionUserA.id });

      expect(resRegen.status).toBe(201);
      const shareToken2 = resRegen.body.shareToken;
      expect(shareToken2).not.toBe(shareToken1);

      // Old token returns 404
      const resOld = await request(app.getHttpServer()).get(
        `/collections/share/${shareToken1}`,
      );
      expect(resOld.status).toBe(404);

      // New token returns 200
      const resNew = await request(app.getHttpServer()).get(
        `/collections/share/${shareToken2}`,
      );
      expect(resNew.status).toBe(200);

      // Clean up second token by revoking it
      await request(app.getHttpServer())
        .delete(`/collections/share/${shareToken2}`)
        .set('Authorization', `Bearer ${tokenUserA}`);
    });

    it('Step 7: User A revokes share token -> GET returns 404', async () => {
      // Generate a new share token
      const resGen = await request(app.getHttpServer())
        .post('/collections/share')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ collectionId: collectionUserA.id });

      const activeToken = resGen.body.shareToken;

      // Revoke token as owner
      const resRevoke = await request(app.getHttpServer())
        .delete(`/collections/share/${activeToken}`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(resRevoke.status).toBe(204);

      // GET returns 404
      const resGet = await request(app.getHttpServer()).get(
        `/collections/share/${activeToken}`,
      );
      expect(resGet.status).toBe(404);
    });

    it('Step 8: Deleting collection cascade-deletes the share token', async () => {
      // Create a temporary collection and share token
      const resCol = await request(app.getHttpServer())
        .post('/collections')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ name: 'Temp Collection to Delete' });

      const tempColId = resCol.body.id;

      const resShare = await request(app.getHttpServer())
        .post('/collections/share')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ collectionId: tempColId });

      const tempShareToken = resShare.body.shareToken;

      // Delete collection
      await request(app.getHttpServer())
        .delete(`/collections/${tempColId}`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      // Public share endpoint returns 404
      const resGet = await request(app.getHttpServer()).get(
        `/collections/share/${tempShareToken}`,
      );
      expect(resGet.status).toBe(404);
    });
  });
});
