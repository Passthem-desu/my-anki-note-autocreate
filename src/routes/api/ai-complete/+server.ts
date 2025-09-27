import { json, type RequestHandler } from "@sveltejs/kit";
import { env } from '$env/dynamic/private';

import SYSTEM_PROMPT from '$lib/ai-prompts/system_prompt.txt?raw'

const OPENAI_API_KEY = env.OPENAI_API_KEY
const OPENAI_BASE_URL = env.OPENAI_BASE_URL
const OPENAI_MODEL = env.OPENAI_MODEL

export const POST: RequestHandler = async ({ request }) => {
    const { word, ctx, desc } = await request.json()

    if (!OPENAI_BASE_URL || !OPENAI_MODEL) {
        return json({
            word: word,
            ctx: ctx,
            desc: "OpenAI 密钥未设置！"
        }, { status: 500 })
    }

    const user_prompt = `单词：${word}\n上下文：${ctx}`
    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: user_prompt },
    ]

    const payload = {
        model: OPENAI_MODEL,
        messages: messages,
        temperature: 0.7,
    }

    try {
        const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify(payload),
        })
        if (!response.ok) {
            const errorText = await response.text()
            console.error("API Error:", errorText)
            return json({
                word,
                ctx,
                desc: `API 调用失败: ${response.status} - ${errorText}`
            }, { status: response.status });
        }

        const data = await response.json();
        const llmContent = data.choices[0]?.message?.content;

        if (llmContent) {
            try {
                const resultObject = JSON.parse(llmContent);

                let result = `${resultObject.translation}\n\n${resultObject.transcription} ${resultObject['context-definition']}`

                if (resultObject.definition && resultObject.definition.length > 0) {
                    result += '\n\n完整释义：'
                    for (let s of resultObject.definition) {
                        result += `\n・${s}`
                    }
                }

                return json({
                    word: resultObject.word ?? word,
                    ctx: resultObject.context ?? ctx,
                    desc: result
                });
            } catch (parseError) {
                console.error("JSON 解析失败:", parseError);
                return json({
                    word,
                    ctx,
                    desc: `JSON 解析失败: ${llmContent}`
                });
            }
        }

        return json({
            word,
            ctx,
            desc: `LLM 返回内容为空或解析失败：${JSON.stringify(data)}`
        }, { status: 500 });
    } catch (error) {
        console.error("Fetch or Parsing Error:", error);
        return json({
            word,
            ctx,
            desc: `服务器或网络错误: ${error instanceof Error ? error.message : "未知错误"}`
        }, { status: 500 });
    }
}