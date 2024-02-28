import { PartialType } from '@nestjs/swagger';
import { CreateFishingTimeDto } from './create-fishing-time.dto';

export class UpdateFishingTimeDto extends PartialType(CreateFishingTimeDto) {}
