import { z } from 'zod';
import { Injectable } from '@nestjs/common';
import { ListToolsRequest, ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { MCPApiService } from '../mcp.api';

type ListToolsResult = z.infer<typeof ListToolsResultSchema>;

export interface ListToolsResponse {
    mcpSessionId?: string;
    tools: Array<{
        id: string;
        name: string;
        description?: string;
    }>;
}

@Injectable()
export class ListTools {
    private readonly mcpApiService: MCPApiService;

    constructor(mcpApiService: MCPApiService) {
        this.mcpApiService = mcpApiService;
    }

    async getListTool(): Promise<ListToolsResponse> {
        const req: ListToolsRequest = { method: 'tools/list', params: {} };

        const res = await this.mcpApiService.mcpRequest(req, ListToolsResultSchema);

        if ('error' in res) {
            return { mcpSessionId: res.mcpSessionId, tools: [] };
        }

        const result: ListToolsResult = res.result;

        const tools = result.tools.map(tool => ({
            id: tool.name,
            name: tool.name,
            description: tool.description,
        }));

        return { mcpSessionId: res.mcpSessionId, tools };
    }
}
