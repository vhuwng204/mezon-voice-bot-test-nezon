import { Arg, Attachments, AutoContext, Command, MessageContent, Nezon, SmartMessage, User } from "@n0xgg04/nezon";
import { Injectable } from "@nestjs/common";
import { VoiceBotService } from "./voice_bot.service";

@Injectable()
export class VoiceBotHandler {
    constructor(private readonly voiceBotService: VoiceBotService) { }

    @Command({ name: 'register_voice' })
    async onRegisterVoice(
        @User('id') user_id: string,
        @User('username') user_name: string,
        @MessageContent() message_content: string,
        @Attachments(0) attachment: Nezon.Attachment,
        @AutoContext('message') message: Nezon.AutoContextType.Message) {
        {
            if (!attachment) {
                return message.reply(SmartMessage.system(`Please attach a voice file.`));
            }
            return this.voiceBotService.handleRegisterVoice(user_id, user_name, message_content, attachment.url, message);
        }
    }

    @Command({ name: 'list_voice' })
    async onListVoices(
        @User('id') user_id: string,
        @AutoContext('message') message: Nezon.AutoContextType.Message) {
        return this.voiceBotService.handleListVoices(user_id, message);
    }

    @Command({ name: 'set_default' })
    async onSetDefaultVoice(
        @User('id') user_id: string,
        @MessageContent() message_content: string,
        @AutoContext('message') message: Nezon.AutoContextType.Message) {
        return this.voiceBotService.handleSetDefaultVoice(user_id, message_content, message);
    }

    @Command({ name: 'set_private' })
    async onSetPrivateVoice(
        @User('id') user_id: string,
        @MessageContent() message_content: string,
        @AutoContext('message') message: Nezon.AutoContextType.Message) {
        return this.voiceBotService.handleSetVoicePrivate(user_id, message_content, message);
    }

    @Command({ name: 'set_public' })
    async onSetPublicVoice(
        @User('id') user_id: string,
        @MessageContent() message_content: string,
        @AutoContext('message') message: Nezon.AutoContextType.Message) {
        return this.voiceBotService.handleSetVoicePublic(user_id, message_content, message);
    }

    @Command({ name: 'play_audio' })
    async onPlayAudio(
        @User('id') user_id: string,
        @MessageContent() message_content: string,
        @AutoContext('message') message: Nezon.AutoContextType.Message) {
        return this.voiceBotService.handlePlayAudio(user_id, message_content, message);
    }

    @Command({ name: 'delete_voice' })
    async onDeleteVoice(
        @User('id') user_id: string,
        @MessageContent() message_content: string,
        @AutoContext('message') message: Nezon.AutoContextType.Message) {
        return this.voiceBotService.handleDeleteVoice(user_id, message_content, message);
    }

    @Command({ name: 'Mezon_Voice_Bot', prefix:"@" })
    async onSendHelpMessageInit(
        @AutoContext('message') message: Nezon.AutoContextType.Message) {
        return this.voiceBotService.handleSendHelpMessage(message);
    }

    @Command({name: 'help'})
    async onSendHelpMessage(
        @AutoContext('message') message: Nezon.AutoContextType.Message) {
        return this.voiceBotService.handleSendHelpMessage(message);
    }
}