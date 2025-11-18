import { Injectable } from '@nestjs/common';
import { z, ZodTypeAny } from 'zod';
import { MCPConnection } from './mcp.connection';

export type RequestResult<T> =
    | { mcpSessionId?: string; result: T; error?: undefined }
    | { mcpSessionId?: string; result?: undefined; error: unknown };

export type MCPRequest = {
    method: string;
    params?: {
        [key: string]: unknown;
        _meta?: { [key: string]: unknown; progressToken?: string | number };
    };
};

interface MCPClientLike {
    request<TResult>(request: MCPRequest, schema: ZodTypeAny): Promise<TResult>;
}

@Injectable()
export class MCPApiService {
    constructor(private readonly connection: MCPConnection) {}

    async mcpRequest<
        TRequest extends MCPRequest = MCPRequest,
        TSchema extends ZodTypeAny = ZodTypeAny
    >(
        request: TRequest,
        schema: TSchema,
    ): Promise<RequestResult<z.infer<TSchema>>> {
        const mcpSessionId = await this.connection.ensureConnected();
        const client = (await this.connection.getClient()) as unknown as MCPClientLike;
        try {
            const result = await client.request<z.infer<TSchema>>(request, schema);
            return { mcpSessionId, result };
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('[mcpRequest] error', error);
            return { mcpSessionId, error };
        }
    }
}   