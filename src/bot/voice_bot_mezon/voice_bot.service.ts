import { Repository } from "typeorm";
import { Injectable } from "@nestjs/common";
import { AutoContext, Message, Nezon, SmartMessage } from "@n0xgg04/nezon";
import { ACCESS_LEVEL } from "./bot";
import { RegisterVoiceDto } from "./voice_bot.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { CallTool } from "../mcp/tools/callTools";
import { UserVoice } from "./user_voice.entity";
import { EMarkdownType } from "mezon-sdk";
import * as fs from "fs";
import * as path from "path";
@Injectable()
export class VoiceBotService {
    constructor(
        @InjectRepository(UserVoice)
        private readonly userVoiceRepository: Repository<UserVoice>,
        private readonly callTool: CallTool,
    ) {
    } 

    private async deleteVoice(voiceName: string, user_id: string): Promise<boolean> {
        const response = await this.userVoiceRepository.delete({
            voiceName: voiceName,
            mezonUserId: user_id
        });

        return response.affected > 0;
    }

    async handleRegisterVoice(
        user_id: string,
        display_name: string,
        message_content: string,
        voice_path: string,
        @AutoContext('message') message: Nezon.AutoContextType.Message
    ) {
        const parts = message_content.trim().split(/\s+/);
    
        if (parts.length !== 3) {
            return message.reply(
                SmartMessage.system(`Sai cú pháp. Đúng là: *register_voice <private|public> <voice_name>`)
            );
        }
    
        const type = parts[1];
        const voiceName = parts[2];
    
        if (type !== ACCESS_LEVEL.PRIVATE && type !== ACCESS_LEVEL.PUBLIC) {
            return message.reply(
                SmartMessage.system(
                    `Invalid voice type: ${type}. Valid types: ${ACCESS_LEVEL.PRIVATE}, ${ACCESS_LEVEL.PUBLIC}`
                )
            );
        }
    
        const validVoiceNameRegex = /^[a-zA-Z0-9_]+$/;
    
        if (!validVoiceNameRegex.test(voiceName)) {
            return message.reply(
                SmartMessage.system(
                    `Voice name không hợp lệ. Chỉ được chứa ký tự không dấu + không khoảng cách.`
                )
            );
        }
        
       
        const registerVoiceDto: RegisterVoiceDto = {
            mezonUserId: user_id,
            mezonUserName: display_name,
            voicePath: voice_path,
            voiceName: voiceName,
            isPrivate: type === ACCESS_LEVEL.PRIVATE ? ACCESS_LEVEL.PRIVATE : ACCESS_LEVEL.PUBLIC,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        if (!await this.userVoiceRepository.findOne({ where: { mezonUserId: user_id, isDefault: true } })) {
            registerVoiceDto.isDefault = true;
        }
        const response = await this.userVoiceRepository.save(registerVoiceDto);
    
        if (response) {
            response.voiceName = `${voiceName}_${response.id}`;
            await this.userVoiceRepository.save(response);
            return message.reply(
                SmartMessage.system(`Voice ${response.voiceName} registered successfully.`)
            );
        }
    
        return message.reply(
            SmartMessage.system(`Failed to register voice ${registerVoiceDto.voiceName}.`)
        );
    }
    

    async handleListVoices(user_id: string, @AutoContext('message') message: Nezon.AutoContextType.Message) {
        let replyText = "";
    
        const voices = await this.userVoiceRepository.find({
            where: { mezonUserId: user_id },
            order: { numberUsage: 'DESC' }
        });
    
        if (voices.length > 0) {
            replyText += "Các giọng của bạn:\n";
            replyText += voices
                .map((v) => {
                    const defaultTag = v.isDefault ? "[default]" : "";
                    const userNameTag = v.mezonUserName ? `[${v.mezonUserName}]` : "";
                    return `[${v.isPrivate}] ${v.id} ${v.voiceName} ${defaultTag} ${userNameTag}`.trim();
                })
                .join("\n");
            replyText += "\n\n";
        }
    
        const topVoices = await this.userVoiceRepository.find({
            where: { isPrivate: ACCESS_LEVEL.PUBLIC },
            order: { numberUsage: 'DESC' },
            take: 5,
        });
    
        replyText += "Các giọng đang hot hiện nay:\n";
        replyText += topVoices
            .map((v) => {
                const byWho = v.mezonUserId === user_id ? "[by me]" : `[by ${v.mezonUserName}]`;
                return `[${v.isPrivate}] ${v.id} ${v.voiceName} ${byWho} (${v.numberUsage} usages)`;
            })
            .join("\n");
    
        return message.reply(SmartMessage.system(replyText));
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
        let voiceName = "";
        const userDefaultVoice = await this.userVoiceRepository.findOne({ where: { mezonUserId: user_id, isDefault: true } });
        if (!userDefaultVoice) {
            let publicVoices = await this.userVoiceRepository.find({ where: { mezonUserId: user_id, isPrivate: ACCESS_LEVEL.PUBLIC } });
            if (publicVoices.length > 0) {
                const randomIndex = Math.floor(Math.random() * publicVoices.length);
                voiceName = publicVoices[randomIndex].voiceName;
            } else {
                voiceName = "";
            }
        } else {
            voiceName = userDefaultVoice.voiceName;
        }
        const callResponse = await this.callTool.callTool({
            name: 'tts_gemini_single',
            arguments: {
                request: {
                    text,
                    voice: voiceName,
                    file_path: userDefaultVoice?.voicePath ? userDefaultVoice.voicePath : "",
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
    
    async handleGetAudioList() {
        const callResponse = await this.callTool.callTool({
            name: 'get_audio_list',
            arguments: {
                request: {
                    page: 1,
                    limit: 100,
                    search: "",
                    sort_by: "name",
                    sort_order: "asc",
                    filter_by_type: "",
                    filter_by_voice: ""
                }
            }
        });
        console.log(callResponse.result?.content);
        return callResponse.result?.content;
    }

    async handleDeleteVoice(user_id: string, message_content: string, @AutoContext('message') message: Nezon.AutoContextType.Message) {
        let parts = message_content.trim().split(/\s+/);
        let command = parts.shift();
        let voiceName = parts.join(' ');
        if (!command || !voiceName) {
            return message.reply(SmartMessage.system(`Delete voice command syntax: *delete_voice <voice_name>`));
        }
        const result = await this.deleteVoice(voiceName, user_id);
        if (!result) {
            return message.reply(SmartMessage.system(`Voice ${voiceName} not found.`));
        }
        return message.reply(SmartMessage.system(`Voice ${voiceName} deleted successfully.`));
    }

    async handleSendHelpMessage(@Message() m: Nezon.Message) {
        const helpMessagePath = path.join(process.cwd(), 'src', 'bot', 'bot_help_message.txt');
        const helpText = fs.readFileSync(helpMessagePath, 'utf-8');

        const exampleMarkers: { s: number; e: number; type: EMarkdownType }[] = [];

        const lineRegex = /(.*?)(\r?\n|$)/g;
        const lines: { text: string; start: number; end: number }[] = [];
        let match: RegExpExecArray | null;

        while ((match = lineRegex.exec(helpText)) !== null) {
            const lineText = match[1];
            const lineStart = match.index;
            const lineEnd = lineStart + match[0].length;
            lines.push({ text: lineText, start: lineStart, end: lineEnd });

            if (!match[2]) {
                break;
            }
        }

        const isExampleLine = (text: string) =>
            text.trimStart().toLowerCase().startsWith('- ví dụ:');

        const shouldStopBlock = (text: string) => {
            const trimmed = text.trim();
            if (trimmed === '') {
                return true;
            }
            if (/^\d+\./.test(trimmed)) {
                return true;
            }
            if (trimmed.startsWith('- ') && !trimmed.toLowerCase().startsWith('- ví dụ:')) {
                return true;
            }
            return false;
        };

        for (let i = 0; i < lines.length; i++) {
            if (!isExampleLine(lines[i].text)) {
                continue;
            }

            const blockStart = lines[i].start;
            let blockEnd = lines[i].end;
            let j = i + 1;

            while (j < lines.length && !shouldStopBlock(lines[j].text)) {
                blockEnd = lines[j].end;
                j++;
            }

            exampleMarkers.push({
                s: blockStart,
                e: blockEnd,
                type: EMarkdownType.PRE,
            });
        }

        return await m.reply({
            t: helpText,
            mk: exampleMarkers,
        })
    }
}