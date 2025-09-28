# 单词添加器 (Word Adder)

一个（差不多算 Vibe Coding 的）基于 SvelteKit 的单词管理工具，支持 AI 自动补全释义并一键添加到 Anki。

我已经把我目前的卡组导出到 `帕，背单词.apkg` 里面了，你可以导入使用。

## 功能特性

- 🤖 **AI 智能补全**：自动获取单词释义、音标和上下文翻译
- 📚 **Anki 集成**：一键将单词添加到 Anki 记忆卡片
- 🎨 **现代化界面**：响应式设计，支持移动端和桌面端
- ⚡ **快速部署**：Docker 一键部署，配置简单

## 技术栈

- **前端**: Svelte 5 + SvelteKit
- **样式**: Tailwind CSS
- **后端**: SvelteKit Server Routes
- **部署**: Docker + Docker Compose
- **AI**: OpenAI 兼容 API

## 环境变量配置

创建 `.env` 文件并配置以下环境变量：

```env
# OpenAI 配置
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini

# Anki Connect 配置
ANKI_CONNECT_URL=http://your-anki-host:8765
```

### OpenAI 配置说明
- 支持任何 OpenAI 兼容的 API（如 Ollama、Azure OpenAI、自托管模型等）

### Anki 配置说明
- 需要安装 [AnkiConnect](https://ankiweb.net/shared/info/2055492159) 插件
- 确保 Anki 正在运行且 AnkiConnect 插件已启用
- 需要预先创建名为 "帕，背单词" 的牌组和笔记类型

## 快速开始

### 开发环境

```bash
npm install
npm run dev
```

### Docker 部署

```bash
docker compose up -d
```

### 手动 Docker 运行

```bash
docker run -d \
  --name pt-add-word \
  --restart unless-stopped \
  -p 20111:3000 \
  -v $(pwd)/.env:/app/.env:ro \
  word-adder
```

## 注意事项

- 确保 `.env` 文件包含所有必需的环境变量
- Anki 必须在同一网络中可访问（对于 Docker 部署）
- AI 补全功能依赖于 OpenAI 兼容的 API 服务

## 许可证

MIT

---
Made with ❤️ using [SvelteKit](https://kit.svelte.dev/) and [Tailwind CSS](https://tailwindcss.com/)