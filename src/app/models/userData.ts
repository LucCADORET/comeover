export class UserData {
    userId: string;
    username: string;
    color: string;
    isCreator: boolean;
    currentTime: number;
    magnet: string;
    manifest: string;
    paused: boolean;
    timestamp: number;

    constructor(data: any) {
        this.setAll(data);
    }

    setAll(data: UserData) {
        this.userId = data.userId;
        this.username = data.username;
        this.color = data.color;
        this.isCreator = data.isCreator;
        this.currentTime = data.currentTime;
        this.magnet = data.magnet;
        this.manifest = data.manifest;
        this.paused = data.paused;
        this.timestamp = data.timestamp;
    }
}