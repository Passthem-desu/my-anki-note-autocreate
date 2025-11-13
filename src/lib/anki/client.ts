import { createRPCClient } from "$lib/utils";
import type { AnkiAPI } from "./base";

export const clientAnkiAPI = createRPCClient<AnkiAPI>('/api/v2/anki-rpc');

