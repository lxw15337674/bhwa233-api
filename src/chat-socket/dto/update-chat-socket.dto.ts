import { PartialType } from '@nestjs/mapped-types';
import { CreateChatSocketDto } from './create-chat-socket.dto';

export class UpdateChatSocketDto extends PartialType(CreateChatSocketDto) {
  id: number;
}
