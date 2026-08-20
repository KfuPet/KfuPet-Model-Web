import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateVersionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  version: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  changelog?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  minKfuPetVersion?: string;
}
