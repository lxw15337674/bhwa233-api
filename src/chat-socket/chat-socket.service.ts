import { Injectable } from '@nestjs/common';
import { CreateChatSocketDto } from './dto/create-chat-socket.dto';
import { UpdateChatSocketDto } from './dto/update-chat-socket.dto';

@Injectable()
export class ChatSocketService {
  create(createChatSocketDto: CreateChatSocketDto) {
    return 'This action adds a new chatSocket';
  }

  findAll() {
    return `This action returns all chatSocket`;
  }

  findOne(id: number) {
    return `This action returns a #${id} chatSocket`;
  }

  update(id: number, updateChatSocketDto: UpdateChatSocketDto) {
    return `This action updates a #${id} chatSocket`;
  }

  remove(id: number) {
    return `This action removes a #${id} chatSocket`;
  }
}
