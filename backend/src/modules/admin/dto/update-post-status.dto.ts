import { IsEnum } from 'class-validator';
import { PostStatus } from '../../../generated/prisma/client';

export class UpdatePostStatusDto {
  @IsEnum(PostStatus)
  status: PostStatus;
}
