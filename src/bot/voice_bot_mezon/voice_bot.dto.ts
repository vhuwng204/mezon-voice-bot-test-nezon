import { CallToolResponse } from "../mcp/tools/callTools";
import { ACCESS_LEVEL } from "./bot";

export class RegisterVoiceDto {
    mezonUserId: string;
    voicePath: string;
    voiceName: string;
    isPrivate: ACCESS_LEVEL;
    isDefault?: boolean;
    createdBy: string;
    createdAt: number;
    updatedAt: number;
}


export class MCPResponseDto {
    result: CallToolResponse['result'] | null;
    error: unknown | null;
}