import { Repository } from "typeorm";
import { Injectable } from "@nestjs/common";
import { AutoContext, Nezon, SmartMessage } from "@n0xgg04/nezon";
import { ACCESS_LEVEL } from "./bot";
import { RegisterVoiceDto } from "./voice_bot.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { CallTool } from "../mcp/tools/callTools";
import { UserVoice } from "./user_voice.entity";
@Injectable()
export class VoiceBotService {
    constructor(
        @InjectRepository(UserVoice)
        private readonly userVoiceRepository: Repository<UserVoice>,
        private readonly callTool: CallTool,
    ) {
    }

    private async cloneVoice(user_id: string, voiceName: string, @AutoContext('message') message: Nezon.AutoContextType.Message) {
        const originalVoice = await this.userVoiceRepository.findOne({ where: { voiceName: voiceName } });
        if (!originalVoice) {
            return message.reply(SmartMessage.system(`Voice ${voiceName} not found.`));
        }
        let isDefault = false;
        if (!await this.userVoiceRepository.findOne({ where: { mezonUserId: user_id, isDefault: true } })) {
            isDefault = true;
        }

        const clonedVoiceDto: RegisterVoiceDto = {
            mezonUserId: user_id,
            voicePath: originalVoice.voicePath,
            voiceName: originalVoice.voiceName,
            isPrivate: originalVoice.isPrivate,
            isDefault: isDefault,
            createdBy: originalVoice.createdBy,
            createdAt: new Date().getTime(),
            updatedAt: new Date().getTime(),
        };
        await this.userVoiceRepository.insert([clonedVoiceDto]);
        await this.userVoiceRepository.increment({ id: originalVoice.id }, 'numberUsage', 1);
        return message.reply(SmartMessage.system(`Voice ${originalVoice.voiceName} cloned successfully.`));
    }

    private async registerVoice(registerVoiceDto: RegisterVoiceDto, @AutoContext('message') message: Nezon.AutoContextType.Message) {
        const userVoice = await this.userVoiceRepository.findOne({ where: { voiceName: registerVoiceDto.voiceName } });
        if (userVoice) {
            return message.reply(SmartMessage.system(`Voice ${registerVoiceDto.voiceName} already registered.`));
        }
        if (!await this.userVoiceRepository.findOne({ where: { mezonUserId: registerVoiceDto.mezonUserId, isDefault: true } })) {
            registerVoiceDto.isDefault = true;
        }
        const newUserVoice = this.userVoiceRepository.create(registerVoiceDto);
        await this.userVoiceRepository.save(newUserVoice).then(async () => {
            return message.reply(SmartMessage.system(`Voice ${registerVoiceDto.voiceName} registered successfully.`));
        });
    }

    async handleRegisterVoice(user_id: string, message_content: string, voice_path: string, @AutoContext('message') message: Nezon.AutoContextType.Message) {
        let parts = message_content.trim().split(/\s+/);
        let command = parts.shift();
        let type = parts.shift();
        let voiceName = parts.join(' ');
        console.log(command, type, voiceName);
        if (!command || !type || !voiceName) {
            return message.reply(SmartMessage.system(`Register voice command syntax: *register_voice <private|public> <voice_name>`));
        }
        if (type !== ACCESS_LEVEL.PRIVATE && type !== ACCESS_LEVEL.PUBLIC) {
            return message.reply(SmartMessage.system(`Invalid voice type: ${type}. Valid types are ${ACCESS_LEVEL.PRIVATE} and ${ACCESS_LEVEL.PUBLIC}`));
        }
        if (!voiceName) {
            return message.reply(SmartMessage.system(`Voice name is required. Please provide a voice name.`));
        }
        const registerVoiceDto: RegisterVoiceDto = {
            mezonUserId: user_id,
            voicePath: voice_path,
            voiceName: voiceName,
            isPrivate: type === ACCESS_LEVEL.PRIVATE ? ACCESS_LEVEL.PRIVATE : ACCESS_LEVEL.PUBLIC,
            createdBy: user_id,
            createdAt: new Date().getTime(),
            updatedAt: new Date().getTime(),
        };
        return this.registerVoice(registerVoiceDto, message);
    }

    async handleListVoices(@AutoContext('message') message: Nezon.AutoContextType.Message) {
        const voices = await this.userVoiceRepository.find({ order: { numberUsage: 'DESC' } });
        if (voices.length === 0) {
            return message.reply(SmartMessage.system(`You have no voices`));
        }

        const sorted = voices.sort((a, b) => {
            const aPublic = a.isPrivate === ACCESS_LEVEL.PUBLIC ? 0 : 1;
            const bPublic = b.isPrivate === ACCESS_LEVEL.PUBLIC ? 0 : 1;
            return aPublic - bPublic;
        });

        const lines = sorted.map((v) => `[${v.isPrivate}] ${v.id} - ${v.voiceName}`);
        const header = `List of voices:`;
        return message.reply(SmartMessage.system(`${header}\n${lines.join('\n')}`));
    }

    async handleCloneVoice(user_id: string, message_content: string, @AutoContext('message') message: Nezon.AutoContextType.Message) {
        let parts = message_content.trim().split(/\s+/);
        let command = parts.shift();
        let voiceName = parts.join(' ');
        if (!command || !voiceName) {
            return message.reply(SmartMessage.system(`Clone voice command syntax: *clone_voice <voice_name>`));
        }
        return this.cloneVoice(user_id, voiceName, message);
    }

    async setDefaultVoice(user_id: string, voiceName: string) {
        const userVoice = await this.userVoiceRepository.findOne({ where: { voiceName: voiceName, mezonUserId: user_id } });
        if (!userVoice) {
            return null;
        }
        const currentDefaultVoice = await this.userVoiceRepository.findOne({ where: { isDefault: true, mezonUserId: user_id } });
        if (currentDefaultVoice) {
            currentDefaultVoice.isDefault = false;
            await this.userVoiceRepository.save(currentDefaultVoice);
        }
        userVoice.isDefault = true;
        await this.userVoiceRepository.save(userVoice);
        return true;
    }

    async handleSetDefaultVoice(user_id: string, message_content: string, @AutoContext('message') message: Nezon.AutoContextType.Message) {
        let parts = message_content.trim().split(/\s+/);
        let command = parts.shift();
        let voiceName = parts.join(' ');
        if (!command || !voiceName) {
            return message.reply(SmartMessage.system(`Set default voice command syntax: *set_default <voice_name>`));
        }
        const result = await this.setDefaultVoice(user_id, voiceName);
        if (!result) {
            return message.reply(SmartMessage.system(`Voice ${voiceName} not found.`));
        }
        return message.reply(SmartMessage.system(`Voice ${voiceName} set default successfully.`));
    }

    async handleGetUserVoiceList(user_id: string, @AutoContext('message') message: Nezon.AutoContextType.Message) {
        const userVoiceList = await this.userVoiceRepository.find({ where: { mezonUserId: user_id } });
        if (userVoiceList.length === 0) {
            return message.reply(SmartMessage.system(`You have no voices.`));
        }
        const priority = (voice: UserVoice) => voice.isDefault ? 0 : voice.isPrivate === ACCESS_LEVEL.PUBLIC ? 1 : 2;
        const typeLabel = (voice: UserVoice) => voice.isPrivate === ACCESS_LEVEL.PUBLIC ? `[PUBLIC]` : `[PRIVATE]`;
        const orderedVoices = [...userVoiceList].sort((a, b) => priority(a) - priority(b));
        const lines = orderedVoices.map((voice, index) => {
            const defaultLabel = voice.isDefault ? `[DEFAULT]` : ``;
            const labels = `${defaultLabel}${typeLabel(voice)}`;
            return `${index + 1}. ${labels} ${voice.voiceName}`;
        });
        return message.reply(SmartMessage.system(`Your voices:\n${lines.join('\n')}`));
    }

    async setVoicePrivate(user_id: string, voiceName: string) {
        const userVoice = await this.userVoiceRepository.findOne({ where: { voiceName: voiceName, mezonUserId: user_id } });
        if (!userVoice) {
            return null;
        }
        userVoice.isPrivate = ACCESS_LEVEL.PRIVATE;
        await this.userVoiceRepository.save(userVoice);
        return true;
    }
    async handleSetVoicePrivate(user_id: string, message_content: string, @AutoContext('message') message: Nezon.AutoContextType.Message) {
        let parts = message_content.trim().split(/\s+/);
        let command = parts.shift();
        let voiceName = parts.join(' ');
        if (!command || !voiceName) {
            return message.reply(SmartMessage.system(`Change voice type command syntax: *set_private <voice_name>`));
        }
        const result = await this.setVoicePrivate(user_id, voiceName);
        if (!result) {
            return message.reply(SmartMessage.system(`Voice ${voiceName} not found.`));
        }
        return message.reply(SmartMessage.system(`Voice ${voiceName} set private successfully.`));
    }

    async handleSetVoicePublic(user_id: string, message_content: string, @AutoContext('message') message: Nezon.AutoContextType.Message) {
        let parts = message_content.trim().split(/\s+/);
        let command = parts.shift();
        let voiceName = parts.join(' ');
        console.log(command, voiceName);
        if (!command || !voiceName) {
            return message.reply(SmartMessage.system(`Set voice public command syntax: *set_public <voice_name>`));
        }
        const result = await this.setVoicePublic(user_id, voiceName);
        if (!result) {
            return message.reply(SmartMessage.system(`Voice ${voiceName} not found.`));
        }
        return message.reply(SmartMessage.system(`Voice ${voiceName} set public successfully.`));
    }
    async setVoicePublic(user_id: string, voiceName: string) {
        const userVoice = await this.userVoiceRepository.findOne({ where: { voiceName: voiceName, mezonUserId: user_id } });
        if (!userVoice) {
            return null;
        }
        userVoice.isPrivate = ACCESS_LEVEL.PUBLIC;
        await this.userVoiceRepository.save(userVoice);
        return true;
    }

    async handlePlayAudio(user_id: string, message_content: string, @AutoContext('message') message: Nezon.AutoContextType.Message) {
        let parts = message_content.trim().split(/\s+/);
        let command = parts.shift();
        let text = parts.join(' ');
        if (!command || !text) {
            return message.reply(SmartMessage.system(`Play audio command syntax: *play_audio <text>`));
        }
        const callResponse = await this.callTool.callTool({
            name: 'tts_gemini_single',
            arguments: {
                request: {
                    text,
                    voice: "Zephyr",
                }
            }
        });
        if (callResponse.error) {
            return message.reply(SmartMessage.system(`Error playing audio`));
        }
        const textChunk = callResponse.result?.content?.find((item) => item.type === 'text');
        const payload = textChunk ? JSON.parse(textChunk.text) : null;
        const audioPath = payload?.audio_path;
        if (!audioPath) {
            return message.reply(SmartMessage.system(`Audio path not found.`));
        }
        return message.reply(SmartMessage.voice(audioPath));

    }
}