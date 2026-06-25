const toolConfigs = {
    'sentence-case': {
        label: 'Sentence case',
        transform: text => text.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, s => s.toUpperCase())
    },
    'lower-case': {
        label: 'lower case',
        transform: text => text.toLowerCase()
    },
    'upper-case': {
        label: 'UPPER CASE',
        transform: text => text.toUpperCase()
    },
    'capitalized-case': {
        label: 'Capitalized Case',
        transform: text => text.toLowerCase().replace(/\b\w/g, s => s.toUpperCase())
    },
    'title-case': {
        label: 'Title Case',
        transform: text => {
            const smallWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on', 'or', 'per', 'the', 'to', 'vs', 'via'];
            const words = text.toLowerCase().split(/(\s+)/);
            return words.map((word, index) => {
                if (/^\s+$/.test(word)) return word;
                const isFirstOrLast = index === 0 || index === words.length - 1;
                if (!isFirstOrLast && smallWords.includes(word)) return word;
                return word.replace(/\b\w/g, s => s.toUpperCase());
            }).join('');
        }
    },
    'snake-case': {
        label: 'Snake_Case',
        transform: text => text.trim().replace(/\s+/g, '_')
    },
    'kebab-case': {
        label: 'Kebab-Case',
        transform: text => text.trim().replace(/\s+/g, '-')
    },
    'train-case': {
        label: 'Train-Case',
        transform: text => text.trim().toLowerCase().replace(/\b\w/g, s => s.toUpperCase()).replace(/\s+/g, '-')
    },
    'dot-case': {
        label: 'dot.case',
        transform: text => text.trim().toLowerCase().replace(/[-_\s/]+/g, '.')
    },
    'path-case': {
        label: 'path/case',
        transform: text => text.trim().toLowerCase().replace(/[-_\s.]+/g, '/')
    },
    'space-case': {
        label: 'space case',
        transform: text => text.trim().toLowerCase().replace(/[-_./]+/g, ' ').replace(/\s+/g, ' ')
    },
    'flatcase': {
        label: 'flatcase',
        transform: text => text.toLowerCase().replace(/[-_\s./]+/g, '')
    },
    'upperflatcase': {
        label: 'UPPERFLATCASE',
        transform: text => text.toUpperCase().replace(/[-_\s./]+/g, '')
    },
    'studlycaps-random-case': {
        label: 'StudlyCaps (Random Case)',
        transform: text => text.split('').map(c => /[a-z]/i.test(c) ? (Math.random() < 0.5 ? c.toLowerCase() : c.toUpperCase()) : c).join('')
    },
    'camel-case': {
        label: 'Camel Case',
        transform: text => text.trim().replace(/[-_\s]+(.)?/g, (match, char) => char ? char.toUpperCase() : '').replace(/^./, char => char.toLowerCase())
    },
    'pascal-case': {
        label: 'Pascal Case',
        transform: text => text.trim().replace(/(?:^|[-_\s]+)(.)?/g, (match, char) => char ? char.toUpperCase() : '')
    },
    'screaming-snake-case': {
        label: 'SCREAMING_SNAKE_CASE',
        transform: text => text.trim().toUpperCase().replace(/\s+/g, '_')
    },
    'inverse-case': {
        label: 'iNVERSE cASE',
        transform: text => text.split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('')
    },
    'alternating-case': {
        label: 'aLtErNaTiNg cAsE',
        transform: text => {
            const chars = text.toLowerCase().split('');
            for (let i = 0; i < chars.length; i++) if (i % 2 !== 0) chars[i] = chars[i].toUpperCase();
            return chars.join('');
        }
    },
    'reverse-case': {
        label: 'Reverse Case',
        transform: text => Array.from(text).reverse().join('')
    },
    'remove-emoji': {
        label: 'Remove Emoji',
        transform: text => text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\u200D]/gu, '')
    },
    'remove-html': {
        label: 'Remove HTML',
        transform: text => text.replace(/<[^>]*>/g, '')
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const page = document.querySelector('.tool-page');
    if (!page) return;

    const config = toolConfigs[page.dataset.tool];
    const input = document.getElementById('toolInput');
    const output = document.getElementById('toolOutput');
    const copyBtn = document.getElementById('copyOutput');
    const downloadBtn = document.getElementById('downloadOutput');
    const clearBtn = document.getElementById('clearInput');

    if (!config || !input || !output) return;

    const storageKey = `toolPage:${page.dataset.tool}`;
    let currentFontSize = parseInt(localStorage.getItem(`${storageKey}:fontSize`), 10) || 16;
    let undoStack = [];
    let redoStack = [];
    let lastInputValue = input.value;

    const toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);

    let toastTimer;
    const showToast = message => {
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
    };

    const headerTop = document.querySelector('.header-top');
    if (headerTop && !document.getElementById('themeCheckbox')) {
        const themeArea = document.createElement('div');
        themeArea.className = 'theme-toggle-area';
        themeArea.innerHTML = `
            <div class="theme-toggle">
                <span class="icon">☀️</span>
                <label class="switch">
                    <input type="checkbox" id="themeCheckbox" checked>
                    <span class="slider round"></span>
                </label>
                <span class="icon">🌙</span>
            </div>
        `;
        headerTop.appendChild(themeArea);
    }

    const themeCheckbox = document.getElementById('themeCheckbox');
    const applyTheme = isDark => {
        document.body.classList.toggle('dark-mode', isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    };

    if (themeCheckbox) {
        const savedTheme = localStorage.getItem('theme');
        const isDark = savedTheme !== 'light';
        themeCheckbox.checked = isDark;
        applyTheme(isDark);
        themeCheckbox.addEventListener('change', () => applyTheme(themeCheckbox.checked));
    }

    const hero = document.querySelector('.tool-hero');
    if (hero && !document.querySelector('.tool-page-controls')) {
        const controls = document.createElement('div');
        controls.className = 'header-controls tool-page-controls';
        controls.innerHTML = `
            <div class="toolbar">
                <div class="text-format-controls">
                    <div class="font-size-wrapper">
                        <button class="size-btn" type="button" id="toolMinusBtn">−</button>
                        <div class="size-display-container">
                            <span id="toolFontSizeDisplay">16</span>
                        </div>
                        <button class="size-btn" type="button" id="toolPlusBtn">+</button>
                    </div>
                    <button class="format-btn" type="button" id="toolBoldBtn"><strong>B</strong></button>
                    <button class="format-btn" type="button" id="toolItalicBtn"><em>I</em></button>
                    <div class="align-history-controls">
                        <div class="align-group">
                            <button class="format-btn" type="button" data-align="left">Left</button>
                            <button class="format-btn" type="button" data-align="center">Center</button>
                            <button class="format-btn" type="button" data-align="right">Right</button>
                        </div>
                        <div class="history-controls">
                            <button class="icon-btn" type="button" id="toolUndoBtn"><span class="undo-icon">↺</span></button>
                            <button class="icon-btn" type="button" id="toolRedoBtn"><span class="redo-icon">↻</span></button>
                        </div>
                    </div>
                </div>
                <div class="autosave-option">
                    <label class="checkbox-container">
                        <input type="checkbox" id="toolSaveProgress">
                        <span>Continue where I left off</span>
                    </label>
                </div>
            </div>
        `;
        hero.after(controls);
    }

    const workspace = document.querySelector('.tool-workspace');
    let stats;
    if (workspace && !document.querySelector('.tool-stats')) {
        stats = document.createElement('div');
        stats.className = 'stats tool-stats';
        stats.innerHTML = `
            <strong>Character Count:</strong> <span id="toolCharCount">0</span> |
            <strong>Character Count (without space):</strong> <span id="toolCharNoSpaceCount">0</span> |
            <strong>Words:</strong> <span id="toolWordCount">0</span> |
            <strong>Lines:</strong> <span id="toolLineCount">0</span> |
            <strong>Paragraphs:</strong> <span id="toolParagraphCount">0</span> |
            <strong>Sentences:</strong> <span id="toolSentenceCount">0</span>
        `;
        workspace.after(stats);
    }

    const pasteBtn = document.createElement('button');
    pasteBtn.type = 'button';
    pasteBtn.id = 'pasteInput';
    pasteBtn.title = 'Paste input';
    pasteBtn.setAttribute('aria-label', 'Paste input');
    const inputActions = input.closest('.tool-box')?.querySelector('.tool-actions');
    if (inputActions && !document.getElementById('pasteInput')) {
        inputActions.insertBefore(pasteBtn, inputActions.firstChild);
    }

    const saveCheckbox = document.getElementById('toolSaveProgress');
    const savedText = localStorage.getItem(`${storageKey}:input`);
    if (saveCheckbox) {
        saveCheckbox.checked = localStorage.getItem(`${storageKey}:save`) === 'true';
        if (saveCheckbox.checked && savedText !== null) {
            input.value = savedText;
            lastInputValue = input.value;
        }
        saveCheckbox.addEventListener('change', () => {
            localStorage.setItem(`${storageKey}:save`, saveCheckbox.checked);
            if (!saveCheckbox.checked) localStorage.removeItem(`${storageKey}:input`);
        });
    }

    const applyFontSize = () => {
        input.style.fontSize = `${currentFontSize}px`;
        output.style.fontSize = `${currentFontSize}px`;
        const display = document.getElementById('toolFontSizeDisplay');
        if (display) display.textContent = currentFontSize;
        localStorage.setItem(`${storageKey}:fontSize`, currentFontSize);
    };

    const updateStats = () => {
        const text = input.value || "";
        const trimmedText = text.trim();
        const lineText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n$/, '');
        const charCount = document.getElementById('toolCharCount');
        const charNoSpaceCount = document.getElementById('toolCharNoSpaceCount');
        const wordCount = document.getElementById('toolWordCount');
        const lineCount = document.getElementById('toolLineCount');
        const paragraphCount = document.getElementById('toolParagraphCount');
        const sentenceCount = document.getElementById('toolSentenceCount');

        if (charCount) charCount.textContent = text.length;
        if (charNoSpaceCount) charNoSpaceCount.textContent = text.replace(/\s/g, '').length;
        if (wordCount) wordCount.textContent = trimmedText === "" ? 0 : trimmedText.split(/\s+/).length;
        if (lineCount) lineCount.textContent = lineText === "" ? 0 : lineText.split('\n').length;
        if (paragraphCount) paragraphCount.textContent = trimmedText === "" ? 0 : trimmedText.split(/\n\s*\n|(?:\r\n|\r|\n)/).filter(p => p.trim() !== "").length;
        if (sentenceCount) sentenceCount.textContent = trimmedText === "" ? 0 : (trimmedText.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || []).filter(s => s.trim() !== "").length;
    };

    const saveInput = () => {
        if (saveCheckbox && saveCheckbox.checked) {
            localStorage.setItem(`${storageKey}:input`, input.value);
        }
    };

    const updateOutput = () => {
        output.value = config.transform(input.value);
        updateStats();
        saveInput();
    };

    const pushUndoState = () => {
        if (input.value !== lastInputValue) {
            undoStack.push(lastInputValue);
            if (undoStack.length > 50) undoStack.shift();
            redoStack = [];
            lastInputValue = input.value;
        }
    };

    const saveUndoBeforeManualChange = () => {
        undoStack.push(input.value);
        if (undoStack.length > 50) undoStack.shift();
        redoStack = [];
    };

    input.addEventListener('input', () => {
        pushUndoState();
        updateOutput();
    });
    updateOutput();
    applyFontSize();

    document.getElementById('toolMinusBtn')?.addEventListener('click', () => {
        currentFontSize = Math.max(10, currentFontSize - 1);
        applyFontSize();
    });

    document.getElementById('toolPlusBtn')?.addEventListener('click', () => {
        currentFontSize = Math.min(100, currentFontSize + 1);
        applyFontSize();
    });

    document.getElementById('toolBoldBtn')?.addEventListener('click', event => {
        const isBold = input.style.fontWeight === 'bold';
        input.style.fontWeight = isBold ? 'normal' : 'bold';
        output.style.fontWeight = input.style.fontWeight;
        event.currentTarget.classList.toggle('active', !isBold);
    });

    document.getElementById('toolItalicBtn')?.addEventListener('click', event => {
        const isItalic = input.style.fontStyle === 'italic';
        input.style.fontStyle = isItalic ? 'normal' : 'italic';
        output.style.fontStyle = input.style.fontStyle;
        event.currentTarget.classList.toggle('active', !isItalic);
    });

    document.querySelectorAll('[data-align]').forEach(button => {
        button.addEventListener('click', () => {
            input.style.textAlign = button.dataset.align;
            output.style.textAlign = button.dataset.align;
        });
    });

    document.getElementById('toolUndoBtn')?.addEventListener('click', () => {
        if (undoStack.length === 0) return;
        redoStack.push(input.value);
        input.value = undoStack.pop();
        lastInputValue = input.value;
        updateOutput();
    });

    document.getElementById('toolRedoBtn')?.addEventListener('click', () => {
        if (redoStack.length === 0) return;
        undoStack.push(input.value);
        input.value = redoStack.pop();
        lastInputValue = input.value;
        updateOutput();
    });

    pasteBtn.addEventListener('click', () => {
        if (!navigator.clipboard || !navigator.clipboard.readText) {
            showToast('Clipboard paste is not available.');
            return;
        }

        navigator.clipboard.readText().then(text => {
            saveUndoBeforeManualChange();
            const start = input.selectionStart;
            const end = input.selectionEnd;
            input.setRangeText(text, start, end, 'end');
            lastInputValue = input.value;
            updateOutput();
            input.focus();
            showToast('Pasted from clipboard!');
        }).catch(() => showToast('Clipboard paste is not available.'));
    });

    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(output.value).then(() => showToast('Copied to clipboard!'));
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            const blob = new Blob([output.value], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${page.dataset.tool}.txt`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('Downloaded .txt file!');
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            saveUndoBeforeManualChange();
            input.value = '';
            lastInputValue = input.value;
            updateOutput();
            input.focus();
            showToast('Input cleared!');
        });
    }
});
