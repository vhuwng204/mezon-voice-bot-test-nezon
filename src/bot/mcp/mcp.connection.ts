import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MCPConnection {
    private client: Client | null;
    private transport: StreamableHTTPClientTransport | null = null;
    private isConnected = false;
    private sessionId: string | undefined = undefined;
    private mcpServerUrl: string = process.env.MCP_SERVER_URL ?? 'http://localhost:8080';

    async ensureConnected() {
        if(this.isConnected && this.client && this.transport) {
            return this.sessionId;
        }
        
        this.client = new Client({
            name: 'TTS-Server',
            version: '1.0.0'
        });
        this.transport = new StreamableHTTPClientTransport(new URL(this.mcpServerUrl));
        await this.client.connect(this.transport);
        this.sessionId = this.transport.sessionId;
        this.isConnected = true;
        return this.sessionId;
    }

    async getClient() {
        if (!this.client) {
            throw new Error('MCP Client has not been initialized. Call ensureConnected() before calling this method.');
        }
        return this.client;
    }

    async getSessionId() {
        return this.sessionId;
    }

    async disconnect() {
        try {
            await this.transport?.close();
        } catch (error) {
            throw new Error(`Error disconnecting from MCP server: ${error}`);
        } finally {
            this.isConnected = false;
            this.sessionId = undefined;
            this.client = null;
            this.transport = null;
        }
    }
}