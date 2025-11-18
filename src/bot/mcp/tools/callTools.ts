import { z } from 'zod';
import { CallToolRequest, CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { MCPApiService } from '../mcp.api';
import { Injectable } from '@nestjs/common';

type CallToolResult = z.infer<typeof CallToolResultSchema>;

export interface CallToolParams {
    name: string;
    arguments?: Record<string, unknown>;
}

export interface CallToolResponse {
    mcpSessionId?: string;
    result?: CallToolResult;
    error?: unknown;
}

@Injectable()
export class CallTool {
    private readonly mcpApiService: MCPApiService;

    constructor(mcpApiService: MCPApiService) {
        this.mcpApiService = mcpApiService;
    }

    async callTool(params: CallToolParams): Promise<CallToolResponse> {
        const req: CallToolRequest = {
            method: 'tools/call',
            params: {
                name: params.name,
                arguments: params.arguments || {}
            }
        };

        const res = await this.mcpApiService.mcpRequest(req, CallToolResultSchema);

        if ('error' in res) {
            return {
                mcpSessionId: res.mcpSessionId,
                error: res.error
            };
        }

        return {
            mcpSessionId: res.mcpSessionId,
            result: res.result
        };
    }
}