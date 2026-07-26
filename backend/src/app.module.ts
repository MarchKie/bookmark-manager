import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MeModule } from './me/me.module';
import { CollectionsModule } from './collections/collections.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MeModule,
    CollectionsModule,
    BookmarksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
