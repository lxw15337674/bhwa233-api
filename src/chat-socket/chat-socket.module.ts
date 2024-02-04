import { Module } from '@nestjs/common';
import { ChatSocketService } from './chat-socket.service';
import { ChatSocketGateway } from './chat-socket.gateway';

@Module({
  providers: [ChatSocketGateway, ChatSocketService]
})
export class ChatSocketModule {}
