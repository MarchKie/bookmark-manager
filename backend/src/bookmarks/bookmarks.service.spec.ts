import { Test, TestingModule } from '@nestjs/testing';
import { BookmarksService } from './bookmarks.service';
import { PrismaService } from '../prisma/prisma.service';
import { CollectionsService } from '../collections/collections.service';
import { NotFoundException } from '@nestjs/common';

describe('BookmarksService', () => {
  let service: BookmarksService;
  let prisma: PrismaService;
  let collectionsService: CollectionsService;

  const mockPrismaService = {
    bookmark: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockCollectionsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookmarksService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CollectionsService, useValue: mockCollectionsService },
      ],
    }).compile();

    service = module.get<BookmarksService>(BookmarksService);
    prisma = module.get<PrismaService>(PrismaService);
    collectionsService = module.get<CollectionsService>(CollectionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should verify collection ownership when collectionId is provided', async () => {
      const dto = {
        url: 'https://nestjs.com',
        title: 'NestJS',
        collectionId: 'col-a',
      };
      mockCollectionsService.findOne.mockResolvedValue({
        id: 'col-a',
        ownerId: 'user-a',
      });
      mockPrismaService.bookmark.create.mockResolvedValue({
        id: 'bm-1',
        ...dto,
        ownerId: 'user-a',
      });

      const result = await service.create(dto, 'user-a');
      expect(collectionsService.findOne).toHaveBeenCalledWith(
        'col-a',
        'user-a',
      );
      expect(result.id).toBe('bm-1');
    });

    it('should throw NotFoundException (404) if target collection belongs to another user', async () => {
      const dto = {
        url: 'https://nestjs.com',
        title: 'NestJS',
        collectionId: 'col-b',
      };
      mockCollectionsService.findOne.mockRejectedValue(
        new NotFoundException(),
      );

      await expect(service.create(dto, 'user-a')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.bookmark.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException (404) if bookmark belongs to another user', async () => {
      mockPrismaService.bookmark.findFirst.mockResolvedValue(null);

      await expect(service.findOne('bm-b', 'user-a')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
