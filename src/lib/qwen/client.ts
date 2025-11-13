import { createRPCClient } from "$lib/utils";
import type { QwenAPI } from "./base";

export const clientQwenAPI = createRPCClient<QwenAPI>('/api/v2/ai-rpc')
