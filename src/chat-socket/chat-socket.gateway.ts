import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer } from '@nestjs/websockets';
import { ChatSocketService } from './chat-socket.service';
import { CreateChatSocketDto } from './dto/create-chat-socket.dto';
import { UpdateChatSocketDto } from './dto/update-chat-socket.dto';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: true
})
export class ChatSocketGateway {  
  constructor(private readonly chatSocketService: ChatSocketService) {}
  @WebSocketServer()
  server: Server;
  
  @SubscribeMessage('createChatSocket')
  create(@MessageBody() createChatSocketDto: CreateChatSocketDto) {
    return this.chatSocketService.create(createChatSocketDto);
  }

  @SubscribeMessage('findAllChatSocket')
  findAll(client: Socket, data: string) {
    client.broadcast.emit('message', data);
    return this.chatSocketService.findAll();
  }

  @SubscribeMessage('findOneChatSocket')
  findOne(@MessageBody() id: number) {
    return this.chatSocketService.findOne(id);
  }

  @SubscribeMessage('updateChatSocket')
  update(@MessageBody() updateChatSocketDto: UpdateChatSocketDto) {
    return this.chatSocketService.update(updateChatSocketDto.id, updateChatSocketDto);
  }

  @SubscribeMessage('removeChatSocket')
  remove(@MessageBody() id: number) {
    return this.chatSocketService.remove(id);
  }
}
