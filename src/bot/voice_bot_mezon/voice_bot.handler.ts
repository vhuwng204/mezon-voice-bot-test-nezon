import { Arg, Attachments, AutoContext, Channel, Clan, Command, Message, MessageContent, Nezon, SmartMessage, User } from "@n0xgg04/nezon";
import { Injectable } from "@nestjs/common";
import { VoiceBotService } from "./voice_bot.service";

@Injectable()
export class VoiceBotHandler {
    constructor(private readonly voiceBotService: VoiceBotService) { }

    @Command({ name: 'register' })
    async onRegisterVoice(
        @User() user: Nezon.User,
        @MessageContent() message_content: string,
        @Attachments(0) attachment: Nezon.Attachment,
        @AutoContext('message') message: Nezon.AutoContextType.Message) {
        {
            if (!attachment) {
                return message.reply(SmartMessage.system(`Please attach a voice file.`));
            }
            return this.voiceBotService.handleRegisterVoice(user, message_content, attachment.url, message);
        }
    }

    @Command({ name: 'list' })
    async onGetPublicVoices(
        @AutoContext('message') message: Nezon.AutoContextType.Message) {
        return this.voiceBotService.handleGetPublicVoices(message);
    }
    @Command({ name: 'set_private' })
    async onSetPrivateVoice(
        @User('id') user_id: string,
        @Arg(0) voice_name: string,
        @AutoContext('message') message: Nezon.AutoContextType.Message) {
        return this.voiceBotService.handleSetVoicePrivate(user_id, voice_name, message);
    }

    @Command({ name: 'set_public' })
    async onSetPublicVoice(
        @User('id') user_id: string,
        @Arg(0) voice_name: string,
        @AutoContext('message') message: Nezon.AutoContextType.Message) {
        return this.voiceBotService.handleSetVoicePublic(user_id, voice_name, message);
    }

    @Command({ name: 'play' })
    async onPlayAudio(
        @User('id') user_id: string,
        @MessageContent() message_content: string,
        @Channel('id') channel_id: string,
        @Clan() clan: Nezon.Clan,
        @AutoContext('message') message: Nezon.AutoContextType.Message) {
        return this.voiceBotService.handleRequestAudioWithRunpod(user_id, message_content, channel_id, clan.id, message);
    }

    @Command({ name: 'delete' })
    async onDeleteVoice(
        @User('id') user_id: string,
        @Arg(0) voice_name: string,
        @AutoContext('message') message: Nezon.AutoContextType.Message) {
        return this.voiceBotService.handleDeleteVoice(user_id, voice_name, message);
    }

    @Command({ name: 'Mezon_Voice_Bot', prefix:"@" })
    async onSendHelpMessageInit(
        @Message() m: Nezon.Message) {
        return this.voiceBotService.handleSendHelpMessage(m);
    }

    @Command({name: 'help'})
    async onSendHelpMessage(
        @Message() m: Nezon.Message) {
        return this.voiceBotService.handleSendHelpMessage(m);
    }

    @Command({name: 'use'})
    async onUseVoice(
        @User() user: Nezon.User,
        @Arg(0) query: string,
        @AutoContext('message') message: Nezon.AutoContextType.Message) {
        return this.voiceBotService.handleUseVoice(user, query, message);
    }

}