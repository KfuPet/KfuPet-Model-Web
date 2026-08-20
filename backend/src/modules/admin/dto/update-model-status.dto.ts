import { IsEnum } from 'class-validator';
import { PackageStatus } from '../../../generated/prisma/client';

export class UpdateModelStatusDto {
  @IsEnum(PackageStatus)
  status: PackageStatus;
}
