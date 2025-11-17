import { Arg, Attachments, AutoContext, Command, MessageContent, Nezon, SmartMessage, User } from "@n0xgg04/nezon";
import { Injectable } from "@nestjs/common";
import { VoiceBotService } from "./voice_bot.service";

@Injectable()
export class VoiceBotHandler {
    constructor(private readonly voiceBotService: VoiceBotService) { }

    @Command({ name: 'register_voice' })
    async onRegisterVoice(
        @User('id') user_id: string,
        @MessageContent() message_content: string,
        @Attachments(0) attachment: Nezon.Attachment,
        @AutoContext('message') message: Nezon.AutoContextType.Message) {
        {
            if (!attachment) {
                return message.reply(SmartMessage.system(`Please attach a voice file.`));
            }
            return this.voiceBotService.handleRegisterVoice(user_id, message_content, attachment.url, message);
        }
    }

    @Command({ name: 'list_voices' })
    async onListVoices(
        @AutoContext('message') message: Nezon.AutoContextType.Message) {
        return this.voiceBotService.handleListVoices(message);
    }

    @Command({ name: 'clone_voice' })
    async onCloneVoice(
        @User('id') user_id: string,
        @MessageContent() message_content: string,
        @AutoContext('message') message: Nezon.AutoContextType.Message) {
        return this.voiceBotService.handleCloneVoice(user_id, message_content, message);
    }

    @Command({ name: 'set_default' })
    async onSetDefaultVoice(
        @User('id') user_id: string,
        @MessageContent() message_content: string,
        @AutoContext('message') message: Nezon.AutoContextType.Message) {
        return this.voiceBotService.handleSetDefaultVoice(user_id, message_content, message);
    }

    @Command({ name: 'my_voices' })
    async onMyVoices(
        @User('id') user_id: string,
        @AutoContext('message') message: Nezon.AutoContextType.Message) {
        return this.voiceBotService.handleGetUserVoiceList(user_id, message);
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
}