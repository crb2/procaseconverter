const textArea = document.getElementById('textInput');
const charCount = document.getElementById('charCount');
const wordCount = document.getElementById('wordCount');
const lineCount = document.getElementById('lineCount');
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

// --- 1. INITIALIZATION ---
window.addEventListener('load', () => {
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
});

// --- 2. INPUT & CLEAN PASTE ---
function handleInput() {
    if (textArea.innerText === "\n") { textArea.innerHTML = ""; }
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
    charCount.innerText = text.length;
    wordCount.innerText = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
    lineCount.innerText = (text === "" || text === "\n") ? 0 : text.split(/\r|\r\n|\n/).length;
}

function saveState() {
    if (historyStack.length === 0 || historyStack[historyStack.length - 1] !== textArea.innerHTML) {
        historyStack.push(textArea.innerHTML);
        if (historyStack.length > 50) historyStack.shift(); 
        redoStack = []; 
        autoSave();
    }
}

function applyTransformation(action) {
    saveState();
    let text = textArea.innerText.replace(/\n$/, "");
    let placeholder = textArea.getAttribute('data-placeholder');

    // 1. Update the placeholder attribute so the "hint" transforms
    if (placeholder) {
        textArea.setAttribute('data-placeholder', action(placeholder));
    }

    // 2. Only update the actual workspace content if it's not empty
    if (text && text.trim() !== "") {
        textArea.innerText = action(text);
        updateStats();
    }
    
    autoSave();
}

function toUpperCase() { applyTransformation(t => t.toUpperCase()); }
function toLowerCase() { applyTransformation(t => t.toLowerCase()); }

function toSentenceCase() { 
    applyTransformation(t => t.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, s => s.toUpperCase())); 
}

function toCapitalizedCase() { 
    applyTransformation(t => t.toLowerCase().replace(/\b\w/g, s => s.toUpperCase())); 
}

function toInverseCase() { applyTransformation(t => t.split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('')); }
function toAlternatingCase() { applyTransformation(t => { let chars = t.toLowerCase().split(''); for (let i = 0; i < chars.length; i++) if (i % 2 !== 0) chars[i] = chars[i].toUpperCase(); return chars.join(''); }); }

// --- 7. HISTORY ACTIONS ---
function undo() { if (historyStack.length > 0) { redoStack.push(textArea.innerHTML); textArea.innerHTML = historyStack.pop(); updateStats(); autoSave(); } }
function redo() { if (redoStack.length > 0) { historyStack.push(textArea.innerHTML); textArea.innerHTML = redoStack.pop(); updateStats(); autoSave(); } }

function startHistoryHold(action) { action(); historyTimer = setTimeout(() => { historyTimer = setInterval(action, 200); }, 500); }
function stopHistoryHold() { clearTimeout(historyTimer); clearInterval(historyTimer); }

undoBtn.addEventListener('mousedown', () => startHistoryHold(undo));
redoBtn.addEventListener('mousedown', () => startHistoryHold(redo));
window.addEventListener('mouseup', stopHistoryHold);

window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    if (e.ctrlKey && e.key === 'Z' && e.shiftKey) { e.preventDefault(); redo(); }
    if (e.ctrlKey && e.key === 'b') { e.preventDefault(); toggleBold(); }
    if (e.ctrlKey && e.key === 'i') { e.preventDefault(); toggleItalic(); }
});

function clearText() { saveState(); textArea.innerHTML = ''; updateStats(); localStorage.removeItem('caseConverterTextHTML'); }

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