import { env } from '$env/dynamic/private';

import { retryAsync } from "$lib/utils";
import type { QwenAPI } from "./base";

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

export class ServerQwenAPI implements QwenAPI {
  async generateAudio(text: string): Promise<{ url: string; }> {
    return await retryAsync(async () => {
      const data = JSON.stringify({
        "model": "qwen3-tts-flash",
        "input": {
          "text": text.replaceAll(/<.+?>/g, ''),
          "voice": "Ethan",
          "language_type": "English",
        },
      });

      const response = await fetch(
        'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
        {
          headers: {
            'Authorization': 'Bearer ' + OPENAI_API_KEY,
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: data,
        },
      );

      const result = await response.json();
      const url: string = result.output.audio.url;

      return { url };
    }, 5, 500)
  }

  async refineNote(data: { word: string; context: string; }): Promise<{ word: string; context: string; desc: string; }> {
    return await retryAsync(async () => {
      const word = data.word.replaceAll(/<.+?>/g, '');
      const context = data.context.replaceAll(/<.+?>/g, '');

      const user_prompt = `单词：${word}\n上下文：${context}`;
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: user_prompt },
      ];

      const payload = {
        model: OPENAI_MODEL,
        messages: messages,
        temperature: 0.3,
        response_format: {
          type: "json_object",
        }
      };

      const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify(payload),
      })

      const resdata = await response.json();
      const llmContent = resdata.choices[0]?.message?.content;

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
          return {
            word: resultObject.word ?? word,
            context: resultObject.context ?? context,
            desc: html,
          };
        } catch (parseError) {
          console.error("JSON 解析失败:", parseError);
          throw parseError;
        }
      } else {
        throw Error("没有 JSON 被检测到！")
      }
    }, 5, 500);
  }
}

