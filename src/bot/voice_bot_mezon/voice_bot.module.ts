import { Module } from '@nestjs/common';
import { UserVoice } from './user_voice.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoiceBotService } from './voice_bot.service';
import { VoiceBotHandler } from './voice_bot.handler';
@Module({
  imports: [
    TypeOrmModule.forFeature([UserVoice]),
  ],
  providers: [VoiceBotService, VoiceBotHandler],
  exports: [VoiceBotService],
})
export class VoiceBotModule {}  