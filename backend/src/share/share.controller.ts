import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ShareService } from './share.service';
import { CreateShareDto } from './dto/create-share.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('collections/share')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  generateShareToken(
    @Body() dto: CreateShareDto,
    @CurrentUser('sub') ownerId: string,
  ) {
    return this.shareService.generateShareToken(dto, ownerId);
  }

  @Get(':token')
  getSharedCollection(@Param('token') token: string) {
    return this.shareService.getSharedCollection(token);
  }

  @Delete(':token')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  revokeShareToken(
    @Param('token') token: string,
    @CurrentUser('sub') ownerId: string,
  ) {
    return this.shareService.revokeShareToken(token, ownerId);
  }
}
