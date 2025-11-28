import { Controller, Post, Body, Res } from "@nestjs/common";
import { VoiceBotService } from "./voice_bot.service";
import { RunPodWebhookResponseDto, WebhookDto } from "./voice_bot.dto";

@Controller('voice-bot')
export class VoiceBotController {
    constructor(private readonly voiceBotService: VoiceBotService) {}

    @Post('webhook')
    async handleWebhook(@Body() runPodWebhook: RunPodWebhookResponseDto, @Res() res) {
        const output = runPodWebhook?.output?.output;
        
        if (!output?.channel_id || !output?.message_id || !output?.clan_id) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const webhookDto: WebhookDto = {
            channelId: output.channel_id,
            messageId: output.message_id,
            clanId: output.clan_id,
            audioPath: output.cdn_url || '',
            fileSize: output.file_size || 0,
            fileType: 'audio/wav',
        };
        await this.voiceBotService.handleSendAudioToChannel(webhookDto);
        return res.status(200).json({ success: true, message: 'Audio sent to channel' });
    }
}
