import { text } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { env } from "$env/dynamic/private";

const ANKI_CONNECT_URL = env.ANKI_CONNECT_URL

export const POST: RequestHandler = async ({ request }) => {
    const data = await request.json()

    try {
        await fetch(ANKI_CONNECT_URL, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "action": "addNotes",
                "version": 6,
                "params": {
                    "notes": [{
                        "deckName": "帕，背单词",
                        "modelName": "帕，背单词",
                        "fields": {
                            "单词": data.word,
                            "上下文": data.ctx,
                            "释义": data.desc,
                        }
                    }]
                }
            })
        })
    } catch (e) {
        console.error(e)
        return text('error', { status: 500 })
    }

    return text('ok')
}
