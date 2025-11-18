import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NezonModule } from '@n0xgg04/nezon';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { VoiceBotModule } from './bot/voice_bot_mezon/voice_bot.module';
import { VoiceBotHandler } from './bot/voice_bot_mezon/voice_bot.handler';
import { MCPModule } from './bot/mcp/mcp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [join(process.cwd(), 'dist/**/*.entity.{ts,js}')],
        synchronize: configService.get<boolean>('ENABLE_SYNCHRONIZE', false),
      }),
    }),
    NezonModule.forRoot({
      token: process.env.MEZON_TOKEN ?? '',
      botId: process.env.MEZON_BOT_ID ?? '',
    }),
    VoiceBotModule,
    MCPModule
  ],
  controllers: [AppController],
  providers: [AppService, VoiceBotHandler],
})
export class AppModule {}

