import { Controller, Get, Post, Body } from "@nestjs/common";
import { ListTools } from "./tools/listTools";
import { CallTool, CallToolParams } from "./tools/callTools";

@Controller('mcp')
export class MCPController {
    constructor(private readonly listTools: ListTools, private readonly callTool: CallTool) {}

    @Get('list-tools')
    async handleGetListTools() {
        return this.listTools.getListTool();
    }

    @Post('call-tool')
    async handleCallTool(@Body() body: CallToolParams) {
        return this.callTool.callTool(body);
    }
}