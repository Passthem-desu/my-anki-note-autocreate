<script lang="ts">
    var isBusy = $state(false)
    var wordVal = $state("")
    var contextVal = $state("")
    var descriptionVal = $state("")
    var errorText = $state("")

    async function ai_complete() {
        // if (descriptionVal != "") {
        //     errorText = "已经有释义了"
        //     return
        // }
        if (contextVal == "") {
            errorText = "未填写上下文"
            return
        }
        if (wordVal == "") {
            errorText = "未填写单词"
            return
        }

        isBusy = true
        errorText = ''

        try {
            const response = await fetch('/api/ai-complete', {
                method: 'POST',
                body: JSON.stringify({
                    word: wordVal,
                    ctx: contextVal,
                    desc: descriptionVal,
                })
            })
            const data = await response.json()
            wordVal = data.word
            contextVal = data.ctx
            descriptionVal = data.desc
        } finally {
            isBusy = false
        }
    }

    async function add_word() {
        isBusy = true
        errorText = ''

        try {
            await fetch('/api/upload', {
                method: 'POST',
                body: JSON.stringify({
                    word: wordVal,
                    ctx: contextVal,
                    desc: descriptionVal.replaceAll(/\n/g, '<br/>'),
                })
            })
            alert('ok')
        } finally {
            isBusy = false
        }
    }

    async function clear() {
        wordVal = ''
        contextVal = ''
        descriptionVal = ''
    }
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 md:p-8">
	<div class="max-w-2xl mx-auto">
		<div class="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
			<div class="text-center mb-6">
				<h1 class="text-2xl sm:text-3xl font-bold text-gray-800">单词添加器</h1>
				<p class="text-gray-600 mt-2">轻松添加和管理您的词汇</p>
			</div>
			
			<div hidden={errorText == ""} class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center">
				<span class="mr-2 text-lg">⚠️</span>
				<span class="font-medium">错误：</span> {errorText}
			</div>
			
			<div class="space-y-4">
				<div>
					<label for="word" class="block text-sm font-medium text-gray-700 mb-1">单词</label>
					<input 
						id="word"
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
						placeholder="请输入单词"
						disabled={isBusy} 
						bind:value={wordVal} 
					/>
				</div>
				
				<div>
					<label for="context" class="block text-sm font-medium text-gray-700 mb-1">上下文</label>
					<textarea 
						id="context"
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 resize-none disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
						placeholder="请输入上下文（例句或使用场景）"
						rows="3" 
						disabled={isBusy} 
						bind:value={contextVal}
					></textarea>
				</div>
				
				<div>
					<label for="description" class="block text-sm font-medium text-gray-700 mb-1">释义</label>
					<textarea 
						id="description"
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 resize-none disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
						placeholder="请输入单词释义"
						rows="8" 
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