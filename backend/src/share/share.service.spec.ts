import { Test, TestingModule } from '@nestjs/testing';
import { ShareService } from './share.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ShareService', () => {
  let service: ShareService;
  let prisma: any;

  const mockPrismaService = {
    collection: {
      findFirst: jest.fn(),
    },
    collectionShare: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShareService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ShareService>(ShareService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateShareToken', () => {
    it('should throw NotFoundException if collection does not belong to owner', async () => {
      prisma.collection.findFirst.mockResolvedValue(null);

      await expect(
        service.generateShareToken(
          { collectionId: 'col-1' },
          'auth0|user-a',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should upsert share token when collection belongs to owner', async () => {
      prisma.collection.findFirst.mockResolvedValue({
        id: 'col-1',
        ownerId: 'auth0|user-a',
      });

      prisma.collectionShare.upsert.mockResolvedValue({
        id: 'share-1',
        collectionId: 'col-1',
        shareToken: 'token-uuid',
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await service.generateShareToken(
        { collectionId: 'col-1' },
        'auth0|user-a',
      );

      expect(res.shareToken).toBe('token-uuid');
      expect(prisma.collectionShare.upsert).toHaveBeenCalled();
    });
  });

  describe('getSharedCollection', () => {
    it('should throw NotFoundException if token does not exist', async () => {
      prisma.collectionShare.findUnique.mockResolvedValue(null);

      await expect(service.getSharedCollection('invalid-token')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if token is expired', async () => {
      prisma.collectionShare.findUnique.mockResolvedValue({
        shareToken: 'expired-token',
        expiresAt: new Date(Date.now() - 10000), // in the past
        collection: { id: 'col-1', name: 'Test', bookmarks: [] },
      });

      await expect(service.getSharedCollection('expired-token')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return read-only collection without ownerId when token is valid', async () => {
      prisma.collectionShare.findUnique.mockResolvedValue({
        shareToken: 'valid-token',
        expiresAt: null,
        collection: {
          id: 'col-1',
          name: 'Public Collection',
          createdAt: new Date(),
          updatedAt: new Date(),
          ownerId: 'auth0|secret-owner',
          bookmarks: [
            {
              id: 'bm-1',
              url: 'https://example.com',
              title: 'Example',
              notes: 'Note',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      });

      const res = await service.getSharedCollection('valid-token');

      expect(res.shareToken).toBe('valid-token');
      expect(res.collection.name).toBe('Public Collection');
      expect(res.collection.bookmarks).toHaveLength(1);
      // Ensure ownerId is omitted
      expect((res.collection as any).ownerId).toBeUndefined();
    });
  });

  describe('revokeShareToken', () => {
    it('should throw NotFoundException if share token belongs to another user collection', async () => {
      prisma.collectionShare.findUnique.mockResolvedValue({
        id: 'share-1',
        collection: { ownerId: 'auth0|owner-a' },
      });

      await expect(
        service.revokeShareToken('share-1', 'auth0|user-b-adversary'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should delete share token if owner matches', async () => {
      prisma.collectionShare.findUnique.mockResolvedValue({
        id: 'share-1',
        collection: { ownerId: 'auth0|owner-a' },
      });

      prisma.collectionShare.delete.mockResolvedValue({});

      await service.revokeShareToken('share-1', 'auth0|owner-a');

      expect(prisma.collectionShare.delete).toHaveBeenCalledWith({
        where: { id: 'share-1' },
      });
    });
  });
});
