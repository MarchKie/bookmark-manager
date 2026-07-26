import { IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateShareDto {
  @IsString()
  @IsNotEmpty()
  collectionId: string;

  @IsOptional()
  @IsPositive()
  expiresInHours?: number;
}
