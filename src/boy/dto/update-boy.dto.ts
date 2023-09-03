import { PartialType } from '@nestjs/mapped-types';
import { CreateBoyDto } from './create-boy.dto';

export class UpdateBoyDto extends PartialType(CreateBoyDto) {}
