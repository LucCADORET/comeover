export class ChatMessage {
    username: string;
    color: string;
    content: string;
    timestamp: string;

    constructor(data: any) {
        this.username = data.username;
        this.content = data.content;
        this.timestamp = data.timestamp;
        this.color = data.color;
    }
}