<script lang="ts">
	import { clientAnkiAPI } from '$lib/anki/client';
	import { clientQwenAPI } from '$lib/qwen/client';
	import type { AnkiNote } from '$lib/anki/base';
	import { onMount } from 'svelte';

	// --- 状态变量 ---

	// 表单数据
	let word: string = '';
	let context: string = '';
	let desc: string = '';
	let deckName: string = '帕， 背单词';

	// 音频数据
	let wordAudioUrl: string | null = null;
	let contextAudioUrl: string | null = null;

	// 笔记列表
	let notesQuery: string = 'deck:帕，背单词';

	// 假设的笔记信息类型，基于 notesInfo 的返回
	type DisplayNote = {
		noteId: string;
		单词: string;
		上下文: string;
		释义: string;
	};

	let notes: DisplayNote[] = [];
	let selectedNoteId: number | null = null;

	// UI 状态
	let isRefining: boolean = false;
	let isGeneratingWordAudio: boolean = false;
	let isGeneratingContextAudio: boolean = false;
	let isUploading: boolean = false;
	let notesLoading: boolean = false;

	let errorMessage: string | null = null;
	let notesErrorMessage: string | null = null;

	// --- 生命周期函数 ---

	onMount(async () => {
		await fetchNotes();
	});

	// --- 核心功能函数 ---

	/**
	 * 获取笔记列表
	 */
	async function fetchNotes() {
		notesLoading = true;
		notesErrorMessage = null;
		try {
			// 假设 notesInfo 返回 { noteId: string, "单词": string, ... }[]
			const result = await clientAnkiAPI.notesInfo(notesQuery);
			notes = result
				.map((n) => ({
					noteId: n.noteId,
					单词: n['单词'] || '',
					上下文: n['上下文'] || '',
					释义: n['释义'] || ''
				}))
				.filter((n) => n.noteId); // 过滤掉没有 noteId 的无效数据
		} catch (err) {
			notesErrorMessage = (err as Error).message || '获取笔记失败';
		} finally {
			notesLoading = false;
		}
	}

	/**
	 * 使用 AI 优化笔记内容
	 */
	async function handleRefine() {
		if (!word) {
			errorMessage = '请输入单词';
			return;
		}
		isRefining = true;
		errorMessage = null;
		try {
			const result = await clientQwenAPI.refineNote({ word, context });
			word = result.word;
			context = result.context;
			desc = result.desc;
		} catch (err) {
			errorMessage = (err as Error).message || '优化失败';
		} finally {
			isRefining = false;
		}
	}

	/**
	 * 生成单词音频
	 */
	async function generateWordAudio() {
		if (!word) {
			errorMessage = '请输入单词以生成音频';
			return;
		}
		isGeneratingWordAudio = true;
		errorMessage = null;
		wordAudioUrl = null; // 重置
		try {
			const result = await clientQwenAPI.generateAudio(word);
			wordAudioUrl = result.url;
		} catch (err) {
			errorMessage = (err as Error).message || '单词音频生成失败';
		} finally {
			isGeneratingWordAudio = false;
		}
	}

	/**
	 * 生成上下文音频
	 */
	async function generateContextAudio() {
		if (!context) {
			errorMessage = '请输入上下文以生成音频';
			return;
		}
		isGeneratingContextAudio = true;
		errorMessage = null;
		contextAudioUrl = null; // 重置
		try {
			const result = await clientQwenAPI.generateAudio(context);
			contextAudioUrl = result.url;
		} catch (err) {
			errorMessage = (err as Error).message || '上下文音频生成失败';
		} finally {
			isGeneratingContextAudio = false;
		}
	}

	/**
	 * 生成一个安全的文件名 (不含后缀)
	 */
	function generateSafeFilename(prefix: string): string {
		const safePrefix = prefix.replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 50);
		const timestamp = Date.now();
		return `${safePrefix}_${timestamp}`;
	}

	/**
	 * 上传/更新卡片
	 */
	async function handleUpload() {
		if (!word) {
			errorMessage = '单词 字段不能为空';
			return;
		}
		isUploading = true;
		errorMessage = null;

		let audioWordField = '';
		let audioContextField = '';

		try {
			// 1. 上传单词音频
			if (wordAudioUrl) {
				const filename = generateSafeFilename(word) + '.wav';
				const uploadResult = await clientAnkiAPI.storeMediaFile(filename, wordAudioUrl);
				if (uploadResult.error) {
					throw new Error(`单词音频上传失败: ${uploadResult.error}`);
				}
				audioWordField = `[sound:${uploadResult.result}]`;
			}

			// 2. 上传上下文音频
			if (contextAudioUrl) {
				const filename = generateSafeFilename(context.substring(0, 50) || 'context') + '.wav';
				const uploadResult = await clientAnkiAPI.storeMediaFile(filename, contextAudioUrl);
				if (uploadResult.error) {
					throw new Error(`上下文音频上传失败: ${uploadResult.error}`);
				}
				audioContextField = `[sound:${uploadResult.result}]`;
			}

			// 3. 准备字段
			const fields = {
				单词: word,
				上下文: context,
				释义: desc,
				audio_word: audioWordField,
				audio_context: audioContextField
			};

			// 4. 判断是更新还是新建
			if (selectedNoteId) {
				// 更新
				const updateResult = await clientAnkiAPI.updateNoteFields(selectedNoteId, fields);
				if (updateResult.error) {
					throw new Error(`更新笔记失败: ${updateResult.error}`);
				}
				alert('笔记更新成功!');
			} else {
				// 新建
				const note: AnkiNote = {
					deckName: deckName,
					modelName: '帕，背单词',
					fields: fields
				};
				const addResult = await clientAnkiAPI.addNote(note);
				if (addResult.error) {
					throw new Error(`添加笔记失败: ${addResult.error}`);
				}
				alert(`笔记添加成功! ID: ${addResult.result}`);
			}

			// 5. 清理和刷新
			resetForm();
			await fetchNotes();
		} catch (err) {
			errorMessage = (err as Error).message || '上传失败';
		} finally {
			isUploading = false;
		}
	}

	/**
	 * 从列表选择一个笔记进行编辑
	 */
	function selectNote(note: DisplayNote) {
		try {
			const noteIdNum = parseInt(note.noteId, 10);
			if (isNaN(noteIdNum)) {
				throw new Error('无效的笔记 ID');
			}
			selectedNoteId = noteIdNum;
			word = note['单词'];
			context = note['上下文'];
			desc = note['释义'];

			// 清空音频，因为无法预览旧音频
			wordAudioUrl = null;
			contextAudioUrl = null;
			errorMessage = null;
		} catch (err) {
			errorMessage = (err as Error).message;
			resetForm();
		}
	}

	/**
	 * 重置表单为新建状态
	 */
	function resetForm() {
		word = '';
		context = '';
		desc = '';
		wordAudioUrl = null;
		contextAudioUrl = null;
		selectedNoteId = null;
		errorMessage = null;
		// 不重置 deckName 和 query
	}
</script>

<svelte:head>
	<title>Anki 单词卡片制作器</title>
</svelte:head>

<div class="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
	<h1 class="text-3xl font-bold text-gray-900 mb-6">Anki 单词卡片制作器</h1>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<div class="md:col-span-2 bg-white p-6 rounded-lg shadow-md">
			<form class="space-y-4" on:submit|preventDefault={handleUpload}>
				{#if errorMessage}
					<div class="p-3 bg-red-100 text-red-700 rounded-md">
						{errorMessage}
					</div>
				{/if}

				<div class="flex flex-wrap gap-2 items-center">
					<button
						type="button"
						class="py-2 px-4 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
						on:click={handleRefine}
						disabled={isRefining || !word}
					>
						{isRefining ? '优化中...' : 'AI 优化'}
					</button>

					<button
						type="submit"
						class="py-2 px-4 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
						disabled={isUploading || !word}
					>
						{#if isUploading}
							上传中...
						{:else if selectedNoteId}
							更新卡片
						{:else}
							上传新卡片
						{/if}
					</button>

					<button
						type="button"
						class="py-2 px-4 bg-gray-500 text-white font-semibold rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
						on:click={resetForm}
					>
						清空 (新建)
					</button>
				</div>

				<div>
					<label for="deckName" class="block text-sm font-medium text-gray-700">牌组 (Deck)</label>
					<input
						type="text"
						id="deckName"
						class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
						bind:value={deckName}
					/>
				</div>

				<div>
					<label for="word" class="block text-sm font-medium text-gray-700">单词 (Word)</label>
					<input
						type="text"
						id="word"
						class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
						bind:value={word}
					/>
				</div>

				<div>
					<label for="context" class="block text-sm font-medium text-gray-700"
						>上下文 (Context)</label
					>
					<textarea
						id="context"
						rows="3"
						class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
						bind:value={context}
					/>
				</div>

				<div>
					<label for="desc" class="block text-sm font-medium text-gray-700">释义 (Desc)</label>
					<textarea
						id="desc"
						rows="6"
						class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
						bind:value={desc}
					/>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="space-y-2 p-3 border rounded-md">
						<label class="block text-sm font-medium text-gray-700">单词音频</label>
						<button
							type="button"
							class="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
							on:click={generateWordAudio}
							disabled={isGeneratingWordAudio || !word}
						>
							{isGeneratingWordAudio ? '生成中...' : '生成单词音频'}
						</button>
						{#if wordAudioUrl}
							<audio controls src={wordAudioUrl} class="w-full">
								Your browser does not support the audio element.
							</audio>
						{/if}
					</div>

					<div class="space-y-2 p-3 border rounded-md">
						<label class="block text-sm font-medium text-gray-700">上下文音频</label>
						<button
							type="button"
							class="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
							on:click={generateContextAudio}
							disabled={isGeneratingContextAudio || !context}
						>
							{isGeneratingContextAudio ? '生成中...' : '生成上下文音频'}
						</button>
						{#if contextAudioUrl}
							<audio controls src={contextAudioUrl} class="w-full">
								Your browser does not support the audio element.
							</audio>
						{/if}
					</div>
				</div>
			</form>
		</div>

		<div class="md:col-span-1 bg-white p-6 rounded-lg shadow-md space-y-4">
			<h2 class="text-xl font-semibold text-gray-800">已有笔记</h2>

			<div>
				<label for="notesQuery" class="block text-sm font-medium text-gray-700">查询语句</label>
				<div class="mt-1 flex gap-2 w-full">
					<input
						type="text"
						id="notesQuery"
						class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 w-40"
						bind:value={notesQuery}
					/>
					<button
						type="button"
						class="py-2 px-3 bg-gray-600 text-white font-semibold rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 flex-shrink-0"
						on:click={fetchNotes}
						disabled={notesLoading}
					>
						{notesLoading ? '...' : '刷新'}
					</button>
				</div>
			</div>

			<div class="border rounded-md h-96 overflow-y-auto bg-gray-50 p-2">
				{#if notesLoading}
					<div class="text-center text-gray-500 p-4">加载中...</div>
				{:else if notesErrorMessage}
					<div class="p-3 bg-red-100 text-red-700 rounded-md">
						{notesErrorMessage}
					</div>
				{:else if notes.length === 0}
					<div class="text-center text-gray-500 p-4">未找到笔记</div>
				{:else}
					<ul class="space-y-2">
						{#each notes as note (note.noteId)}
							<li>
								<button
									class="w-full text-left p-3 rounded-md border transition-colors
                                    {selectedNoteId === parseInt(note.noteId, 10)
										? 'bg-indigo-100 border-indigo-300'
										: 'bg-white hover:bg-gray-100 border-gray-200'}"
									on:click={() => selectNote(note)}
								>
									<span class="font-medium text-indigo-700">{note['单词']}</span>
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	</div>
</div>
