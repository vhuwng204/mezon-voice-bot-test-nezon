import { Controller, Post, Body, Get } from "@nestjs/common";
import { VoiceBotService } from "./voice_bot.service";
import { WebhookDto } from "./voice_bot.dto";

@Controller('voice-bot')
export class VoiceBotController {
    constructor(private readonly voiceBotService: VoiceBotService) {}

    @Post('webhook')
    async handleWebhook(@Body() webhookDto: WebhookDto) {
        console.log(webhookDto);
        return this.voiceBotService.handleSendAudioToChannel(webhookDto);
    }
}