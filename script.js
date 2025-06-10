// script.js
document.addEventListener('DOMContentLoaded', () => {
    const display = document.getElementById('result');
    const buttons = document.querySelectorAll('.buttons button');

    const matrixAInput = document.getElementById('matrixAInput');
    const matrixBInput = document.getElementById('matrixBInput');
    const storeMatrixAButton = document.getElementById('storeMatrixA');
    const storeMatrixBButton = document.getElementById('storeMatrixB');
    const addMatricesButton = document.getElementById('addMatrices');
    const subtractMatricesButton = document.getElementById('subtractMatrices');
    const multiplyMatricesButton = document.getElementById('multiplyMatrices');

    const coeffAInput = document.getElementById('coeffA');
    const coeffBInput = document.getElementById('coeffB');
    const coeffCInput = document.getElementById('coeffC');
    const solveLinearEquationButton = document.getElementById('solveLinearEquation');

    const toggleHistoryButton = document.getElementById('toggleHistory');
    const clearHistoryButton = document.getElementById('clearHistory');
    const historyDisplay = document.getElementById('historyDisplay');

    // 그래프 관련 DOM 요소
    const functionInput = document.getElementById('functionInput');
    const drawGraphButton = document.getElementById('drawGraphButton');
    const graphCanvas = document.getElementById('graphCanvas');

    let currentInput = '0';
    let previousInput = '';
    let operator = null;
    let shouldResetDisplay = false;
    let isFractionMode = false;
    let currentInternalValue = null;
    let previousInternalValue = null;
    let isEnteringDenominator = false;

    let statisticalData = [];
    let matrixA = null;
    let matrixB = null;
    let calculationHistory = [];
    const MAX_HISTORY_SIZE = 20;

    // --- 유틸리티 함수 (기존) ---
    function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
    function simplifyFraction(fraction) { /* ... 기존 ... */
        if (typeof fraction !== 'object' || fraction === null || !fraction.hasOwnProperty('num') || !fraction.hasOwnProperty('den')) return fraction;
        if (fraction.den === 0) return { num: 'Error', den: '' };
        if (fraction.num === 0) return { num: 0, den: 1 };
        const common = gcd(Math.abs(fraction.num), Math.abs(fraction.den));
        let num = fraction.num / common; let den = fraction.den / common;
        if (den < 0) { num = -num; den = -den; }
        return { num, den };
    }
    function formatValue(value, fractionModeOutput, forHistory = false) { /* ... 기존 ... */
        if (typeof value === 'string' && (value.startsWith("[[") || value.startsWith("Matrix Error") || value.startsWith("Stored") || value === "Infinite solutions" || value === "No solution" || value === "Invalid coefficient")) {
            return value;
        }
        if (typeof value === 'object' && value !== null && value.hasOwnProperty('num')) {
            if (value.num === 'Error' || value.num === "No Data" || value.num === "Need >= 2 Data") return value.num.toString();
            if (value.den === 1) return value.num.toString();
            return (forHistory ? isFractionMode : fractionModeOutput) ? `${value.num}/${value.den}` : (value.num / value.den).toString();
        }
        if (typeof value === 'number') return value.toString();
        return value;
    }
    function parseInputToInternalValue(inputStr) { /* ... 기존 ... */
        if (inputStr.includes('/') && !inputStr.startsWith('-') && inputStr.match(/\//g).length === 1) {
            const parts = inputStr.split('/');
            if (parts.length === 2) {
                const num = parseFloat(parts[0]); const den = parseFloat(parts[1]);
                if (!isNaN(num) && !isNaN(den)) {
                    if (den === 0) return { num: 'Error', den: '' };
                    return simplifyFraction({ num, den });
                }
            }
            return { num: 'Error', den: '' };
        }
        const num = parseFloat(inputStr);
        return isNaN(num) ? { num: 'Error', den: '' } : num;
    }
    function decimalToFraction(decimal, tolerance = 1.0E-6) { /* ... 기존 ... */
        if (decimal === parseInt(decimal)) return { num: parseInt(decimal), den: 1 };
        if (Math.abs(decimal) > 1e9 || Math.abs(decimal) < 1e-9 && decimal !==0) return {num: "Error", den: ""};
        let h1 = 1, h2 = 0, k1 = 0, k2 = 1, b = decimal;
        do {
            let a = Math.floor(b);
            let aux = h1; h1 = a * h1 + h2; h2 = aux;
            aux = k1; k1 = a * k1 + k2; k2 = aux;
            if (Math.abs(b - a) < 1e-12 || k1 > 1e7) break;
            b = 1 / (b - a);
        } while (Math.abs(decimal - h1 / k1) > decimal * tolerance);
        return simplifyFraction({ num: h1, den: k1 });
    }

    // --- 히스토리 함수 (기존) ---
    function addHistoryEntry(expression, result) { /* ... 기존 ... */
        if (expression === null || result === null || result === "Error" || String(result).includes("Error")) return;
        const entry = { expression: String(expression), result: String(result) };
        calculationHistory.unshift(entry);
        if (calculationHistory.length > MAX_HISTORY_SIZE) calculationHistory.pop();
        if (historyDisplay.style.display !== 'none') displayHistory();
    }
    function displayHistory() { /* ... 기존 ... */
        historyDisplay.innerHTML = '';
        if (calculationHistory.length === 0) {
            historyDisplay.innerHTML = '<div>No history yet.</div>'; return;
        }
        calculationHistory.forEach(entry => {
            const div = document.createElement('div');
            div.classList.add('history-item');
            div.textContent = `${entry.expression} = ${entry.result}`;
            historyDisplay.appendChild(div);
        });
    }
    function toggleHistory() { /* ... 기존 ... */
        if (historyDisplay.style.display === 'none') {
            displayHistory(); historyDisplay.style.display = 'block';
        } else {
            historyDisplay.style.display = 'none';
        }
    }
    function clearFullHistory() { /* ... 기존 ... */
        calculationHistory = []; displayHistory();
    }

    // --- 통계, 행렬, 방정식 풀이 함수 (기존, 히스토리 연동 부분만 확인) ---
    // ... (생략, 이전 단계에서 히스토리 추가 완료됨)
    function addStatisticalData() {
        if (currentInput === "Error") return;
        let valueToAdd = currentInternalValue !== null ? currentInternalValue : parseInputToInternalValue(currentInput);
        let originalInputForHistory = currentInput;
        if (typeof valueToAdd === 'object' && valueToAdd !== null && valueToAdd.hasOwnProperty('num')) {
            if (valueToAdd.num === "Error") { currentInternalValue = "Invalid Data"; isFractionMode = false; shouldResetDisplay = true; return; }
            valueToAdd = valueToAdd.num / valueToAdd.den;
        }
        if (typeof valueToAdd === 'number' && !isNaN(valueToAdd)) {
            statisticalData.push(valueToAdd); currentInternalValue = "Data Added";
            addHistoryEntry(`AddData(${originalInputForHistory})`, `Total: ${statisticalData.length}`);
        } else { currentInternalValue = "Invalid Data"; }
        isFractionMode = false; shouldResetDisplay = true;
    }
    function calculateMean() {
        if (statisticalData.length === 0) { currentInternalValue = "No Data"; return; }
        const sum = statisticalData.reduce((acc, val) => acc + val, 0); const result = sum / statisticalData.length;
        addHistoryEntry("Mean", result); currentInternalValue = result;
    }
    function calculateVariance() {
        if (statisticalData.length < 2) { currentInternalValue = "Need >= 2 Data"; return; }
        const mean = statisticalData.reduce((acc, val) => acc + val, 0) / statisticalData.length;
        const sqDiff = statisticalData.map(val => (val - mean) ** 2);
        const result = sqDiff.reduce((acc, val) => acc + val, 0) / (statisticalData.length - 1);
        addHistoryEntry("Variance", result); currentInternalValue = result;
    }
    function calculateStdDev() {
        if (statisticalData.length < 2) { currentInternalValue = "Need >= 2 Data"; return; }
        const mean = statisticalData.reduce((acc, val) => acc + val, 0) / statisticalData.length;
        const sqDiff = statisticalData.map(val => (val - mean) ** 2);
        const variance = sqDiff.reduce((acc, val) => acc + val, 0) / (statisticalData.length - 1);
        const result = Math.sqrt(variance);
        addHistoryEntry("StdDev", result); currentInternalValue = result;
    }
    function clearStatisticalData() {
        statisticalData = []; currentInternalValue = "Data Cleared";
        shouldResetDisplay = true; isFractionMode = false; addHistoryEntry("Clear Stat Data", "Done");
    }
    function storeMatrixA() {
        matrixA = parseMatrix(matrixAInput.value);
        const msg = matrixA ? "Stored A: " + formatMatrixToString(matrixA) : "Matrix Error: Invalid A format";
        currentInternalValue = msg; if(matrixA) addHistoryEntry("StoreA", formatMatrixToString(matrixA));
        isFractionMode = false; shouldResetDisplay = true; updateDisplay();
    }
    function storeMatrixB() {
        matrixB = parseMatrix(matrixBInput.value);
        const msg = matrixB ? "Stored B: " + formatMatrixToString(matrixB) : "Matrix Error: Invalid B format";
        currentInternalValue = msg; if(matrixB) addHistoryEntry("StoreB", formatMatrixToString(matrixB));
        isFractionMode = false; shouldResetDisplay = true; updateDisplay();
    }
    function handleMatrixOperation(operation, opSymbol) {
        if (!matrixA || !matrixB) currentInternalValue = "Matrix Error: Store A and B first";
        else {
            const resultMatrix = operation(matrixA, matrixB);
            if (typeof resultMatrix === 'string') currentInternalValue = resultMatrix;
            else { const resultStr = formatMatrixToString(resultMatrix);
                addHistoryEntry(`Matrix A ${opSymbol} Matrix B`, resultStr); currentInternalValue = resultStr;
            }
        }
        isFractionMode = false; shouldResetDisplay = true; updateDisplay();
    }
    function solveLinearEquation() {
        const aVal = parseFloat(coeffAInput.value); const bVal = parseFloat(coeffBInput.value); const cVal = parseFloat(coeffCInput.value);
        let result; let expr = `${aVal}x + ${bVal} = ${cVal}`;
        if (isNaN(aVal) || isNaN(bVal) || isNaN(cVal)) result = "Invalid coefficient";
        else if (aVal === 0) result = (bVal === cVal) ? "Infinite solutions" : "No solution";
        else result = (cVal - bVal) / aVal;
        addHistoryEntry(expr, result); currentInternalValue = result;
        isFractionMode = false; shouldResetDisplay = true; updateDisplay();
    }
    function parseMatrix(matrixString) { /* ... 기존 ... */
        if (!matrixString || typeof matrixString !== 'string') return null;
        try {
            const rows = matrixString.split(';');
            const matrix = rows.map(rowStr => rowStr.split(',').map(valStr => {
                const num = parseFloat(valStr.trim());
                if (isNaN(num)) throw new Error("Invalid number in matrix"); return num;
            }));
            if (matrix.length > 0) {
                const firstRowLength = matrix[0].length;
                if (!matrix.every(row => row.length === firstRowLength && firstRowLength > 0)) throw new Error("Matrix rows have inconsistent lengths or are empty.");
            } else throw new Error("Matrix cannot be empty.");
            return matrix;
        } catch (e) { return null; }
    }
    function formatMatrixToString(matrix) { /* ... 기존 ... */
        if (!matrix || !Array.isArray(matrix)) return "Invalid Matrix Object";
        if (matrix.length === 0) return "[]";
        return "[" + matrix.map(row => "[" + row.join(",") + "]").join(",") + "]";
    }
    function addMatrices(A, B) { /* ... 기존 ... */
        if (!A || !B) return "Matrix Error: A or B not stored";
        if (A.length !== B.length || A[0].length !== B[0].length) return "Matrix Error: Size mismatch for add";
        return A.map((row, i) => row.map((val, j) => val + B[i][j]));
    }
    function subtractMatrices(A, B) { /* ... 기존 ... */
        if (!A || !B) return "Matrix Error: A or B not stored";
        if (A.length !== B.length || A[0].length !== B[0].length) return "Matrix Error: Size mismatch for sub";
        return A.map((row, i) => row.map((val, j) => val - B[i][j]));
    }
    function multiplyMatrices(A, B) { /* ... 기존 ... */
        if (!A || !B) return "Matrix Error: A or B not stored";
        if (A[0].length !== B.length) return "Matrix Error: Size mismatch for mul (A_cols != B_rows)";
        const result = new Array(A.length).fill(0).map(() => new Array(B[0].length).fill(0));
        for (let i = 0; i < A.length; i++) for (let j = 0; j < B[0].length; j++) for (let k = 0; k < A[0].length; k++) result[i][j] += A[i][k] * B[k][j];
        return result;
    }


    // --- 그래프 함수 ---
    function sanitizeFunctionString(funcStr) {
        // 알려진 Math 함수에 Math. 접두사 추가
        const knownMathFunctions = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'log10', 'log2', 'exp', 'pow', 'sqrt', 'abs', 'ceil', 'floor', 'round', 'min', 'max', 'PI', 'E'];
        knownMathFunctions.forEach(knownFunc => {
            // 정규식: 단어 경계(\b)로 함수 이름 전체를 찾고, 그 앞에 Math. 가 없는 경우 치환
            // (?!...)은 negative lookbehind assertion (ES2018+), 일부 환경에서 지원 안될 수 있음.
            // 좀 더 안전한 방법은, 함수 이름을 찾고 split 등으로 주변을 확인하거나,
            // 사용자 입력에서 Math. 를 강제하는 것입니다.
            // 여기서는 간단히 \bfunc\b 형태로 찾아서 Math.func 로 바꿉니다.
            const regex = new RegExp(`\\b${knownFunc}\\b(?!\\()`, 'g'); // PI, E 같은 상수 처리
            funcStr = funcStr.replace(regex, `Math.${knownFunc}`);
            const regexFunc = new RegExp(`\\b${knownFunc}\\((.*?)\\)`, 'g'); // sin(x) 같은 함수 호출
            funcStr = funcStr.replace(regexFunc, `Math.${knownFunc}($1)`);

        });
        // 'x' 이외의 변수 사용 방지 (간단한 시도, 완벽하지 않음)
        // 알파벳으로 시작하는 단어 중 x, Math, 그리고 숫자 아닌 것들
        funcStr = funcStr.replace(/\b[a-df-zA-DF-Z_]\w*\b/g, ''); // x, e (Math.E용) 제외하고 다른 변수명 제거 시도

        // 위험한 키워드 제거 (간단한 예시)
        const forbiddenKeywords = ['window', 'document', 'alert', 'eval', 'script', 'function', '=>', 'return', 'this', 'new']; // return은 new Function에서 사용되므로, 사용자 입력에서는 제거
        forbiddenKeywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            funcStr = funcStr.replace(regex, '');
        });
        return funcStr;
    }

    function drawGraph() {
        const ctx = graphCanvas.getContext('2d');
        const width = graphCanvas.width;
        const height = graphCanvas.height;
        let funcStr = functionInput.value;

        // 기본적인 입력 문자열 "안전" 처리
        funcStr = sanitizeFunctionString(funcStr);
        if (!funcStr.trim()) {
            ctx.clearRect(0,0,width,height);
            ctx.fillStyle = 'red';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText("Error: Empty function", width/2, height/2);
            return;
        }

        let userFunction;
        try {
            // new Function은 'x'라는 인자를 받고, funcStr의 내용을 실행하여 반환함.
            // 'use strict'; 추가하여 좀 더 제한적인 환경에서 실행
            userFunction = new Function('x', `'use strict'; return ${funcStr}`);
        } catch (e) {
            ctx.clearRect(0,0,width,height);
            ctx.fillStyle = 'red';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText("Error: Invalid function syntax", width/2, height/2);
            console.error("Function syntax error:", e);
            return;
        }

        // Canvas 초기화
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        // 좌표축 그리기
        const xMin = -10, xMax = 10, yMin = -10, yMax = 10; // 논리적 범위
        const originX = width / 2;
        const originY = height / 2;
        const scaleX = width / (xMax - xMin);
        const scaleY = height / (yMax - yMin);

        ctx.beginPath();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        // X축
        ctx.moveTo(0, originY);
        ctx.lineTo(width, originY);
        // Y축
        ctx.moveTo(originX, 0);
        ctx.lineTo(originX, height);
        ctx.stroke();

        // 눈금 및 레이블 (간단히)
        ctx.fillStyle = 'black';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        for (let i = Math.ceil(xMin); i <= Math.floor(xMax); i++) {
            if (i === 0) continue;
            const xCanvas = originX + i * scaleX;
            ctx.moveTo(xCanvas, originY - 3);
            ctx.lineTo(xCanvas, originY + 3);
            ctx.fillText(i.toString(), xCanvas, originY + 5);
        }
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let i = Math.ceil(yMin); i <= Math.floor(yMax); i++) {
            if (i === 0) continue;
            const yCanvas = originY - i * scaleY; // Y축은 위로 갈수록 값이 작아짐
            ctx.moveTo(originX - 3, yCanvas);
            ctx.lineTo(originX + 3, yCanvas);
            ctx.fillText(i.toString(), originX - 5, yCanvas);
        }
        ctx.stroke();


        // 그래프 그리기
        ctx.beginPath();
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;
        let firstPoint = true;

        for (let px = 0; px < width; px++) { // 캔버스 픽셀 단위로 루프
            const x = (px - originX) / scaleX; // 픽셀 x를 논리적 x로 변환
            let y;
            try {
                y = userFunction(x);
            } catch (e) {
                // 함수 실행 중 오류 (예: 정의되지 않은 변수 접근 시도 등)
                // 이 오류는 new Function 생성 시점이 아닌, 실행 시점에 발생
                // console.error("Error in user function execution:", e);
                // 전체 그래프 그리기를 중단하고 오류 메시지 표시
                ctx.clearRect(0,0,width,height);
                ctx.fillStyle = 'red';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`Error executing f(x): ${e.message.substring(0,30)}`, width/2, height/2);
                return;
            }

            if (typeof y === 'number' && !isNaN(y) && isFinite(y)) {
                const py = originY - y * scaleY; // 논리적 y를 픽셀 y로 변환 (y축 반전)

                if (firstPoint) {
                    ctx.moveTo(px, py);
                    firstPoint = false;
                } else {
                    ctx.lineTo(px, py);
                }
            } else { // y값이 유효하지 않으면 선을 끊음
                firstPoint = true;
            }
        }
        ctx.stroke();
        addHistoryEntry(`Graph f(x)=${functionInput.value}`, "Drawn");
    }


    // --- 이벤트 핸들러 (기존 버튼) ---
    buttons.forEach(button => { /* ... 기존 ... */
        button.addEventListener('click', () => {
            const value = button.textContent;
            const buttonClassList = button.classList;
            if (currentInternalValue && typeof currentInternalValue === 'string' && (currentInternalValue.startsWith("Matrix Error") || currentInternalValue === "Infinite solutions" || currentInternalValue === "No solution" || currentInternalValue === "Invalid coefficient" )) {
                 if(buttonClassList.contains('number') || buttonClassList.contains('decimal') || buttonClassList.contains('clear')){}
                 else if (!buttonClassList.contains('matrix-button') && !buttonClassList.contains('matrix-op-button') && !buttonClassList.contains('solver-button') && !buttonClassList.contains('graphing-button')) { }
            }

            if (buttonClassList.contains('number') || buttonClassList.contains('decimal')) handleNumber(value);
            else if (buttonClassList.contains('operator')) handleOperator(value);
            else if (buttonClassList.contains('equals')) handleEquals();
            else if (buttonClassList.contains('clear')) handleClear();
            else if (buttonClassList.contains('function')) handleFunction(value);
            else if (buttonClassList.contains('mode-toggle')) handleModeToggle();
            else if (buttonClassList.contains('add-data')) addStatisticalData();
            else if (buttonClassList.contains('stat-function')) {
                if (value === "Mean") calculateMean();
                else if (value === "Var") calculateVariance();
                else if (value === "StdDev") calculateStdDev();
                isFractionMode = false; shouldResetDisplay = true;
            } else if (buttonClassList.contains('clear-data')) clearStatisticalData();
            updateDisplay();
        });
    });

    // --- 이벤트 핸들러 (추가된 버튼) ---
    if (storeMatrixAButton) storeMatrixAButton.addEventListener('click', storeMatrixA);
    if (storeMatrixBButton) storeMatrixBButton.addEventListener('click', storeMatrixB);
    if (addMatricesButton) addMatricesButton.addEventListener('click', () => handleMatrixOperation(addMatrices, '+'));
    if (subtractMatricesButton) subtractMatricesButton.addEventListener('click', () => handleMatrixOperation(subtractMatrices, '-'));
    if (multiplyMatricesButton) multiplyMatricesButton.addEventListener('click', () => handleMatrixOperation(multiplyMatrices, '*'));
    if (solveLinearEquationButton) solveLinearEquationButton.addEventListener('click', solveLinearEquation);
    if (toggleHistoryButton) toggleHistoryButton.addEventListener('click', toggleHistory);
    if (clearHistoryButton) clearHistoryButton.addEventListener('click', clearFullHistory);
    if (drawGraphButton) drawGraphButton.addEventListener('click', drawGraph);


    // --- 핵심 로직 함수 (기존 및 수정) ---
    function handleNumber(value) { /* ... 기존 ... */
        if (shouldResetDisplay) {
            currentInput = '0'; currentInternalValue = null;
            isEnteringDenominator = false; shouldResetDisplay = false;
        }
        if (typeof currentInternalValue === 'string' && (currentInternalValue.includes("Error") || currentInternalValue.includes("Data") || currentInternalValue.includes("Stored") || currentInternalValue.includes("No Data") || currentInternalValue === "Infinite solutions" || currentInternalValue === "No solution" || currentInternalValue === "Invalid coefficient")) {
            currentInput = '0'; currentInternalValue = null;
        } else if (currentInput === 'Error' || currentInput === "No Data" || currentInput === "Need >= 2 Data" || currentInput === "Data Cleared" || currentInput === "Data Added" || currentInput === "Invalid Data" || currentInput.startsWith("Stored") || currentInput.startsWith("Matrix Error") || currentInput === "Infinite solutions" || currentInput === "No solution" || currentInput === "Invalid coefficient") {
            currentInput = '0'; currentInternalValue = null;
        }
        if (isEnteringDenominator) {
            const parts = currentInput.split('/');
            let denPart = parts[1] === '0' ? '' : (parts[1] || "");
            if (value === '.' && denPart.includes('.')) return;
            denPart += value; currentInput = parts[0] + '/' + denPart;
        } else {
            if (value === '.' && currentInput.includes('.') && !currentInput.includes('/')) return;
            if (currentInput === '0' && value !== '.') currentInput = value;
            else currentInput += value;
        }
        if (!isEnteringDenominator) currentInternalValue = null;
    }
    function handleOperator(op) { /* ... 기존 ... */
        if (typeof currentInternalValue === 'string' && (currentInternalValue.includes("Error") || currentInternalValue.includes("Data")|| currentInternalValue === "Infinite solutions" || currentInternalValue === "No solution" || currentInternalValue === "Invalid coefficient")) {
            currentInput = "0"; currentInternalValue = 0;
        }
        if (op === '/' && !isEnteringDenominator && !operator && !currentInput.includes('/')) {
            if (currentInput.endsWith('.') || currentInput.startsWith('-') && currentInput.endsWith('.')) {
                currentInternalValue = "Error"; updateDisplay(); return;
            }
            isEnteringDenominator = true; currentInput += '/0';
            shouldResetDisplay = false; updateDisplay(); return;
        }
        if (currentInternalValue === null || typeof currentInternalValue === 'string') currentInternalValue = parseInputToInternalValue(currentInput);
        if (operator && previousInternalValue !== null && !shouldResetDisplay) {
             const prevFormatted = formatValue(previousInternalValue, isFractionMode, true);
             const currentFormatted = formatValue(currentInternalValue, isFractionMode, true);
             if (prevFormatted === currentFormatted && operator) { operator = op; isEnteringDenominator = false; return; }
            handleEquals(true);
            if (formatValue(currentInternalValue, false) === "Error") return;
        }
        previousInternalValue = currentInternalValue;
        if (previousInternalValue === null || typeof previousInternalValue === 'string') previousInternalValue = parseInputToInternalValue(currentInput);
        if (formatValue(previousInternalValue,false) === "Error") {
            previousInternalValue = null; currentInternalValue = "Error"; updateDisplay(); return;
        }
        previousInput = formatValue(previousInternalValue, isFractionMode, true);
        operator = op; shouldResetDisplay = true; isEnteringDenominator = false;
    }
    function handleEquals(isIntermediateCalculation = false) { /* ... 기존 ... */
        if (isEnteringDenominator && (currentInput.endsWith('/') || currentInput.endsWith('/0'))) {
            currentInternalValue = "Error"; resetCalculationState(); updateDisplay(); return;
        }
        let currentValForCalc = (currentInternalValue === null || typeof currentInternalValue === 'string') ? parseInputToInternalValue(currentInput) : currentInternalValue;
        let expressionForHistory = null;
        if (!isIntermediateCalculation && operator && previousInternalValue !== null) {
            const prevStr = formatValue(previousInternalValue, isFractionMode, true);
            const currStr = formatValue(currentValForCalc, isFractionMode, true);
            expressionForHistory = `${prevStr} ${operator} ${currStr}`;
        }
        if (operator === null || previousInternalValue === null) {
            currentInternalValue = currentValForCalc;
            if(!isIntermediateCalculation) resetCalculationState(); else operator = null;
            return;
        }
        if (formatValue(currentValForCalc, false) === "Error") {
             currentInternalValue = "Error"; resetCalculationState(); updateDisplay(); return;
        }
        let result = calculate(previousInternalValue, currentValForCalc, operator);
        if (!isIntermediateCalculation && expressionForHistory) addHistoryEntry(expressionForHistory, formatValue(result, isFractionMode, true));
        currentInternalValue = result; currentInput = formatValue(currentInternalValue, isFractionMode);
        if (!isIntermediateCalculation) resetCalculationState(); else previousInput = currentInput;
        shouldResetDisplay = true;
    }
    function resetCalculationState() { /* ... 기존 ... */
        previousInput = ''; operator = null; previousInternalValue = null; isEnteringDenominator = false;
    }
    function calculate(prev, current, op) { /* ... 기존 ... */
        const pIsF = typeof prev === 'object' && prev !== null && prev.hasOwnProperty('num');
        const cIsF = typeof current === 'object' && current !== null && current.hasOwnProperty('num');
        if ((pIsF && prev.num === "Error") || (cIsF && current.num === "Error")) return "Error";
        let pVal = pIsF ? prev.num / prev.den : prev; let cVal = cIsF ? current.num / current.den : current;
        if (op === '^') {
            const res = Math.pow(pVal, cVal); if (isNaN(res) || !isFinite(res)) return "Error";
            return Number.isInteger(res) || Math.abs(res - parseFloat(res.toFixed(7))) < 1e-9 ? res : decimalToFraction(res);
        }
        let pFrac = pIsF ? prev : decimalToFraction(pVal); let cFrac = cIsF ? current : decimalToFraction(cVal);
        if (pFrac.num === "Error" || cFrac.num === "Error") return "Error";
        let resN, resD;
        switch (op) {
            case '+': resN = pFrac.num * cFrac.den + cFrac.num * pFrac.den; resD = pFrac.den * cFrac.den; break;
            case '-': resN = pFrac.num * cFrac.den - cFrac.num * pFrac.den; resD = pFrac.den * cFrac.den; break;
            case '*': resN = pFrac.num * cFrac.num; resD = pFrac.den * cFrac.den; break;
            case '/': if (cFrac.num === 0) return "Error"; resN = pFrac.num * cFrac.den; resD = pFrac.den * cFrac.num; break;
            default: return currentInternalValue;
        }
        return simplifyFraction({ num: resN, den: resD });
    }
    const originalHandleClear = handleClear;
    handleClear = () => {
        originalHandleClear();
        statisticalData = []; matrixA = null; matrixB = null;
        if(matrixAInput) matrixAInput.value = ''; if(matrixBInput) matrixBInput.value = '';
        if(coeffAInput) coeffAInput.value = ''; if(coeffBInput) coeffBInput.value = ''; if(coeffCInput) coeffCInput.value = '';
        if(functionInput) functionInput.value = '';
        if(graphCanvas) { const ctx = graphCanvas.getContext('2d'); ctx.clearRect(0, 0, graphCanvas.width, graphCanvas.height); }
    };
    function handleClear() { /* ... 기존 base clear ... */
        currentInput = '0'; previousInput = ''; operator = null;
        shouldResetDisplay = false; isFractionMode = false;
        currentInternalValue = null; previousInternalValue = null; isEnteringDenominator = false;
    }
    function handleFunction(func) { /* ... 기존, 히스토리 연동 확인 ... */
        if (typeof currentInternalValue === 'string' && (currentInternalValue.includes("Error") || currentInternalValue === "Infinite solutions" || currentInternalValue === "No solution" || currentInternalValue === "Invalid coefficient")) {
             if (func === 'log' || func === 'ln') {currentInternalValue = "Error"; shouldResetDisplay = true; return;}
        }
        const originalInputForHistory = formatValue( (currentInternalValue === null || typeof currentInternalValue === 'string') ? parseInputToInternalValue(currentInput) : currentInternalValue, isFractionMode, true );
        let valToProcess = (currentInternalValue === null || typeof currentInternalValue === 'string') ? parseInputToInternalValue(currentInput) : currentInternalValue;
        let numValue;
        if (typeof valToProcess === 'object' && valToProcess !== null && valToProcess.hasOwnProperty('num')) {
            if (valToProcess.num === "Error") { currentInternalValue = "Error"; shouldResetDisplay = true; return;}
            numValue = valToProcess.num / valToProcess.den;
        } else if (typeof valToProcess === 'number') numValue = valToProcess;
        else { currentInternalValue = "Error"; shouldResetDisplay = true; return; }
        if (isNaN(numValue)) { currentInternalValue = "Error"; shouldResetDisplay = true; return; }
        let result;
        switch (func) {
            case 'sin': result = Math.sin(numValue * Math.PI / 180); break;
            case 'cos': result = Math.cos(numValue * Math.PI / 180); break;
            case 'tan': const angleDeg = numValue % 360; if (Math.abs(angleDeg % 180) === 90) { currentInternalValue = "Error"; shouldResetDisplay = true; return; }
                result = Math.tan(numValue * Math.PI / 180); break;
            case 'log': if (numValue <= 0) { currentInternalValue = "Error"; shouldResetDisplay = true; return; } result = Math.log10(numValue); break;
            case 'ln': if (numValue <= 0) { currentInternalValue = "Error"; shouldResetDisplay = true; return; } result = Math.log(numValue); break;
            case 'sqrt': if (numValue < 0) { currentInternalValue = "Error"; shouldResetDisplay = true; return; } result = Math.sqrt(numValue); break;
            default: return;
        }
        if (isNaN(result) || !isFinite(result)) currentInternalValue = "Error"; else currentInternalValue = result;
        if (currentInternalValue !== "Error") addHistoryEntry(`${func}(${originalInputForHistory})`, formatValue(currentInternalValue, false, true));
        isFractionMode = false; shouldResetDisplay = true; operator = null; previousInput = ''; previousInternalValue = null; isEnteringDenominator = false;
    }
    function handleModeToggle() { /* ... 기존 ... */
        isFractionMode = !isFractionMode;
        if (currentInternalValue === null || typeof currentInternalValue === 'string') {
            let parsed = parseInputToInternalValue(currentInput);
            if (!(typeof parsed === 'object' && parsed !== null && parsed.num === 'Error') && typeof parsed !== 'string') currentInternalValue = parsed;
            else if (typeof parsed === 'number' && !isNaN(parsed)) currentInternalValue = parsed;
        }
    }
    function updateDisplay() { /* ... 기존 ... */
        let displayValue;
        if (currentInternalValue !== null && !isEnteringDenominator) displayValue = formatValue(currentInternalValue, isFractionMode);
        else displayValue = currentInput;
        if (typeof displayValue === 'string' && (displayValue.startsWith("Matrix Error:") || displayValue === "Infinite solutions" || displayValue === "No solution" || displayValue === "Invalid coefficient" )) {}
        else if (displayValue === "Error" || (typeof displayValue === 'object' && displayValue !== null && displayValue.num === "Error")) displayValue = "Error";
        else if (typeof displayValue === 'string' && (displayValue === "No Data" || displayValue === "Need >= 2 Data" || displayValue === "Data Cleared" || displayValue === "Data Added" || displayValue === "Invalid Data" || displayValue.startsWith("Stored"))) {}
        else if (typeof displayValue === 'string' && displayValue.length > 15 && !displayValue.includes('/') && !displayValue.startsWith("[[")) {
            try {
                const num = parseFloat(displayValue);
                if (!isNaN(num) && Math.abs(num) > 1e-9 && (Math.abs(num) > 1e7 || Math.abs(num) < 1e-5)) displayValue = num.toExponential(9);
                else if (num === 0) displayValue = "0";
            } catch(e) { /* ignore */ }
        }
        display.value = displayValue;
    }

    // 초기 화면 업데이트
    updateDisplay();
});
