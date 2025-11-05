<script lang="ts">
	var isBusy = $state(false);
	var wordVal = $state('');
	var contextVal = $state('');
	var descriptionVal = $state('');
	var errorText = $state('');

	async function ai_complete() {
		// if (descriptionVal != "") {
		//     errorText = "已经有释义了"
		//     return
		// }
		if (contextVal == '') {
			errorText = '未填写上下文';
			return;
		}
		if (wordVal == '') {
			errorText = '未填写单词';
			return;
		}

		isBusy = true;
		errorText = '';

		try {
			const response = await fetch('/api/ai-complete', {
				method: 'POST',
				body: JSON.stringify({
					word: wordVal,
					ctx: contextVal,
					desc: descriptionVal
				})
			});
			const data = await response.json();
			wordVal = data.word;
			contextVal = data.ctx;
			descriptionVal = data.desc;
		} finally {
			isBusy = false;
		}
	}

	async function add_word() {
		isBusy = true;
		errorText = '';

		try {
			await fetch('/api/upload', {
				method: 'POST',
				body: JSON.stringify({
					word: wordVal,
					ctx: contextVal,
					desc: descriptionVal.replaceAll(/\n/g, '<br/>')
				})
			});
			alert('ok');
		} finally {
			isBusy = false;
		}
	}

	async function clear() {
		wordVal = '';
		contextVal = '';
		descriptionVal = '';
	}
</script>

<div class="min-h-screen p-4 sm:p-6 md:p-8 
             bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
    <div class="max-w-2xl mx-auto">
        <div class="rounded-2xl shadow-lg p-6 sm:p-8 
                    bg-white dark:bg-gray-700 dark:shadow-2xl">
            <div class="text-center mb-6">
                <h1 class="text-2xl sm:text-3xl font-bold 
                            text-gray-800 dark:text-gray-50">单词添加器</h1>
                <p class="mt-2 text-gray-600 dark:text-gray-300">轻松添加和管理您的词汇</p>
            </div>

            <div
                hidden={errorText == ''}
                class="mb-4 p-3 rounded-lg flex items-center 
                       bg-red-50 border border-red-200 text-red-700 
                       dark:bg-red-900/30 dark:border-red-800 dark:text-red-300"
            >
                <span class="mr-2 text-lg">⚠️</span>
                <span class="font-medium">错误：</span>
                {errorText}
            </div>

            <div class="space-y-4">
                <div>
                    <label for="word" class="block text-sm font-medium mb-1 
                                            text-gray-700 dark:text-gray-200">单词</label>
                    <input
                        id="word"
                        class="w-full px-4 py-3 rounded-lg outline-none transition-all duration-200 
                               border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                               bg-white text-gray-800 
                               dark:bg-gray-600 dark:border-gray-500 dark:text-gray-50 dark:placeholder-gray-300
                               disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
                               dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
                        placeholder="请输入单词"
                        disabled={isBusy}
                        bind:value={wordVal}
                    />
                </div>

                <div>
                    <label for="context" class="block text-sm font-medium mb-1 
                                                text-gray-700 dark:text-gray-200">上下文</label>
                    <textarea
                        id="context"
                        class="w-full px-4 py-3 rounded-lg resize-none outline-none transition-all duration-200 
                               border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                               bg-white text-gray-800 
                               dark:bg-gray-600 dark:border-gray-500 dark:text-gray-50 dark:placeholder-gray-300
                               disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
                               dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
                        placeholder="请输入上下文（例句或使用场景）"
                        rows="3"
                        disabled={isBusy}
                        bind:value={contextVal}
                    ></textarea>
                </div>

                <div>
                    <label for="description" class="block text-sm font-medium mb-1 
                                                    text-gray-700 dark:text-gray-200">释义</label>
                    <textarea
                        id="description"
                        class="w-full px-4 py-3 rounded-lg resize-none outline-none transition-all duration-200 
                               border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                               bg-white text-gray-800 
                               dark:bg-gray-600 dark:border-gray-500 dark:text-gray-50 dark:placeholder-gray-300
                               disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
                               dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
                        placeholder="请输入单词释义"
                        rows="10"
                        disabled={isBusy}
                        bind:value={descriptionVal}
                    ></textarea>
                </div>
            </div>

            <div class="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                    class="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                    onclick={ai_complete}
                    disabled={isBusy}
                >
                    {#if isBusy}
                        <span class="animate-spin mr-2">⟳</span>
                    {/if}
                    AI 补全
                </button>

                <button
                    class="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    onclick={add_word}
                    disabled={isBusy}
                >
                    {#if isBusy}
                        <span class="animate-spin mr-2">⟳</span>
                    {/if}
                    添加
                </button>

                <button
                    class="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                    onclick={clear}
                >
                    清空
                </button>
            </div>
        </div>
    </div>
</div>

