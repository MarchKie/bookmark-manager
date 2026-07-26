import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';
import { PatchBookmarkDto } from './dto/patch-bookmark.dto';
import { BookmarkFilterDto } from './dto/bookmark-filter.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Get()
  findAll(
    @CurrentUser('sub') ownerId: string,
    @Query() filterDto: BookmarkFilterDto,
  ) {
    return this.bookmarksService.findAll(ownerId, filterDto);
  }

  @Post()
  create(
    @Body() dto: CreateBookmarkDto,
    @CurrentUser('sub') ownerId: string,
  ) {
    return this.bookmarksService.create(dto, ownerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('sub') ownerId: string) {
    return this.bookmarksService.findOne(id, ownerId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBookmarkDto,
    @CurrentUser('sub') ownerId: string,
  ) {
    return this.bookmarksService.update(id, dto, ownerId);
  }

  @Patch(':id')
  patch(
    @Param('id') id: string,
    @Body() dto: PatchBookmarkDto,
    @CurrentUser('sub') ownerId: string,
  ) {
    return this.bookmarksService.patch(id, dto, ownerId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser('sub') ownerId: string) {
    return this.bookmarksService.remove(id, ownerId);
  }
}
