import { Module } from '@nestjs/common';
import { UserVoice } from './user_voice.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoiceBotService } from './voice_bot.service';
import { VoiceBotHandler } from './voice_bot.handler';
import { MCPConnection } from '../mcp/mcp.connection';
import { MCPApiService } from '../mcp/mcp.api';
import { CallTool } from '../mcp/tools/callTools';
import { ListTools } from '../mcp/tools/listTools';
import { VoiceBotController } from './voice_bot.controller';
@Module({
  imports: [
    TypeOrmModule.forFeature([UserVoice]),
  ],
  controllers: [VoiceBotController],
  providers: [VoiceBotService, VoiceBotHandler, MCPConnection, MCPApiService, ListTools, CallTool],
  exports: [VoiceBotService],
})
export class VoiceBotModule {}  