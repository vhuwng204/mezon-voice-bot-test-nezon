import { Controller, Get, Post, Body } from "@nestjs/common";
import { ListTools } from "./tools/listTools";
import { CallTool, CallToolParams } from "./tools/callTools";
import { VoiceBotService } from "../voice_bot_mezon/voice_bot.service";
@Controller('mcp')
export class MCPController {
    constructor(private readonly listTools: ListTools, private readonly callTool: CallTool, private readonly voiceBotService: VoiceBotService) {}

    @Get('list-tools')
    async handleGetListTools() {
        return this.listTools.getListTool();
    }

    @Post('call-tool')
    async handleCallTool(@Body() body: CallToolParams) {
        return this.callTool.callTool(body);
    }

    @Get('get-audio-list')
    async handleGetAudioList() {
        return this.voiceBotService.handleGetAudioList();
    }
}