import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { PatchCollectionDto } from './dto/patch-collection.dto';

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(ownerId: string) {
    return this.prisma.collection.findMany({
      where: { ownerId },
      include: {
        _count: {
          select: { bookmarks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, ownerId: string) {
    const collection = await this.prisma.collection.findFirst({
      where: { id, ownerId },
      include: {
        _count: {
          select: { bookmarks: true },
        },
      },
    });

    if (!collection) {
      throw new NotFoundException(`Collection with ID "${id}" not found`);
    }

    return collection;
  }

  async create(dto: CreateCollectionDto, ownerId: string) {
    return this.prisma.collection.create({
      data: {
        name: dto.name,
        ownerId,
      },
    });
  }

  async update(id: string, dto: UpdateCollectionDto, ownerId: string) {
    await this.findOne(id, ownerId);

    return this.prisma.collection.update({
      where: { id },
      data: {
        name: dto.name,
      },
    });
  }

  async patch(id: string, dto: PatchCollectionDto, ownerId: string) {
    await this.findOne(id, ownerId);

    return this.prisma.collection.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
      },
    });
  }

  async remove(id: string, ownerId: string) {
    await this.findOne(id, ownerId);

    await this.prisma.collection.delete({
      where: { id },
    });
  }

  async findBookmarks(id: string, ownerId: string) {
    // Verify collection exists and belongs to the authenticated user
    await this.findOne(id, ownerId);

    return this.prisma.bookmark.findMany({
      where: { collectionId: id, ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
