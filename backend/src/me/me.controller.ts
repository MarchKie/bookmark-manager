import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { UserUserPayload } from '../auth/current-user.decorator';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  @Get()
  getProfile(@CurrentUser() user: UserUserPayload) {
    return {
      sub: user.sub,
      email: user.email,
      name: user.name,
      picture: user.picture,
    };
  }
}
