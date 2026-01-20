import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { GoogleGenAI, Type } from "@google/genai";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import dotenv from "dotenv";
dotenv.config();


async function main() {
    console.log(process.env.GEMINI_API_KEY);

    class MCPClient {
        private mcp: Client;
        private gemini: GoogleGenAI;
        private transport: StdioClientTransport | null = null;
        private tools = [];

        constructor() {
            this.gemini = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
            });
            this.mcp = new Client({ name: "mcp-client-cli", version: "1.0.0" });
        }
        // methods will go here
        async connectToServer(serverScriptPath: string) {
            try {
                const isJs = serverScriptPath.endsWith(".js");
                const isPy = serverScriptPath.endsWith(".py");
                if (!isJs && !isPy) {
                throw new Error("Server script must be a .js or .py file");
                }
                const command = isPy
                ? process.platform === "win32"
                    ? "python"
                    : "python3"
                : process.execPath;

                this.transport = new StdioClientTransport({
                command,
                args: [serverScriptPath],
                });
                await this.mcp.connect(this.transport);

                const toolsResult = await this.mcp.listTools();
                this.tools = toolsResult.tools.map((tool) => {
                return {
                    name: tool.name,
                    description: tool.description,
                    input_schema: tool.inputSchema,
                };
                });
                console.log(
                "Connected to server with tools:",
                this.tools.map(({ name }) => name)
                );
            } catch (e) {
                console.log("Failed to connect to MCP server: ", e);
                throw e;
            }
        }

        async processQuery(query: string) {
            const messages: MessageParam[] = [
                {
                role: "user",
                content: query,
                },
            ];

}
}

main();