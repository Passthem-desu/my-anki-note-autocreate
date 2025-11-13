import { ServerQwenAPI } from "$lib/qwen/server";
import { createRpcServer } from "$lib/utilsServer";
import { type RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = createRpcServer(new ServerQwenAPI())

