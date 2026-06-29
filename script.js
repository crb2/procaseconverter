const textArea = document.getElementById('textInput');
const charCount = document.getElementById('charCount');
const charNoSpaceCount = document.getElementById('charNoSpaceCount');
const wordCount = document.getElementById('wordCount');
const lineCount = document.getElementById('lineCount');
const paragraphCount = document.getElementById('paragraphCount');
const sentenceCount = document.getElementById('sentenceCount');
const themeCheckbox = document.getElementById('themeCheckbox');
const saveCheckbox = document.getElementById('saveProgress');
const fontSizeDisplay = document.getElementById('fontSizeDisplay');
const fontSizeInput = document.getElementById('fontSizeInput');
const minusBtn = document.getElementById('minusBtn');
const plusBtn = document.getElementById('plusBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const boldBtn = document.getElementById('boldBtn');
const italicBtn = document.getElementById('italicBtn');

let historyStack = [];
let redoStack = [];
let currentFontSize = 16;
let holdTimer;
let historyTimer;
let lastHistoryState = '';
let isRestoringHistory = false;
let transformationToggles = {};

function initializeToolMenu() {
    const menu = document.querySelector('.tool-menu');
    const menuButton = menu?.querySelector('button');
    const menuList = menu?.querySelector('.tool-menu-list');
    if (!menu || !menuButton || !menuList) return;

    let pinnedOpen = false;

    const syncMenuState = () => {
        menu.classList.toggle('is-open', pinnedOpen);
        menuButton.setAttribute('aria-expanded', String(
            pinnedOpen || menu.classList.contains('is-hovered')
        ));
    };

    const setHovered = isHovered => {
        if (window.innerWidth <= 600) return;
        menu.classList.toggle('is-hovered', isHovered);
        syncMenuState();
    };

    syncMenuState();

    menu.addEventListener('mouseenter', () => setHovered(true));
    menu.addEventListener('mouseleave', () => setHovered(false));

    menuButton.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        pinnedOpen = !pinnedOpen;
        syncMenuState();
    });

    menuList.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            pinnedOpen = false;
            menu.classList.remove('is-hovered');
            syncMenuState();
        });
    });

    document.addEventListener('click', event => {
        if (!menu.contains(event.target)) {
            pinnedOpen = false;
            menu.classList.remove('is-hovered');
            syncMenuState();
        }
    });

    window.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            pinnedOpen = false;
            menu.classList.remove('is-hovered');
            syncMenuState();
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth <= 600) {
            menu.classList.remove('is-hovered');
        }
        if (window.innerWidth > 600) {
            pinnedOpen = false;
        }
        syncMenuState();
    });
}

// --- 1. INITIALIZATION ---
window.addEventListener('load', () => {
    initializeToolMenu();

    const shouldSave = localStorage.getItem('allowAutoSave') === 'true';
    saveCheckbox.checked = shouldSave;
    
    if (shouldSave) {
        const savedText = localStorage.getItem('caseConverterTextHTML');
        if (savedText) { textArea.innerHTML = savedText; updateStats(); }
        
        const savedHistory = localStorage.getItem('caseConverterHistory');
        const savedRedo = localStorage.getItem('caseConverterRedo');
        if (savedHistory) historyStack = JSON.parse(savedHistory);
        if (savedRedo) redoStack = JSON.parse(savedRedo);

        if (localStorage.getItem('textareaWeight') === 'bold') { textArea.style.fontWeight = 'bold'; boldBtn.classList.add('active'); }
        if (localStorage.getItem('textareaItalic') === 'italic') { textArea.style.fontStyle = 'italic'; italicBtn.classList.add('active'); }
        
        const savedAlign = localStorage.getItem('textareaAlign');
        if (savedAlign) textArea.style.textAlign = savedAlign;
    }

    const savedFontSize = localStorage.getItem('textareaFontSize');
    currentFontSize = savedFontSize ? parseInt(savedFontSize) : 16;
    applyFontSize();
    
    const savedTheme = localStorage.getItem('theme');
    if(savedTheme === 'light') {
        themeCheckbox.checked = false;
        document.body.classList.remove('dark-mode');
        textArea.style.color = "#000000";
    } else {
        themeCheckbox.checked = true;
        document.body.classList.add('dark-mode');
        textArea.style.color = "#ffffff";
    }

    lastHistoryState = textArea.innerHTML;
});

// --- 2. INPUT & CLEAN PASTE ---
function handleInput() {
    if (textArea.innerText === "\n") { textArea.innerHTML = ""; }
    if (!isRestoringHistory && textArea.innerHTML !== lastHistoryState) {
        saveState(lastHistoryState);
        lastHistoryState = textArea.innerHTML;
    }
    updateStats(); 
    autoSave(); 
}

textArea.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = (e.originalEvent || e).clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    updateStats();
    autoSave();
});

// --- 3. FORMATTING LOGIC ---
function toggleBold() {
    const selection = window.getSelection();
    if (selection.toString().length > 0) {
        document.execCommand('bold', false, null);
    } else {
        const isBold = textArea.style.fontWeight === 'bold';
        textArea.style.fontWeight = isBold ? 'normal' : 'bold';
        boldBtn.classList.toggle('active', !isBold);
        if (saveCheckbox.checked) localStorage.setItem('textareaWeight', textArea.style.fontWeight);
    }
    autoSave();
}

function toggleItalic() {
    const selection = window.getSelection();
    if (selection.toString().length > 0) {
        document.execCommand('italic', false, null);
    } else {
        const isItalic = textArea.style.fontStyle === 'italic';
        textArea.style.fontStyle = isItalic ? 'normal' : 'italic';
        italicBtn.classList.toggle('active', !isItalic);
        if (saveCheckbox.checked) localStorage.setItem('textareaItalic', textArea.style.fontStyle);
    }
    autoSave();
}

function setTextAlign(align) {
    textArea.style.textAlign = align;
    if (saveCheckbox.checked) localStorage.setItem('textareaAlign', align);
}

// --- 4. FONT SIZE ---
function applyFontSize() {
    textArea.style.fontSize = currentFontSize + 'px';
    fontSizeDisplay.innerText = currentFontSize;
}

function updateFontSize(val) {
    currentFontSize = Math.min(Math.max(val, 10), 100);
    applyFontSize();
    localStorage.setItem('textareaFontSize', currentFontSize);
}

function startHold(delta) {
    updateFontSize(currentFontSize + (delta > 0 ? 1 : -1));
    holdTimer = setTimeout(() => {
        holdTimer = setInterval(() => {
            let nextVal = (delta > 0) ? (Math.floor(currentFontSize / 5) * 5) + 5 : (Math.ceil(currentFontSize / 5) * 5) - 5;
            updateFontSize(nextVal);
        }, 150);
    }, 500);
}

function stopHold() { clearTimeout(holdTimer); clearInterval(holdTimer); }

minusBtn.addEventListener('mousedown', () => startHold(-5));
plusBtn.addEventListener('mousedown', () => startHold(5));
window.addEventListener('mouseup', stopHold);
minusBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startHold(-5); });
plusBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startHold(5); });
window.addEventListener('touchend', stopHold);

// --- 5. PERSISTENCE & UI ---
function autoSave() { 
    if (saveCheckbox.checked) {
        localStorage.setItem('caseConverterTextHTML', textArea.innerHTML);
        localStorage.setItem('caseConverterHistory', JSON.stringify(historyStack));
        localStorage.setItem('caseConverterRedo', JSON.stringify(redoStack));
    }
}

function toggleSavePreference() {
    localStorage.setItem('allowAutoSave', saveCheckbox.checked);
    if (!saveCheckbox.checked) {
        localStorage.removeItem('caseConverterTextHTML');
        localStorage.removeItem('caseConverterHistory');
        localStorage.removeItem('caseConverterRedo');
    }
}

function toggleTheme() {
    const isDark = themeCheckbox.checked;
    document.body.classList.toggle('dark-mode', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    if (!isDark) {
        textArea.style.color = "#000000";
    } else {
        textArea.style.color = "#ffffff";
    }
}

function closeTooltip(e, el) { e.stopPropagation(); el.parentElement.style.display = 'none'; }

// --- 6. CORE TRANSFORMATIONS ---
function updateStats() {
    const text = textArea.innerText || "";
    const trimmedText = text.trim();
    const lineText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n$/, '');
    charCount.innerText = text.length;
    charNoSpaceCount.innerText = text.replace(/\s/g, '').length;
    wordCount.innerText = trimmedText === "" ? 0 : trimmedText.split(/\s+/).length;
    lineCount.innerText = lineText === "" ? 0 : lineText.split('\n').length;
    paragraphCount.innerText = trimmedText === "" ? 0 : trimmedText.split(/\n\s*\n|(?:\r\n|\r|\n)/).filter(p => p.trim() !== "").length;
    sentenceCount.innerText = trimmedText === "" ? 0 : (trimmedText.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || []).filter(s => s.trim() !== "").length;
}

function saveState(state = textArea.innerHTML) {
    if (historyStack.length === 0 || historyStack[historyStack.length - 1] !== state) {
        historyStack.push(state);
        if (historyStack.length > 50) historyStack.shift(); 
        redoStack = []; 
        autoSave();
    }
}

function applyTransformation(action, toggleKey) {
    saveState();
    // Strip trailing newline added by contenteditable to prevent extra spaces
    let text = textArea.innerText.replace(/\n$/, "");

    if (toggleKey && transformationToggles[toggleKey] && transformationToggles[toggleKey].converted === text) {
        textArea.innerText = transformationToggles[toggleKey].original;
    } else {
        const converted = action(text);
        if (toggleKey) {
            transformationToggles[toggleKey] = {
                original: text,
                converted: converted
            };
        }
        textArea.innerText = converted;
    }

    lastHistoryState = textArea.innerHTML;
    updateStats();
    autoSave();
}

function toUpperCase() { applyTransformation(t => t.toUpperCase(), 'upper'); }
function toLowerCase() { applyTransformation(t => t.toLowerCase(), 'lower'); }

function toSentenceCase() { 
    applyTransformation(t => t.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, s => s.toUpperCase()), 'sentence'); 
}

function toCapitalizedCase() { 
    applyTransformation(t => t.toLowerCase().replace(/\b\w/g, s => s.toUpperCase()), 'capitalized'); 
}

function toTitleCase() {
    applyTransformation(t => {
        const smallWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on', 'or', 'per', 'the', 'to', 'vs', 'via'];
        const words = t.toLowerCase().split(/(\s+)/);

        return words.map((word, index) => {
            if (/^\s+$/.test(word)) return word;
            const isFirstOrLast = index === 0 || index === words.length - 1;
            if (!isFirstOrLast && smallWords.includes(word)) return word;
            return word.replace(/\b\w/g, s => s.toUpperCase());
        }).join('');
    }, 'title');
}

function toSnakeCase() {
    applyTransformation(t => {
        const text = t.trim();

        return text.replace(/\s+/g, '_');
    }, 'snake');
}

function toKebabCase() {
    applyTransformation(t => {
        const text = t.trim();

        return text.replace(/\s+/g, '-');
    }, 'kebab');
}

function toTrainCase() {
    applyTransformation(t => {
        const text = t.trim();

        return text.toLowerCase().replace(/\b\w/g, s => s.toUpperCase()).replace(/\s+/g, '-');
    }, 'train');
}

function toDotCase() {
    applyTransformation(t => {
        const text = t.trim();

        return text.toLowerCase().replace(/[-_\s/]+/g, '.');
    }, 'dot');
}

function toPathCase() {
    applyTransformation(t => {
        const text = t.trim();

        return text.toLowerCase().replace(/[-_\s.]+/g, '/');
    }, 'path');
}

function toSpaceCase() {
    applyTransformation(t => {
        const text = t.trim();

        return text.toLowerCase().replace(/[-_./]+/g, ' ').replace(/\s+/g, ' ');
    }, 'space');
}

function toFlatCase() {
    applyTransformation(t => t.toLowerCase().replace(/[-_\s./]+/g, ''), 'flat');
}

function toUpperFlatCase() {
    applyTransformation(t => t.toUpperCase().replace(/[-_\s./]+/g, ''), 'upperFlat');
}

function toStudlyCaps() {
    applyTransformation(t => t.split('').map(c => /[a-z]/i.test(c) ? (Math.random() < 0.5 ? c.toLowerCase() : c.toUpperCase()) : c).join(''), 'studlyCaps');
}

function toCamelCase() {
    applyTransformation(t => {
        const text = t.trim();

        return text
            .replace(/[-_\s]+(.)?/g, (match, char) => char ? char.toUpperCase() : '')
            .replace(/^./, char => char.toLowerCase());
    }, 'camel');
}

function toPascalCase() {
    applyTransformation(t => {
        const text = t.trim();

        return text
            .replace(/(?:^|[-_\s]+)(.)?/g, (match, char) => char ? char.toUpperCase() : '');
    }, 'pascal');
}

function toScreamingSnakeCase() {
    applyTransformation(t => {
        const text = t.trim();

        return text.toUpperCase().replace(/\s+/g, '_');
    }, 'screamingSnake');
}

function toInverseCase() { applyTransformation(t => t.split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join(''), 'inverse'); }
function toAlternatingCase() { applyTransformation(t => { let chars = t.toLowerCase().split(''); for (let i = 0; i < chars.length; i++) if (i % 2 !== 0) chars[i] = chars[i].toUpperCase(); return chars.join(''); }, 'alternating'); }
function toReverseCase() { applyTransformation(t => Array.from(t).reverse().join(''), 'reverse'); }
function removeEmoji() { applyTransformation(t => t.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\u200D]/gu, ''), 'removeEmoji'); }
function removeHTML() {
    const html = textArea.innerHTML;
    const text = textArea.innerText.replace(/\n$/, "");
    const savedToggle = transformationToggles.removeHTML;

    if (savedToggle && savedToggle.converted === text) {
        return;
    } else {
        saveState();
        const hasLiteralHTMLTags = /<[^>]*>/g.test(text);
        let converted;

        if (hasLiteralHTMLTags) {
            converted = text.replace(/<[^>]*>/g, '');
        } else {
            const temp = document.createElement('div');
            temp.innerHTML = html;
            converted = temp.innerText.replace(/\n$/, "");
        }

        transformationToggles.removeHTML = {
            originalHTML: html,
            originalText: text,
            converted: converted,
            restoreAsHTML: !hasLiteralHTMLTags
        };

        textArea.innerText = converted;
    }

    lastHistoryState = textArea.innerHTML;
    updateStats();
    autoSave();
}

// --- 7. HISTORY ACTIONS ---
function undo() { if (historyStack.length > 0) { isRestoringHistory = true; redoStack.push(textArea.innerHTML); textArea.innerHTML = historyStack.pop(); lastHistoryState = textArea.innerHTML; updateStats(); autoSave(); isRestoringHistory = false; } }
function redo() { if (redoStack.length > 0) { isRestoringHistory = true; historyStack.push(textArea.innerHTML); textArea.innerHTML = redoStack.pop(); lastHistoryState = textArea.innerHTML; updateStats(); autoSave(); isRestoringHistory = false; } }

function startHistoryHold(action) { action(); historyTimer = setTimeout(() => { historyTimer = setInterval(action, 200); }, 500); }
function stopHistoryHold() { clearTimeout(historyTimer); clearInterval(historyTimer); }

undoBtn.addEventListener('mousedown', () => startHistoryHold(undo));
redoBtn.addEventListener('mousedown', () => startHistoryHold(redo));
window.addEventListener('mouseup', stopHistoryHold);

window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    if (e.ctrlKey && e.key.toLowerCase() === 'z' && e.shiftKey) { e.preventDefault(); redo(); }
    if (e.ctrlKey && e.key === 'b') { e.preventDefault(); toggleBold(); }
    if (e.ctrlKey && e.key === 'i') { e.preventDefault(); toggleItalic(); }
});

function clearText() { saveState(); textArea.innerHTML = ''; lastHistoryState = textArea.innerHTML; updateStats(); localStorage.removeItem('caseConverterTextHTML'); }

function downloadText() {
    const blob = new Blob([textArea.innerText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = "text.txt"; a.click();
}

function copyText() {
    navigator.clipboard.writeText(textArea.innerText).then(() => {
        const toast = document.getElementById('copyToast');
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    });
}
