import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShareDto } from './dto/create-share.dto';
import * as crypto from 'crypto';

@Injectable()
export class ShareService {
  constructor(private readonly prisma: PrismaService) {}

  async generateShareToken(dto: CreateShareDto, ownerId: string) {
    // 1. Verify collection exists and belongs strictly to ownerId
    const collection = await this.prisma.collection.findFirst({
      where: {
        id: dto.collectionId,
        ownerId,
      },
    });

    if (!collection) {
      throw new NotFoundException(`Collection with ID "${dto.collectionId}" not found`);
    }

    // 2. Compute optional expiration date
    let expiresAt: Date | null = null;
    if (dto.expiresInHours && dto.expiresInHours > 0) {
      expiresAt = new Date(Date.now() + dto.expiresInHours * 3600 * 1000);
    }

    // 3. Upsert CollectionShare - generating a fresh token invalidates any prior link
    const newShareToken = crypto.randomUUID();
    const share = await this.prisma.collectionShare.upsert({
      where: { collectionId: dto.collectionId },
      create: {
        collectionId: dto.collectionId,
        shareToken: newShareToken,
        expiresAt,
      },
      update: {
        shareToken: newShareToken,
        expiresAt,
      },
    });

    return {
      id: share.id,
      collectionId: share.collectionId,
      shareToken: share.shareToken,
      expiresAt: share.expiresAt,
      createdAt: share.createdAt,
      updatedAt: share.updatedAt,
    };
  }

  async getSharedCollection(shareToken: string) {
    const share = await this.prisma.collectionShare.findUnique({
      where: { shareToken },
      include: {
        collection: {
          include: {
            bookmarks: {
              select: {
                id: true,
                url: true,
                title: true,
                notes: true,
                createdAt: true,
                updatedAt: true,
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!share || !share.collection) {
      throw new NotFoundException(`Share link not found or expired`);
    }

    // Check expiration
    if (share.expiresAt && share.expiresAt < new Date()) {
      throw new NotFoundException(`Share link not found or expired`);
    }

    // Return sanitized read-only shape without exposing ownerId or identity
    return {
      shareToken: share.shareToken,
      expiresAt: share.expiresAt,
      collection: {
        id: share.collection.id,
        name: share.collection.name,
        createdAt: share.collection.createdAt,
        updatedAt: share.collection.updatedAt,
        bookmarks: share.collection.bookmarks,
      },
    };
  }

  async revokeShareToken(shareToken: string, ownerId: string) {
    const share = await this.prisma.collectionShare.findUnique({
      where: { shareToken },
      include: { collection: true },
    });

    // Cross-user check: if share does not exist or collection belongs to another user, return 404
    if (!share || share.collection.ownerId !== ownerId) {
      throw new NotFoundException(`Share link not found`);
    }

    await this.prisma.collectionShare.delete({
      where: { id: share.id },
    });
  }
}
