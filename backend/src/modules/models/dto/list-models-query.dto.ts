import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListModelsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tagId?: number;

  @IsOptional()
  @IsIn(['latest', 'downloads'])
  sort?: 'latest' | 'downloads';

  @IsOptional()
  @IsIn(['DRAFT', 'PENDING', 'REVIEWING', 'PUBLISHED', 'REJECTED', 'OFFLINE'])
  status?: string;
}
