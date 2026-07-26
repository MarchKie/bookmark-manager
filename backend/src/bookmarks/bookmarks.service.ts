import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';
import { PatchBookmarkDto } from './dto/patch-bookmark.dto';
import { BookmarkFilterDto } from './dto/bookmark-filter.dto';
import { CollectionsService } from '../collections/collections.service';

@Injectable()
export class BookmarksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly collectionsService: CollectionsService,
  ) {}

  async findAll(ownerId: string, filterDto: BookmarkFilterDto) {
    return this.prisma.bookmark.findMany({
      where: {
        ownerId,
        ...(filterDto.collectionId && { collectionId: filterDto.collectionId }),
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, ownerId: string) {
    const bookmark = await this.prisma.bookmark.findFirst({
      where: { id, ownerId },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!bookmark) {
      throw new NotFoundException(`Bookmark with ID "${id}" not found`);
    }

    return bookmark;
  }

  async create(dto: CreateBookmarkDto, ownerId: string) {
    // If collectionId is provided, verify it exists and belongs to this user
    if (dto.collectionId) {
      await this.collectionsService.findOne(dto.collectionId, ownerId);
    }

    return this.prisma.bookmark.create({
      data: {
        url: dto.url,
        title: dto.title,
        notes: dto.notes,
        collectionId: dto.collectionId,
        ownerId,
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateBookmarkDto, ownerId: string) {
    await this.findOne(id, ownerId);

    if (dto.collectionId) {
      await this.collectionsService.findOne(dto.collectionId, ownerId);
    }

    return this.prisma.bookmark.update({
      where: { id },
      data: {
        url: dto.url,
        title: dto.title,
        notes: dto.notes,
        collectionId: dto.collectionId,
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async patch(id: string, dto: PatchBookmarkDto, ownerId: string) {
    await this.findOne(id, ownerId);

    if (dto.collectionId) {
      await this.collectionsService.findOne(dto.collectionId, ownerId);
    }

    return this.prisma.bookmark.update({
      where: { id },
      data: {
        ...(dto.url !== undefined && { url: dto.url }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.collectionId !== undefined && { collectionId: dto.collectionId }),
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async remove(id: string, ownerId: string) {
    await this.findOne(id, ownerId);

    await this.prisma.bookmark.delete({
      where: { id },
    });
  }
}
