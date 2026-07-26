import { Test, TestingModule } from '@nestjs/testing';
import { CollectionsService } from './collections.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CollectionsService', () => {
  let service: CollectionsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    collection: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    bookmark: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollectionsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CollectionsService>(CollectionsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should return collection if found for user', async () => {
      const collection = {
        id: 'col-1',
        name: 'Tech',
        ownerId: 'user-a',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.collection.findFirst.mockResolvedValue(collection);

      const result = await service.findOne('col-1', 'user-a');
      expect(result).toEqual(collection);
      expect(prisma.collection.findFirst).toHaveBeenCalledWith({
        where: { id: 'col-1', ownerId: 'user-a' },
        include: { _count: { select: { bookmarks: true } } },
      });
    });

    it('should throw NotFoundException (404) if collection belongs to another user', async () => {
      mockPrismaService.collection.findFirst.mockResolvedValue(null);

      await expect(service.findOne('col-b', 'user-a')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create collection scoped to ownerId', async () => {
      const dto = { name: 'New Col' };
      const expected = { id: 'col-2', name: 'New Col', ownerId: 'user-a' };
      mockPrismaService.collection.create.mockResolvedValue(expected);

      const result = await service.create(dto, 'user-a');
      expect(result).toEqual(expected);
      expect(prisma.collection.create).toHaveBeenCalledWith({
        data: { name: 'New Col', ownerId: 'user-a' },
      });
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException (404) if User B attempts to delete User A collection', async () => {
      mockPrismaService.collection.findFirst.mockResolvedValue(null);

      await expect(service.remove('col-a', 'user-b')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.collection.delete).not.toHaveBeenCalled();
    });
  });
});
