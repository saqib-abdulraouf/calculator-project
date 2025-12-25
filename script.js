// Generate QR Code using API (More reliable than external JS lib)
const currentURL = window.location.href;
const qrContainer = document.getElementById("qrcode");
if (qrContainer) {
    const qrImage = document.createElement("img");
    qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent("https://saqib-abdulraouf.github.io/calculator-project/")}`;
    qrImage.alt = "Scan to open on phone";
    qrContainer.innerHTML = ''; // Clear previous content if any
    qrContainer.appendChild(qrImage);
}

let expr = '';
let result = '0'; // Current display result
let lastAns = '0'; // Previous calculation result for 'Ans'
let memory = 0; // Memory value
let shiftMode = false;
let isOn = true;
let cursorPos = 0;

function updateDisplay() {
    document.getElementById('expression').textContent = expr;

    // Display with cursor only when typing
    if (isOn && expr.length > 0 && result === expr) {
        let displayText = expr.slice(0, cursorPos) + '|' + expr.slice(cursorPos);
        document.getElementById('result').textContent = displayText;
    } else {
        document.getElementById('result').textContent = result;
    }
}

function insertNum(n) {
    if (!isOn) return;
    if (result !== '0' && result !== expr && expr === '') {
        // Start new calculation if typing after result
        expr = n;
        cursorPos = 1;
    } else if (result === '0' && expr === '') {
        expr = n;
        cursorPos = 1;
    } else {
        expr = expr.slice(0, cursorPos) + n + expr.slice(cursorPos);
        cursorPos++;
    }
    result = expr;
    updateDisplay();
}

function insertOp(op) {
    if (!isOn) return;
    expr = expr.slice(0, cursorPos) + op + expr.slice(cursorPos);
    cursorPos++;
    result = expr;
    updateDisplay();
}

function insertFunc(fn) {
    if (!isOn) return;

    // Handle Memory operations immediately
    if (fn === 'M+') {
        memory += parseFloat(result || 0);
        // Briefly show 'M' indicator or something? For now just keep result.
        expr = ''; // Reset expression start new
        cursorPos = 0;
        return;
    }
    if (fn === 'M-') {
        memory -= parseFloat(result || 0);
        expr = '';
        cursorPos = 0;
        return;
    }

    expr = expr.slice(0, cursorPos) + fn + expr.slice(cursorPos);
    cursorPos += fn.length;
    result = expr;
    updateDisplay();
}

function deleteLast() {
    if (!isOn) return;
    if (cursorPos > 0) {
        // Basic delete handling - could be improved for functions
        expr = expr.slice(0, cursorPos - 1) + expr.slice(cursorPos);
        cursorPos--;
    }
    result = expr || '0';
    updateDisplay();
}

function clearAll() {
    if (!isOn) return;
    expr = '';
    result = '0';
    cursorPos = 0;
    updateDisplay();
}

// Math Helper Functions
function factorial(n) {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
}

function combinations(n, r) {
    if (n < r) return 0;
    return factorial(n) / (factorial(r) * factorial(n - r));
}

function pol(x, y) {
    return Math.sqrt(x * x + y * y);
}

function rec(r, theta) {
    // Convert Polar to Rectangular (returns X only for simplicity)
    return r * Math.cos(theta * Math.PI / 180);
}

function calculate() {
    if (!isOn) return;
    try {
        let evalExpr = expr
            .replace(/Ans/g, lastAns)
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/−/g, '-')
            .replace(/\|/g, '') // Remove cursor marker
            .replace(/°/g, '') // Remove degree symbol for now
            .replace(/STO/g, ''); // Ignore STO for now

        // Handle Functions
        evalExpr = evalExpr
            .replace(/sqrt\(/g, 'Math.sqrt(')
            .replace(/log\(/g, 'Math.log10(')
            .replace(/ln\(/g, 'Math.log(')
            .replace(/sin\(/g, 'Math.sin(')
            .replace(/cos\(/g, 'Math.cos(')
            .replace(/tan\(/g, 'Math.tan(')
            .replace(/Pol\(/g, 'pol(')
            .replace(/Rec\(/g, 'rec(')
            .replace(/\^/g, '**')
            .replace(/EXP/g, 'e');

        // Handle Postfix/Infix transformations
        // x! -> factorial(x) - simple regex for single digits or parenthesized groups
        // Note: Full parsing is complex, this handles basic cases like 5! or (2+3)!
        evalExpr = evalExpr.replace(/(\d+|\([^)]+\))x!/g, 'factorial($1)');

        // nCr -> combinations(n, r)
        evalExpr = evalExpr.replace(/(\d+|\([^)]+\))nCr(\d+|\([^)]+\))/g, 'combinations($1, $2)');

        let calcResult = eval(evalExpr);

        // Save to Answer
        lastAns = calcResult.toString();

        // Format result
        result = calcResult.toString();
        if (result.length > 12) {
            result = parseFloat(result).toExponential(6);
        }

    } catch (e) {
        console.error(e);
        result = 'Error';
    }

    // Save to history before clearing
    if (expr && expr.trim() !== '') {
        history.push(expr);
        // Limit history size?
        if (history.length > 20) history.shift();
    }
    historyIndex = -1;

    // Reset expression to allow chaining or new calc
    // But keep result displayed
    expr = '';
    cursorPos = 0;
    updateDisplay();
}

let history = [];
let historyIndex = -1;

function handleReplay(e) {
    if (!isOn) return;

    // Get click position relative to the center of the pad
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    // Determine major axis
    if (Math.abs(x) > Math.abs(y)) {
        // Horizontal: Left or Right
        if (x > 0) cursorRight();
        else cursorLeft();
    } else {
        // Vertical: Up or Down
        if (y > 0) cursorDown();
        else cursorUp();
    }
}

function cursorLeft() {
    if (!isOn) return;
    if (cursorPos > 0) {
        cursorPos--;
        updateDisplay();
    }
}

function cursorRight() {
    if (!isOn) return;
    if (cursorPos < expr.length) {
        cursorPos++;
        updateDisplay();
    }
}

function cursorUp() {
    if (!isOn) return;
    if (history.length === 0) return;

    // Move "Back" in history (older)
    if (historyIndex === -1) {
        // Start browsing history
        historyIndex = history.length - 1;
    } else if (historyIndex > 0) {
        historyIndex--;
    }

    expr = history[historyIndex];
    result = expr; // Show the expression as result temporarily or just display logic
    cursorPos = expr.length;
    updateDisplay();
}

function cursorDown() {
    if (!isOn) return;
    if (historyIndex === -1) return; // Not browsing

    if (historyIndex < history.length - 1) {
        historyIndex++;
        expr = history[historyIndex];
        cursorPos = expr.length;
    } else {
        // Exited history
        historyIndex = -1;
        expr = '';
        result = '0';
        cursorPos = 0;
    }
    updateDisplay();
}

function shift() {
    shiftMode = !shiftMode;
}

function alpha() {
    // Alpha mode
}

function mode() {
    // Mode settings
}

function toggleOnOff() {
    isOn = !isOn;
    if (!isOn) {
        document.getElementById('result').textContent = '';
        document.getElementById('expression').textContent = '';
        expr = '';
        result = '';
    } else {
        clearAll();
    }
}

updateDisplay();