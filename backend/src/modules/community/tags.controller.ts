import { Controller, Get, Query } from '@nestjs/common';
import { CommunityService } from './community.service';

@Controller('tags')
export class TagsController {
  constructor(private readonly communityService: CommunityService) {}

  @Get()
  listTags(@Query('q') q?: string) {
    return this.communityService.listTags(q);
  }
}
