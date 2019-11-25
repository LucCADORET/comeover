import { MessageTypeEnum } from '../enums/messageTypeEnum';
import { UserData } from './userData';
import { ChatMessage } from './chatMessage';

export class Message {
    type: MessageTypeEnum;
    data: UserData | ChatMessage;

    constructor(message: any) {
        this.type = message.type;
        if (this.type == MessageTypeEnum.PING) {
            this.data = new UserData(message.data);
        } else if (this.type == MessageTypeEnum.CHAT) {
            this.data = new ChatMessage(message.data);
        }
    }
}