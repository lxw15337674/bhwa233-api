import { PartialType } from '@nestjs/mapped-types';
import { CreateCountDto } from './create-count.dto';

export class UpdateCountDto extends PartialType(CreateCountDto) {
  id: string;
}
