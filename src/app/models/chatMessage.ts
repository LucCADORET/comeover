export class ChatMessage {
    userId: string;
    username: string;
    color: string;
    content: string;
    timestamp: number;

    constructor(
        userId: string,
        username: string,
        color: string,
        content: string,
        timestamp: number,
    ) {
        this.userId = userId;
        this.username = username;
        this.color = color;
        this.content = content;
        this.timestamp = timestamp;
    }
}