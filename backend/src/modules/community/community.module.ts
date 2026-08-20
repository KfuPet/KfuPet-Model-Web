import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CommunityController } from './community.controller';
import { TagsController } from './tags.controller';
import { CommunityService } from './community.service';

@Module({
  imports: [AuthModule],
  controllers: [CommunityController, TagsController],
  providers: [CommunityService],
})
export class CommunityModule {}
