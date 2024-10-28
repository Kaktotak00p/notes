<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { List, ListTodo, ListOrdered, Heading1, Heading2, Code, ImagePlus } from 'lucide-svelte';

	export let value: string;
	export let isEditing: boolean;
	export let parsedContent: string;
	export let textareaRef: HTMLTextAreaElement;
	export let onInput: (event: Event) => void;
	export let onBlur: () => void;

	// Switch to editing mode when the user interacts with the preview
	function switchToEditing() {
		isEditing = true;

		// After switching to editing mode, focus on the textarea
		setTimeout(() => {
			textareaRef?.focus();
		}, 0);
	}

	function addHeading1() {
		const selectionStart = textareaRef.selectionStart;

		// Find start of current line
		let lineStart = selectionStart;
		while (lineStart > 0 && value[lineStart - 1] !== '\n') {
			lineStart--;
		}

		// Check if line already starts with a heading
		const currentLine = value.substring(lineStart).split('\n')[0];
		const headingMatch = currentLine.match(/^(#{1,2})\s/);

		let newContent;
		if (headingMatch) {
			// Replace existing heading
			newContent =
				value.substring(0, lineStart) + '# ' + currentLine.substring(headingMatch[0].length);
		} else {
			// Add new heading
			newContent = value.substring(0, lineStart) + '# ' + value.substring(lineStart);
		}

		updateContent(newContent, lineStart + 2, lineStart + 2);
		textareaRef.focus();
		textareaRef.setSelectionRange(lineStart + 2, lineStart + 2);
	}

	function addHeading2() {
		const selectionStart = textareaRef.selectionStart;

		// Find start of current line
		let lineStart = selectionStart;
		while (lineStart > 0 && value[lineStart - 1] !== '\n') {
			lineStart--;
		}

		// Check if line already starts with a heading
		const currentLine = value.substring(lineStart).split('\n')[0];
		const headingMatch = currentLine.match(/^(#{1,2})\s/);

		let newContent;
		if (headingMatch) {
			// Replace existing heading
			newContent =
				value.substring(0, lineStart) + '## ' + currentLine.substring(headingMatch[0].length);
		} else {
			// Add new heading
			newContent = value.substring(0, lineStart) + '## ' + value.substring(lineStart);
		}

		updateContent(newContent, lineStart + 3, lineStart + 3);
		textareaRef.focus();
		textareaRef.setSelectionRange(lineStart + 3, lineStart + 3);
	}

	function addBold() {
		const selectionStart = textareaRef.selectionStart;
		const selectionEnd = textareaRef.selectionEnd;
		const selectedText = value.substring(selectionStart, selectionEnd);
		const newContent =
			value.substring(0, selectionStart) +
			'**' +
			selectedText +
			'**' +
			value.substring(selectionEnd);
		updateContent(newContent, selectionStart + 2, selectionEnd + 2);
		textareaRef.focus();
		textareaRef.setSelectionRange(selectionStart + 2, selectionEnd + 2);
	}

	function addItalic() {
		const selectionStart = textareaRef.selectionStart;
		const selectionEnd = textareaRef.selectionEnd;
		const selectedText = value.substring(selectionStart, selectionEnd);
		const newContent =
			value.substring(0, selectionStart) + '_' + selectedText + '_' + value.substring(selectionEnd);
		updateContent(newContent, selectionStart + 1, selectionEnd + 1);
		textareaRef.focus();
		textareaRef.setSelectionRange(selectionStart + 1, selectionEnd + 1);
	}
	function addCheckbox() {
		const selectionStart = textareaRef.selectionStart;
		const selectionEnd = textareaRef.selectionEnd;
		const selectedText = value.substring(selectionStart, selectionEnd);
		const currentLine = value.substring(0, selectionStart).split('\n').pop() || '';
		const prefix = currentLine.length > 0 ? '\n' : '';
		const newContent =
			value.substring(0, selectionStart) +
			prefix +
			'- [ ] ' +
			selectedText +
			value.substring(selectionEnd);
		const offset = prefix.length + 6;
		updateContent(newContent, selectionStart + offset, selectionEnd + offset);
		textareaRef.focus();
		textareaRef.setSelectionRange(selectionStart + offset, selectionEnd + offset);
	}

	function addBulletList() {
		const cursorPosition = textareaRef.selectionStart;
		const currentLine = value.substring(0, cursorPosition).split('\n').pop() || '';
		const prefix = currentLine.length > 0 ? '\n' : '';
		const newContent =
			value.substring(0, cursorPosition) + prefix + '- ' + value.substring(cursorPosition);
		const offset = prefix.length + 2;
		updateContent(newContent, cursorPosition + offset, cursorPosition + offset);
		textareaRef.focus();
		textareaRef.setSelectionRange(cursorPosition + offset, cursorPosition + offset);
	}

	function addNumberedList() {
		const cursorPosition = textareaRef.selectionStart;
		const currentLine = value.substring(0, cursorPosition).split('\n').pop() || '';
		const prefix = currentLine.length > 0 ? '\n' : '';
		const newContent =
			value.substring(0, cursorPosition) + prefix + '1. ' + value.substring(cursorPosition);
		const offset = prefix.length + 3;
		updateContent(newContent, cursorPosition + offset, cursorPosition + offset);
		textareaRef.focus();
		textareaRef.setSelectionRange(cursorPosition + offset, cursorPosition + offset);
	}

	function addCodeBlock() {
		const selectionStart = textareaRef.selectionStart;
		const selectionEnd = textareaRef.selectionEnd;
		const selectedText = value.substring(selectionStart, selectionEnd);
		const currentLine = value.substring(0, selectionStart).split('\n').pop() || '';
		const prefix = currentLine.length > 0 ? '\n' : '';
		const newContent =
			value.substring(0, selectionStart) +
			prefix +
			'```\n\n' +
			selectedText +
			(selectedText ? '\n' : '') +
			'```' +
			value.substring(selectionEnd);
		const offset = prefix.length + 4;
		updateContent(newContent, selectionStart + offset, selectionEnd + offset);
		textareaRef.focus();
		textareaRef.setSelectionRange(selectionStart + offset, selectionEnd + offset);
	}

	async function addImage() {
		// Store cursor position before opening file dialog
		const cursorPosition = textareaRef.selectionStart;
		const currentLine = value.substring(0, cursorPosition).split('\n').pop() || '';
		const prefix = currentLine.length > 0 ? '\n' : '';

		// Create a file input element
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'image/*';

		// Handle file selection
		input.onchange = (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (e) => {
					const imageMarkdown = `![${file.name}](${e.target?.result})`;
					const newContent =
						value.substring(0, cursorPosition) +
						prefix +
						imageMarkdown +
						value.substring(cursorPosition);
					const offset = prefix.length + imageMarkdown.length;
					updateContent(newContent, cursorPosition + offset, cursorPosition + offset);

					// Re-enable editing mode and restore focus
					isEditing = true;
					setTimeout(() => {
						textareaRef?.focus();
						textareaRef?.setSelectionRange(cursorPosition + offset, cursorPosition + offset);
					}, 0);
				};
				reader.readAsDataURL(file);
			}
		};

		// Trigger file selection
		input.click();
	}

	function handleKeyDown(event: KeyboardEvent) {
		const textarea = event.target as HTMLTextAreaElement;
		const cursorPosition = textarea.selectionStart;
		const currentLine = value.substring(0, cursorPosition).split('\n').pop() || '';
		const lineStart = currentLine.trim();

		if (event.key === 'Enter') {
			if (
				lineStart.startsWith('-') ||
				lineStart.match(/^\d+\./) ||
				lineStart.startsWith('[ ]') ||
				lineStart.startsWith('[x]')
			) {
				event.preventDefault();
				// Check if the line is empty (just the list marker or checkbox)
				if (
					currentLine.trim() === '-' ||
					currentLine.trim() === '- ' ||
					currentLine.trim() === '- [ ]' ||
					currentLine.trim() === '- [x]'
				) {
					console.log('Empty list item detected, removing it');
					// Remove the empty list item by excluding it from the content
					const contentBeforeLine = value.substring(0, cursorPosition - currentLine.length);
					const contentAfterLine = value.substring(cursorPosition);
					const newContent = contentBeforeLine + '\n' + contentAfterLine;
					updateContent(
						newContent,
						cursorPosition - currentLine.length,
						cursorPosition - currentLine.length
					);
				} else {
					// Continue the list with the appropriate marker
					let newLine = '\n';
					if (lineStart.startsWith('- [ ]') || lineStart.startsWith('- [x]')) {
						newLine += '- [ ] ';
					} else if (lineStart.startsWith('-')) {
						newLine += '- ';
					} else if (lineStart.match(/^\d+\./)) {
						const num = parseInt(lineStart.match(/^\d+/)?.[0] ?? '0') + 1;
						newLine += `${num}. `;
					}

					const newContent =
						value.substring(0, cursorPosition) + newLine + value.substring(cursorPosition);
					updateContent(
						newContent,
						cursorPosition + newLine.length,
						cursorPosition + newLine.length
					);
				}
			}
		} else if (['[', '(', '{'].includes(event.key)) {
			console.log('Auto-closing bracket');
			event.preventDefault();
			const closingBracket = { '[': ']', '(': ')', '{': '}' }[event.key];
			const newContent =
				value.substring(0, cursorPosition) +
				event.key +
				closingBracket +
				value.substring(cursorPosition);
			updateContent(newContent, cursorPosition + 1, cursorPosition + 1);
		} else if (event.key === '*') {
			event.preventDefault();
			const newContent =
				value.substring(0, cursorPosition) + '**' + value.substring(cursorPosition);
			updateContent(newContent, cursorPosition + 1, cursorPosition + 1);
		} else if (event.key === '_') {
			event.preventDefault();
			const newContent =
				value.substring(0, cursorPosition) + '__' + value.substring(cursorPosition);
			updateContent(newContent, cursorPosition + 1, cursorPosition + 1);
		} else if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
			event.preventDefault();
			const selectionStart = textarea.selectionStart;
			const selectionEnd = textarea.selectionEnd;
			const selectedText = value.substring(selectionStart, selectionEnd);
			const newContent =
				value.substring(0, selectionStart) +
				'**' +
				selectedText +
				'**' +
				value.substring(selectionEnd);
			updateContent(newContent, selectionStart + 2, selectionEnd + 2);
		} else if ((event.ctrlKey || event.metaKey) && event.key === 'i') {
			event.preventDefault();
			const selectionStart = textarea.selectionStart;
			const selectionEnd = textarea.selectionEnd;
			const selectedText = value.substring(selectionStart, selectionEnd);
			const newContent =
				value.substring(0, selectionStart) +
				'_' +
				selectedText +
				'_' +
				value.substring(selectionEnd);
			updateContent(newContent, selectionStart + 1, selectionEnd + 1);
		}
	}

	function updateContent(newContent: string, cursorStart: number, cursorEnd: number) {
		value = newContent;
		setTimeout(() => {
			textareaRef.value = newContent;
			textareaRef.selectionStart = cursorStart;
			textareaRef.selectionEnd = cursorEnd;
		}, 0);
	}
</script>

{#if isEditing}
	<div class="relative w-full h-full">
		<textarea
			bind:this={textareaRef}
			bind:value
			on:input={onInput}
			on:keydown={handleKeyDown}
			on:blur={onBlur}
			class="w-full h-full p-2.5 text-base resize-none bg-transparent border-none outline-none focus:ring-0 focus-visible:outline-none prose prose-sm max-w-none pb-24"
		></textarea>

		<div
			class="absolute flex items-center gap-4 p-2 -translate-x-1/2 border rounded-md left-1/2 bottom-8 bg-background text-muted-foreground w-fit"
			role="toolbar"
			aria-label="Markdown editor toolbar"
			tabindex={0}
			on:mousedown|preventDefault
		>
			<Button variant="ghost" size="icon" on:click={addHeading1}
				><Heading1 class="w-4 h-4" /></Button
			>

			<Button variant="ghost" size="icon" on:click={addHeading2}
				><Heading2 class="w-4 h-4" /></Button
			>

			<Button variant="ghost" size="icon" on:click={addBold}>
				<strong>B</strong>
			</Button>

			<Button variant="ghost" size="icon" on:click={addItalic}>
				<em>I</em>
			</Button>

			<Button variant="ghost" size="icon" on:click={addBulletList}><List class="w-4 h-4" /></Button>

			<Button variant="ghost" size="icon" on:click={addNumberedList}
				><ListOrdered class="w-4 h-4" /></Button
			>

			<Button variant="ghost" size="icon" on:click={addCheckbox}
				><ListTodo class="w-4 h-4" /></Button
			>

			<Button variant="ghost" size="icon" on:click={addCodeBlock}><Code class="w-4 h-4" /></Button>

			<Button variant="ghost" size="icon" on:click={addImage}><ImagePlus class="w-4 h-4" /></Button>
		</div>
	</div>
{:else}
	<button class="flex w-full h-full text-left" on:click={switchToEditing}>
		<div
			class="flex flex-col w-full h-full p-2.5 text-base prose prose-sm max-w-none overflow-y-auto"
		>
			<div
				class="note-preview [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-2.5 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-2 [&>ul]:list-disc [&>ul]:ml-5 [&>ol]:list-decimal [&>ol]:ml-5 [&>img]:max-w-full [&>img]:h-auto [&>img]:my-2.5 [&>p]:mb-4 [&>p]:whitespace-pre-line"
			>
				{@html parsedContent}
			</div>
		</div>
	</button>
{/if}
