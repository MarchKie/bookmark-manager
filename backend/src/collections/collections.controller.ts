import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { PatchCollectionDto } from './dto/patch-collection.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('collections')
@UseGuards(JwtAuthGuard)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  findAll(@CurrentUser('sub') ownerId: string) {
    return this.collectionsService.findAll(ownerId);
  }

  @Post()
  create(
    @Body() dto: CreateCollectionDto,
    @CurrentUser('sub') ownerId: string,
  ) {
    return this.collectionsService.create(dto, ownerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('sub') ownerId: string) {
    return this.collectionsService.findOne(id, ownerId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCollectionDto,
    @CurrentUser('sub') ownerId: string,
  ) {
    return this.collectionsService.update(id, dto, ownerId);
  }

  @Patch(':id')
  patch(
    @Param('id') id: string,
    @Body() dto: PatchCollectionDto,
    @CurrentUser('sub') ownerId: string,
  ) {
    return this.collectionsService.patch(id, dto, ownerId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser('sub') ownerId: string) {
    return this.collectionsService.remove(id, ownerId);
  }

  @Get(':id/bookmarks')
  findBookmarks(
    @Param('id') id: string,
    @CurrentUser('sub') ownerId: string,
  ) {
    return this.collectionsService.findBookmarks(id, ownerId);
  }
}
