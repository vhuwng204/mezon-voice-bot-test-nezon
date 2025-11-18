import { MCPConnection } from "./mcp.connection";
import { Module } from "@nestjs/common";
import { MCPApiService } from "./mcp.api";
import { MCPController } from "./mcp.controller";
import { ListTools } from "./tools/listTools";
import { CallTool } from "./tools/callTools";

@Module({
    imports: [],
    controllers: [MCPController],
    providers: [MCPConnection, MCPApiService, ListTools, CallTool],
    exports: [MCPConnection],
})
export class MCPModule {}