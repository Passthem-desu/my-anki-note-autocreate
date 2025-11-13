import { ServerAnkiAPI } from "$lib/anki/server";
import { createRpcServer } from "$lib/utilsServer";
import type { RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = createRpcServer(new ServerAnkiAPI())
