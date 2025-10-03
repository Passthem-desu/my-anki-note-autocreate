import { json, type RequestHandler } from "@sveltejs/kit";
import { env } from '$env/dynamic/private';

import SYSTEM_PROMPT from '$lib/ai-prompts/system_prompt.txt?raw'

const OPENAI_API_KEY = env.OPENAI_API_KEY
const OPENAI_BASE_URL = env.OPENAI_BASE_URL
const OPENAI_MODEL = env.OPENAI_MODEL


function escapeHtml(str: string): string {
  if (typeof str !== 'string') return '';
  str = str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/&lt;(\/?)(b|strong)&gt;/g, '<$1$2>');
}


export const POST: RequestHandler = async ({ request }) => {
  const { word, ctx, desc } = await request.json()

  if (!OPENAI_API_KEY || !OPENAI_BASE_URL || !OPENAI_MODEL) {
    return json({
      word: word,
      ctx: ctx,
      desc: "OpenAI 配置未设置完整！请检查 OPENAI_API_KEY、OPENAI_BASE_URL 和 OPENAI_MODEL 环境变量。"
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
        // 构建 HTML 内容
        let html = '';
        // 翻译（主释义）
        if (resultObject.translation) {
          html += `<div class="translation">${escapeHtml(resultObject.translation)}</div>`;
        }
        // 转录 + 上下文定义（通常用于例句）
        if (resultObject.transcription || resultObject['context-definition']) {
          html += `<div class="transcription-context">`;
          if (resultObject.transcription) {
            html += `<span class="transcription">${escapeHtml(resultObject.transcription)}</span>`;
          }
          if (resultObject['context-definition']) {
            html += `<span class="context-definition">${escapeHtml(resultObject['context-definition'])}</span>`;
          }
          html += `</div>`;
        }
        // 完整释义（列表形式）
        if (resultObject.definition && Array.isArray(resultObject.definition) && resultObject.definition.length > 0) {
          html += `<div class="full-definition">`;
          html += `<strong>完整释义</strong>`;
          html += `<ul class="definition-list">`;
          for (const def of resultObject.definition) {
            html += `<li>${escapeHtml(def)}</li>`;
          }
          html += `</ul>`;
          html += `</div>`;
        }
        return json({
          word: resultObject.word ?? word,
          ctx: resultObject.context ?? ctx,
          desc: html,
        });
      } catch (parseError) {
        console.error("JSON 解析失败:", parseError);
        return json({
          word,
          ctx,
          desc: `<p><strong>❌ JSON 解析失败</strong></p><pre>${escapeHtml(llmContent)}</pre>`,
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