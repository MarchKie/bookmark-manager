import { IsOptional, IsUUID } from 'class-validator';

export class BookmarkFilterDto {
  @IsOptional()
  @IsUUID()
  collectionId?: string;
}
