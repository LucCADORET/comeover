import { MessageTypeEnum } from '../enums/messageTypeEnum';
import { UserData } from './userData';
import { ChatMessage } from './chatMessage';
import { Chunk } from './chunk';
import { Manifest } from './manifest';

export class Message {
    type: MessageTypeEnum;
    data: UserData | ChatMessage | Manifest;

    constructor(message: any) {
        this.type = message.type;
        if (this.type == MessageTypeEnum.PING) {
            this.data = new UserData(message.data);
        } else if (this.type == MessageTypeEnum.CHAT) {
            this.data = new ChatMessage(message.data);
        } else if (this.type == MessageTypeEnum.MANIFEST) {
            this.data = new Manifest(message.data)
        }
    }
}