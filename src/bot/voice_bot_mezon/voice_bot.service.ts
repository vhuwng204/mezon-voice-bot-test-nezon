import { Repository, Like, FindOptionsWhere } from "typeorm";
import { Injectable } from "@nestjs/common";
import { AutoContext, Message, Nezon, SmartMessage } from "@n0xgg04/nezon";
import { ACCESS_LEVEL } from "./bot";
import { RegisterVoiceDto, WebhookDto } from "./voice_bot.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { CallTool } from "../mcp/tools/callTools";
import { UserVoice } from "./user_voice.entity";
import { EMarkdownType } from "mezon-sdk";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import { MezonClient } from "mezon-sdk";
@Injectable()
export class VoiceBotService {
    constructor(
        @InjectRepository(UserVoice)
        private readonly userVoiceRepository: Repository<UserVoice>,
        private readonly callTool: CallTool,
        private readonly mezonClient: MezonClient,
    ) {
    }

    private readonly runpodServerUrl: string = process.env.RUNPOD_ENPOINT ?? '';
    private readonly apiKey: string = process.env.API_KEY ?? '';
    private readonly minioEndpoint: string = process.env.MINIO_ENDPOINT ?? '';
    private readonly minioAccessToken: string = process.env.MINIO_ACCESS_KEY ?? '';
    private readonly minioSecretKey: string = process.env.MINIO_SECRET_KEY ?? '';
    private readonly minioBucket: string = process.env.MINIO_BUCKET ?? '';
    private readonly minioFolder: string = process.env.MINIO_FOLDER ?? '';
    private readonly cdnUrl: string = process.env.CDN_URL ?? '';
    private readonly webhookUrl: string = process.env.WEBHOOK_URL ?? '';
    private async deleteVoice(voiceName: string, user_id: string): Promise<boolean> {
        const response = await this.userVoiceRepository.delete({
            voiceName: voiceName,
            mezonUserId: user_id
        });

        return response.affected > 0;
    }

    async handleRegisterVoice(
        user: Nezon.User,
        message_content: string,
        voice_path: string,
        @AutoContext('message') message: Nezon.AutoContextType.Message
    ) {
        const parts = message_content.trim().split(/\s+/);

        if (parts.length !== 3) {
            return message.reply(
                SmartMessage.system(`Sai cú pháp. Cú pháp đúng là: *register_voice <private|public> <voice_name>`)
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
            mezonUserId: user.id,
            mezonUserName: user.username,
            voicePath: voice_path,
            voiceName: voiceName,
            isPrivate: type === ACCESS_LEVEL.PRIVATE ? ACCESS_LEVEL.PRIVATE : ACCESS_LEVEL.PUBLIC,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        if (!await this.userVoiceRepository.findOne({ where: { mezonUserId: user.id, isDefault: true } })) {
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
            const sortedVoices = voices.slice().sort((a, b) => {
                if (a.isDefault !== b.isDefault) {
                    return a.isDefault ? -1 : 1;
                }
                if (a.isPrivate !== b.isPrivate) {
                    return a.isPrivate === ACCESS_LEVEL.PRIVATE ? -1 : 1;
                }
                return 0;
            });
            replyText += sortedVoices
                .map((v) => {
                    const defaultTag = v.isDefault ? "[default]" : "";
                    return `[${v.isPrivate}] ${v.id} ${v.voiceName} ${defaultTag}`.trim();
                })
                .join("\n");
            replyText += "\n";
        }

        const topVoices = await this.userVoiceRepository.find({
            where: { isPrivate: ACCESS_LEVEL.PUBLIC },
            order: { numberUsage: 'DESC' },
            take: 10,
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

    async handleGetPublicVoices(@AutoContext('message') message: Nezon.AutoContextType.Message) {
        let replyText = "";

        const topVoices = await this.userVoiceRepository.find({
            where: { isPrivate: ACCESS_LEVEL.PUBLIC },
            order: { numberUsage: 'DESC' },
            take: 5,
        });

        replyText += "Top available voice:\n";
        replyText += topVoices
            .map((v) => {
                return `${v.id} ${v.voiceName} (${v.numberUsage} usages)`;
            })
            .join("\n");

        return message.reply(SmartMessage.system(replyText));
    }

    async setDefaultVoice(user_id: string, voice_name: string) {
        const userVoice = await this.userVoiceRepository.findOne({ where: { voiceName: voice_name, mezonUserId: user_id } });
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

    async handleSetDefaultVoice(user_id: string, voice_name: string, @AutoContext('message') message: Nezon.AutoContextType.Message) {
        const result = await this.setDefaultVoice(user_id, voice_name);
        if (!result) {
            return message.reply(SmartMessage.system(`Voice ${voice_name} not found.`));
        }
        return message.reply(SmartMessage.system(`Voice ${voice_name} set default successfully.`));
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

    async handleSetVoicePrivate(user_id: string, voice_name: string, @AutoContext('message') message: Nezon.AutoContextType.Message) {
        const result = await this.setVoicePrivate(user_id, voice_name);
        if (!result) {
            return message.reply(SmartMessage.system(`Voice ${voice_name} not found.`));
        }
        return message.reply(SmartMessage.system(`Voice ${voice_name} set private successfully.`));
    }

    async handleSetVoicePublic(user_id: string, voice_name: string, @AutoContext('message') message: Nezon.AutoContextType.Message) {
        const result = await this.setVoicePublic(user_id, voice_name);
        if (!result) {
            return message.reply(SmartMessage.system(`Voice ${voice_name} not found.`));
        }
        return message.reply(SmartMessage.system(`Voice ${voice_name} set public successfully.`));
    }

    async setVoicePublic(user_id: string, voice_name: string) {
        const userVoice = await this.userVoiceRepository.findOne({ where: { voiceName: voice_name, mezonUserId: user_id } });
        if (!userVoice) {
            return null;
        }
        userVoice.isPrivate = ACCESS_LEVEL.PUBLIC;
        await this.userVoiceRepository.save(userVoice);
        return true;
    }

    async handleRequestAudio(user_id: string, message_content: string, channel_id: string, clan_id: string, @AutoContext('message') message: Nezon.AutoContextType.Message) {
        message.reply(SmartMessage.system(`Đang xử lý thành file âm thanh, vui lòng chờ...`));
        let parts = message_content.trim().split(/\s+/);
        let command = parts.shift();
        let text = parts.join(' ');
        let message_id = message.id;
        if (!command || !text) {
            return message.reply(SmartMessage.system(`Play audio command syntax: *play <Đoạn văn bản>`));
        }
        let voiceName = "";
        let voicePath = "";
        const userDefaultVoice = await this.userVoiceRepository.findOne({ where: { mezonUserId: user_id, isDefault: true } });
        if (!userDefaultVoice) {
            let publicVoices = await this.userVoiceRepository.find({ where: { mezonUserId: user_id, isPrivate: ACCESS_LEVEL.PUBLIC } });
            const randomIndex = Math.floor(Math.random() * publicVoices.length);
            voiceName = publicVoices[randomIndex].voiceName;
            voicePath = publicVoices[randomIndex].voicePath;
        } else {
            voiceName = userDefaultVoice.voiceName;
            voicePath = userDefaultVoice.voicePath;
        }
        const callResponse = await this.callTool.callTool({
            name: 'tts_gemini_single',
            arguments: {
                request: {
                    text,
                    voice: voiceName,
                    file_path: voicePath,
                    channel_id: channel_id,
                    clan_id: clan_id,
                    message_id: message_id,
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

    async handleRequestAudioWithRunpod(user_id: string, message_content: string, channel_id: string, clan_id: string, @AutoContext('message') message: Nezon.AutoContextType.Message) {
        let parts = message_content.trim().split(/\s+/);
        let command = parts.shift();
        let text = parts.join(' ');
        if (!command || !text) {
            return message.reply(SmartMessage.system(`Play audio command syntax: *play <Đoạn văn bản>`));
        }
        if (text.length > 200 || text.length < 20) {
            return message.reply(SmartMessage.system(`Vui lòng nhập đoạn văn bản từ 20 đến 200 ký tự.`));
        }
        const replyMessage = await message.reply(SmartMessage.system(`Audio đang được tạo ra, vui lòng chờ...`));

        let voicePath = "";
        let refText = "";
        const userDefaultVoice = await this.userVoiceRepository.findOne({ where: { mezonUserId: user_id, isDefault: true } });
        if (!userDefaultVoice) {
            const publicVoices = await this.userVoiceRepository.find({ where: { isPrivate: ACCESS_LEVEL.PUBLIC } });
            const randomIndex = Math.floor(Math.random() * publicVoices.length);
            const selectedVoice = publicVoices[randomIndex];
            voicePath = selectedVoice.voicePath;
            refText = selectedVoice.textRef;
        } else {
            voicePath = userDefaultVoice.voicePath;
            refText = userDefaultVoice.textRef;
        }

        const response = await axios.post(`${this.runpodServerUrl}`, {
            input: {
                gen_text: text,
                ref_audio_path: voicePath,
                ref_text: refText,
                channel_id: channel_id,
                clan_id: clan_id,
                message_id: replyMessage.message_id,
                model: "F5TTS_Base",
                ckpt_file: "./models/F5-TTS/model_last.pt",
                vocab_file: "./models/F5-TTS/vocab.txt",
                vocoder_name: "vocos",
                load_vocoder_from_local: true,
                vocoder_local_path: "./checkpoints/vocos-mel-24khz",
                speed: 1.0,
                cfg_strength: 2.0,
                nfe_step: 32,
                target_rms: 0.1,
                cross_fade_duration: 0.15,
                remove_silence: false,
                return_audio_base64: false,
                minio_endpoint: this.minioEndpoint,
                minio_access_key: this.minioAccessToken,
                minio_secret_key: this.minioSecretKey,
                minio_bucket: this.minioBucket,
                minio_folder: this.minioFolder,
                cdn_url: this.cdnUrl,
                cleanup_after_upload: true,
            },
            webhook: `${this.webhookUrl}`
        },
            {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                }
            });

    }

    async handleSendAudioToChannel(webhookDto: WebhookDto) {
        const clan = this.mezonClient.clans.get(webhookDto.clanId);
        let channel = await clan.channels.fetch(webhookDto.channelId);
        const message = await channel.messages.fetch(webhookDto.messageId);

        if (!clan) {
            console.warn(`Clan not found for id=${webhookDto.clanId}`);
            return null;
        }

        if (!channel) {
            console.warn(`Channel not found for id=${webhookDto.channelId} in clan=${webhookDto.clanId}`);
            return null;
        }

        if (!message) {
            console.warn(`Message not found for id=${webhookDto.messageId} in channel=${webhookDto.channelId}`);
            return null;
        }

        await message.update(
            { t: "" },
            [],
            [{
                size: webhookDto.fileSize,
                filetype: webhookDto.fileType,
                url: webhookDto.audioPath
            }]
        )
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
        return callResponse.result?.content;
    }

    async handleDeleteVoice(user_id: string, voice_name: string, @AutoContext('message') message: Nezon.AutoContextType.Message) {
        const result = await this.deleteVoice(voice_name, user_id);
        if (!result) {
            return message.reply(SmartMessage.system(`Voice ${voice_name} not found.`));
        }
        return message.reply(SmartMessage.system(`Voice ${voice_name} deleted successfully.`));
    }

    async handleSendHelpMessage(@Message() m: Nezon.Message) {
        const helpMessagePath = path.join(process.cwd(), 'src', 'bot', 'bot_help_message_v1.txt');
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

    private removeIdSuffix(name: string): string {
        return name.replace(/_\d+$/, '');
    }
    
    async handleUseVoice(user: Nezon.User, query: string, @AutoContext('message') message: Nezon.AutoContextType.Message) {
        const numericVoiceId = Number(query);
        let publicVoice: UserVoice | null = null;
        if (!Number.isNaN(numericVoiceId)) {
            publicVoice = await this.userVoiceRepository.findOne({
                where: { id: numericVoiceId, isPrivate: ACCESS_LEVEL.PUBLIC },
            });
        } else {
            publicVoice = await this.userVoiceRepository.findOne({
                where: { voiceName: query, isPrivate: ACCESS_LEVEL.PUBLIC },
            });
        }
        if (!publicVoice) {
            return message.reply(SmartMessage.system(`Voice ${query} not found.`));
        }

        let userVoiceExists = await this.userVoiceRepository.findOne({ where: { mezonUserId: user.id, voicePath: publicVoice.voicePath, textRef: publicVoice.textRef } });
        let defaultVoice = await this.userVoiceRepository.findOne({ where: { mezonUserId: user.id, isDefault: true } });
        if (userVoiceExists) {
            if (defaultVoice.id) {
                defaultVoice.isDefault = false;
                await this.userVoiceRepository.save(defaultVoice);
            }
            userVoiceExists.isDefault = true;
            await this.userVoiceRepository.save(userVoiceExists);
            return message.reply(SmartMessage.system(`Chuyển sang sử dụng giọng ${query} thành công.`));
        }
        if (!userVoiceExists) {
            let userVoice: RegisterVoiceDto = {
                mezonUserId: user.id,
                mezonUserName: user.username,
                voicePath: publicVoice.voicePath,
                textRef: publicVoice.textRef,
                voiceName: this.removeIdSuffix(publicVoice.voiceName),
                isDefault: true,
                isPrivate: ACCESS_LEVEL.PRIVATE,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            if (defaultVoice) {
                defaultVoice.isDefault = false;
                await this.userVoiceRepository.save(defaultVoice);
            }
            const response = await this.userVoiceRepository.save(userVoice);
            userVoice.voiceName = `${userVoice.voiceName}_${response.id}`;
            await this.userVoiceRepository.save(userVoice);
            await this.userVoiceRepository.increment({ id: publicVoice.id }, "numberUsage", 1);
            return message.reply(SmartMessage.system(`Sử dụng giọng ${query} thành công.`));
        }
        return message.reply(SmartMessage.system(`Giọng ${query} đã được sử dụng.`));
    }
}