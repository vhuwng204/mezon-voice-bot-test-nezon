import { CallToolResponse } from "../mcp/tools/callTools";
import { ACCESS_LEVEL } from "./bot";

export class RegisterVoiceDto {
    mezonUserId: string;
    mezonUserName: string;
    voicePath: string;
    voiceName: string;
    isPrivate: ACCESS_LEVEL;
    textRef?: string;    
    isDefault?: boolean;
    createdAt: number;
    updatedAt: number;
}


export class MCPResponseDto {
    result: CallToolResponse['result'] | null;
    error: unknown | null;
}

export class WebhookDto {
    channelId: string;
    clanId: string;
    messageId: string;
    audioPath: string;
    fileSize: number;
    fileType: string;
}
export class RunPodWebhookResponseDto {
    output: {
        output: {
            audio_deleted?: boolean;
            audio_path?: string | null;
            cdn_url?: string;
            channel_id: string;
            message_id: string;
            clan_id: string;
            file_size: number;
            [key: string]: any;
        };
        status: string;
    };
    status: string;
    webhook?: string;
}