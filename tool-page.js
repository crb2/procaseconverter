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

    const SUN_SVG = `<svg class="theme-btn-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    const MOON_SVG = `<svg class="theme-btn-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

    const getSavedTheme = () => localStorage.getItem('theme') || 'dark';

    const applyTheme = theme => {
        const isDark = theme === 'dark';
        document.body.classList.toggle('dark-mode', isDark);
        localStorage.setItem('theme', theme);

        const themeBtn = document.getElementById('themeBtn');
        if (themeBtn) {
            if (isDark) {
                themeBtn.innerHTML = MOON_SVG;
                themeBtn.setAttribute('aria-label', 'Switch to Light Mode');
            } else {
                themeBtn.innerHTML = SUN_SVG;
                themeBtn.setAttribute('aria-label', 'Switch to Dark Mode');
            }
        }

        const toolInput = document.getElementById('toolInput');
        const toolOutput = document.getElementById('toolOutput');
        if (toolInput) toolInput.style.color = isDark ? '#ffffff' : '#1c1c1c';
        if (toolOutput) toolOutput.style.color = isDark ? '#ffffff' : '#1c1c1c';
    };

    const cycleTheme = () => {
        const current = getSavedTheme();
        const nextTheme = current === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);
    };

    const headerTop = document.querySelector('.header-top');
    if (headerTop && !document.getElementById('themeBtn')) {
        let headerLeft = headerTop.querySelector('.header-left');
        if (!headerLeft) {
            headerLeft = document.createElement('div');
            headerLeft.className = 'header-left';
            headerTop.insertBefore(headerLeft, headerTop.firstChild);
        }
        let headerRight = headerTop.querySelector('.header-right');
        if (!headerRight) {
            headerRight = document.createElement('div');
            headerRight.className = 'header-right';
            const siteNav = headerTop.querySelector('.site-nav');
            if (siteNav) headerRight.appendChild(siteNav);
            headerTop.appendChild(headerRight);
        }
        const themeArea = document.createElement('div');
        themeArea.className = 'theme-toggle-area';
        themeArea.innerHTML = `
            <button type="button" class="theme-toggle-btn" id="themeBtn" aria-label="Toggle Theme">
            </button>
            <button type="button" class="theme-toggle-btn" id="menuBtn" aria-label="Toggle Menu">
                <svg class="menu-btn-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
        `;
        headerRight.appendChild(themeArea);
        document.getElementById('themeBtn').addEventListener('click', cycleTheme);
        document.getElementById('menuBtn').addEventListener('click', toggleSideMenu);
    } else if (document.getElementById('themeBtn')) {
        document.getElementById('themeBtn').addEventListener('click', cycleTheme);
        if (document.getElementById('menuBtn')) {
            document.getElementById('menuBtn').addEventListener('click', toggleSideMenu);
        }
    }

    applyTheme(getSavedTheme());

    const hero = document.querySelector('.tool-hero');
    if (hero && !document.querySelector('.tool-page-controls')) {
        const controls = document.createElement('div');
        controls.className = 'header-controls tool-page-controls';
        controls.innerHTML = `
            <div class="toolbar">
                <div class="text-format-controls">
                    <div class="font-size-wrapper">
                        <button class="size-btn" type="button" id="toolMinusBtn" aria-label="Decrease font size"><svg class="size-btn-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><line x1="5" y1="12" x2="19" y2="12"/></svg></button>
                        <div class="size-display-container">
                            <span id="toolFontSizeDisplay">16</span>
                        </div>
                        <button class="size-btn" type="button" id="toolPlusBtn" aria-label="Increase font size"><svg class="size-btn-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>
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
                            <button class="icon-btn" type="button" id="toolUndoBtn"><span class="undo-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg></span></button>
                            <button class="icon-btn" type="button" id="toolRedoBtn"><span class="redo-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/></svg></span></button>
                        </div>
                    </div>
                </div>
                <div class="autosave-option">
                    <label class="checkbox-container">
                        <input type="checkbox" id="toolSaveProgress">
                        <span class="custom-checkbox"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
                        <span class="checkbox-label">Continue where I left off</span>
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
    pasteBtn.title = 'Paste from clipboard';
    pasteBtn.setAttribute('aria-label', 'Paste from clipboard');
    // Paste icon: clipboard with document being inserted
    pasteBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>`;
    const inputActions = input.closest('.tool-box')?.querySelector('.tool-actions');
    if (inputActions && !document.getElementById('pasteInput')) {
        inputActions.insertBefore(pasteBtn, inputActions.firstChild);
    }

    // Clear icon: circle with X
    if (clearBtn) {
        clearBtn.title = 'Clear input text';
        clearBtn.setAttribute('aria-label', 'Clear input text');
        clearBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    }

    // Copy icon: two overlapping documents
    if (copyBtn) {
        copyBtn.title = 'Copy to clipboard';
        copyBtn.setAttribute('aria-label', 'Copy to clipboard');
        copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
    }

    // Download icon: arrow pointing into a tray
    if (downloadBtn) {
        downloadBtn.title = 'Download as .txt';
        downloadBtn.setAttribute('aria-label', 'Download as .txt');
        downloadBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v13"/><polyline points="8 12 12 16 16 12"/><path d="M20 21H4"/></svg>`;
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

// --- DIRECTION-AWARE SCROLL NAVIGATION ---
function initScrollButtons() {
    if (document.getElementById('scrollTopBtn')) return;

    const scrollTopBtn = document.createElement('button');
    scrollTopBtn.id = 'scrollTopBtn';
    scrollTopBtn.className = 'scroll-nav-btn scroll-top-btn';
    scrollTopBtn.setAttribute('type', 'button');
    scrollTopBtn.setAttribute('aria-label', 'Scroll to Top');
    scrollTopBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`;
    document.body.appendChild(scrollTopBtn);

    const scrollBottomBtn = document.createElement('button');
    scrollBottomBtn.id = 'scrollBottomBtn';
    scrollBottomBtn.className = 'scroll-nav-btn scroll-bottom-btn';
    scrollBottomBtn.setAttribute('type', 'button');
    scrollBottomBtn.setAttribute('aria-label', 'Scroll to Bottom');
    scrollBottomBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>`;
    document.body.appendChild(scrollBottomBtn);

    function hideBothArrows() {
        scrollTopBtn.classList.remove('visible');
        scrollBottomBtn.classList.remove('visible');
    }

    scrollTopBtn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    scrollBottomBtn.addEventListener('click', function () {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    });

    let lastScrollY = window.scrollY;

    function updateScrollNav() {
        const currentScrollY = window.scrollY;
        const pageHeight = document.documentElement.scrollHeight;
        const viewHeight = window.innerHeight;
        const atTop = currentScrollY <= 2;
        const atBottom = !atTop && (currentScrollY + viewHeight >= pageHeight - 2);

        if (atTop || atBottom) {
            hideBothArrows();
        } else {
            const isScrollingDown = currentScrollY > lastScrollY;
            const isScrollingUp = currentScrollY < lastScrollY;

            if (isScrollingDown) {
                scrollBottomBtn.classList.add('visible');
                scrollTopBtn.classList.remove('visible');
            } else if (isScrollingUp) {
                scrollTopBtn.classList.add('visible');
                scrollBottomBtn.classList.remove('visible');
            }
        }

        lastScrollY = currentScrollY;
    }

    window.addEventListener('scroll', updateScrollNav, { passive: true });
    window.addEventListener('resize', updateScrollNav, { passive: true });
    updateScrollNav();
}

document.addEventListener('DOMContentLoaded', initScrollButtons);
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    initScrollButtons();
}

// --- RIGHT-SIDE CASE-TOOL MENU PANEL ---
const TOOL_ITEMS_HTML = `
    <a href="/sentence-case/">Sentence case</a>
    <a href="/lower-case/">lower case</a>
    <a href="/upper-case/">UPPER CASE</a>
    <a href="/capitalized-case/">Capitalized Case</a>
    <a href="/title-case/">Title Case</a>
    <a href="/snake-case/">Snake_Case</a>
    <a href="/kebab-case/">Kebab-Case</a>
    <a href="/train-case/">Train-Case</a>
    <a href="/dot-case/">dot.case</a>
    <a href="/path-case/">path/case</a>
    <a href="/space-case/">space case</a>
    <a href="/flatcase/">flatcase</a>
    <a href="/upperflatcase/">UPPERFLATCASE</a>
    <a href="/studlycaps-random-case/">StudlyCaps (Random Case)</a>
    <a href="/camel-case/">Camel Case</a>
    <a href="/pascal-case/">Pascal Case</a>
    <a href="/screaming-snake-case/">SCREAMING_SNAKE_CASE</a>
    <a href="/inverse-case/">iNVERSE cASE</a>
    <a href="/alternating-case/">aLtErNaTiNg cAsE</a>
    <a href="/reverse-case/">Reverse Case</a>
    <a href="/remove-emoji/">Remove Emoji</a>
    <a href="/remove-html/">Remove HTML</a>
`;

function createSideMenuPanel() {
    if (document.getElementById('sideMenuPanel')) return;

    const overlay = document.createElement('div');
    overlay.id = 'sideMenuOverlay';
    overlay.className = 'side-menu-overlay';
    overlay.onclick = closeSideMenu;
    document.body.appendChild(overlay);

    const panel = document.createElement('div');
    panel.id = 'sideMenuPanel';
    panel.className = 'side-menu-panel';
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML = `
        <div class="side-menu-header">
            <h3>Convert Case Tools</h3>
            <button type="button" class="side-menu-close" id="sideMenuCloseBtn" onclick="closeSideMenu()" aria-label="Close Menu">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>
        <div class="side-menu-grid">
            ${TOOL_ITEMS_HTML}
        </div>
    `;
    document.body.appendChild(panel);
}

function openSideMenu() {
    createSideMenuPanel();
    const panel = document.getElementById('sideMenuPanel');
    const overlay = document.getElementById('sideMenuOverlay');
    if (panel) {
        panel.classList.add('open');
        panel.setAttribute('aria-hidden', 'false');
    }
    if (overlay) {
        overlay.classList.add('open');
    }
}

function closeSideMenu() {
    const panel = document.getElementById('sideMenuPanel');
    const overlay = document.getElementById('sideMenuOverlay');
    if (panel) {
        panel.classList.remove('open');
        panel.setAttribute('aria-hidden', 'true');
    }
    if (overlay) {
        overlay.classList.remove('open');
    }
}

function toggleSideMenu() {
    const panel = document.getElementById('sideMenuPanel');
    if (panel && panel.classList.contains('open')) {
        closeSideMenu();
    } else {
        openSideMenu();
    }
}

document.addEventListener('click', function (e) {
    const panel = document.getElementById('sideMenuPanel');
    const menuBtn = document.getElementById('menuBtn');
    if (!panel || !panel.classList.contains('open')) return;

    if (!panel.contains(e.target) && (!menuBtn || !menuBtn.contains(e.target))) {
        closeSideMenu();
    }
});

window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeSideMenu();
    }
});
