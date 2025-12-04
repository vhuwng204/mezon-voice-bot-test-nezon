import { CallToolResponse } from "../mcp/tools/callTools";
import { ACCESS_LEVEL } from "./bot";
import { Voice } from "./entity/voice.entity";

export class CreateVoiceDto {
    voicePath: string;
    voiceName: string;
    voiceType: ACCESS_LEVEL;
    textRef?: string;    
    createdAt: number;
    updatedAt: number;
}

export class CreateUserVoiceDto {
    voiceId: Voice;
    mezonUserId: string;
    mezonUserName: string;
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