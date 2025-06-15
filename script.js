// script.js
document.addEventListener('DOMContentLoaded', () => {
    const display = document.getElementById('result');
    const expressionDisplay = document.getElementById('expressionDisplay'); // 수식 표시줄 참조
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

    const functionInput = document.getElementById('functionInput');
    const drawGraphButton = document.getElementById('drawGraphButton');
    const graphCanvas = document.getElementById('graphCanvas');

    let currentInput = '0';
    let previousInput = '';  // 수식 표시줄에 사용될 이전 입력값 문자열
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

    // --- 수식 표시줄 업데이트 함수 ---
    function updateExpressionDisplay() {
        let prevStr = previousInput || '';
        // previousInput이 Math.PI.toString()이면 'π'로 표시
        if (previousInternalValue === Math.PI) prevStr = 'π';

        let currentStr = currentInput || '';
        // currentInput이 Math.PI.toString()이면 'π'로 표시 (숫자 입력 중일 때)
        // 하지만 currentInternalValue가 Math.PI로 설정된 경우는 handleFunction에서 처리하므로,
        // 여기서는 currentInput이 숫자 입력 중일 때만 고려 (실제로는 handleNumber에서 currentInput에 직접 PI 문자열이 들어감)
        if (currentInput === String(Math.PI)) currentStr = 'π';


        if (operator && prevStr) {
            expressionDisplay.textContent = `${prevStr} ${operator} ${currentStr === '0' && operator ? '' : (isEnteringDenominator ? '' : currentStr) }`;
        } else if (prevStr && operator) { // 연산자만 있고 currentInput이 없을 때 (연산자 누른 직후)
            expressionDisplay.textContent = `${prevStr} ${operator}`;
        }
        else { // 숫자만 입력 중이거나, 함수 결과 등
             // currentInternalValue가 숫자이고, currentInput이 '0'이거나 currentInternalValue를 반영한 상태일 때
            if (currentInternalValue !== null && !isNaN(parseFloat(currentInternalValue)) && (currentInput === '0' || currentInput === formatValue(currentInternalValue, isFractionMode))) {
                 expressionDisplay.textContent = formatValue(currentInternalValue, isFractionMode, true); // true for history/expression formatting
            } else {
                 expressionDisplay.textContent = currentStr;
            }
        }
    }


    // --- 유틸리티 함수 ---
    function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
    function simplifyFraction(fraction) {
        if (typeof fraction !== 'object' || fraction === null || !fraction.hasOwnProperty('num') || !fraction.hasOwnProperty('den')) return fraction;
        if (fraction.den === 0) return { num: 'Error', den: '' };
        if (fraction.num === 0) return { num: 0, den: 1 };
        const common = gcd(Math.abs(fraction.num), Math.abs(fraction.den));
        let num = fraction.num / common; let den = fraction.den / common;
        if (den < 0) { num = -num; den = -den; }
        return { num, den };
    }
    function formatValue(value, fractionModeOutput, forExpressionOrHistory = false) {
        if (value === Math.PI && forExpressionOrHistory) return 'π'; // 수식/히스토리에는 π 문자로

        if (typeof value === 'string' && (value.startsWith("[[") || value.startsWith("Matrix Error") || value.startsWith("Stored") || value === "Infinite solutions" || value === "No solution" || value === "Invalid coefficient")) {
            return value;
        }
        if (typeof value === 'object' && value !== null && value.hasOwnProperty('num')) {
            if (value.num === 'Error' || value.num === "No Data" || value.num === "Need >= 2 Data") return value.num.toString();
            if (value.den === 1) return value.num.toString();
            // 수식/히스토리용 포맷은 항상 현재 isFractionMode 설정을 따르거나, 혹은 항상 소수/분수 중 하나로 고정할 수 있음
            return (forExpressionOrHistory ? isFractionMode : fractionModeOutput) ? `${value.num}/${value.den}` : (value.num / value.den).toString();
        }
        if (typeof value === 'number') return value.toString();
        return value;
    }
    function parseInputToInternalValue(inputStr) {
        if (inputStr === 'π') return Math.PI; // 'π' 문자도 Math.PI로 파싱
        if (inputStr === String(Math.PI)) return Math.PI;
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
    function decimalToFraction(decimal, tolerance = 1.0E-6) {
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

    // --- 히스토리 함수 ---
    function addHistoryEntry(expression, result) {
        if (expression === null || result === null || String(result).includes("Error")) return; // Error 포함된 결과는 기록 안함
        const entry = { expression: String(expression), result: String(result) };
        calculationHistory.unshift(entry);
        if (calculationHistory.length > MAX_HISTORY_SIZE) calculationHistory.pop();
        if (historyDisplay.style.display !== 'none') displayHistory();
    }
    // ... (displayHistory, toggleHistory, clearFullHistory 기존과 동일)
    function displayHistory() {
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
    function toggleHistory() {
        if (historyDisplay.style.display === 'none') {
            displayHistory(); historyDisplay.style.display = 'block';
        } else {
            historyDisplay.style.display = 'none';
        }
    }
    function clearFullHistory() {
        calculationHistory = [];
        displayHistory();
    }

    // --- 통계, 행렬, 방정식, 그래프 함수 (기존과 거의 동일, 히스토리 부분만 필요시 조정) ---
    // ... (각 함수 내 addHistoryEntry 호출 시 formatValue에 forExpressionOrHistory = true 전달 고려)
    // 예시: addHistoryEntry("Mean", formatValue(result, false, true));
    function addStatisticalData() {
        if (currentInput === "Error") return;
        let valueToAdd = currentInternalValue !== null ? currentInternalValue : parseInputToInternalValue(currentInput);
        let originalInputForHistory = currentInput;
        if (typeof valueToAdd === 'object' && valueToAdd !== null && valueToAdd.hasOwnProperty('num')) {
            if (valueToAdd.num === "Error") { currentInternalValue = "Invalid Data"; isFractionMode = false; shouldResetDisplay = true; updateExpressionDisplay(); return; }
            valueToAdd = valueToAdd.num / valueToAdd.den;
        }
        if (typeof valueToAdd === 'number' && !isNaN(valueToAdd)) {
            statisticalData.push(valueToAdd); currentInternalValue = "Data Added";
            addHistoryEntry(`AddData(${formatValue(parseInputToInternalValue(originalInputForHistory),isFractionMode,true)})`, `Total: ${statisticalData.length}`);
        } else { currentInternalValue = "Invalid Data"; }
        isFractionMode = false; shouldResetDisplay = true; updateExpressionDisplay();
    }
    // ... (calculateMean, Variance, StdDev, clearStatisticalData 등도 유사하게 addHistoryEntry의 두번째 인자 포맷팅) ...
    function calculateMean() {
        if (statisticalData.length === 0) { currentInternalValue = "No Data"; updateExpressionDisplay(); return; }
        const sum = statisticalData.reduce((acc, val) => acc + val, 0); const result = sum / statisticalData.length;
        addHistoryEntry("Mean", formatValue(result, false, true)); currentInternalValue = result; updateExpressionDisplay();
    }
    function calculateVariance() {
        if (statisticalData.length < 2) { currentInternalValue = "Need >= 2 Data"; updateExpressionDisplay(); return; }
        const mean = statisticalData.reduce((acc, val) => acc + val, 0) / statisticalData.length;
        const sqDiff = statisticalData.map(val => (val - mean) ** 2);
        const result = sqDiff.reduce((acc, val) => acc + val, 0) / (statisticalData.length - 1);
        addHistoryEntry("Variance", formatValue(result, false, true)); currentInternalValue = result; updateExpressionDisplay();
    }
    function calculateStdDev() {
        if (statisticalData.length < 2) { currentInternalValue = "Need >= 2 Data"; updateExpressionDisplay(); return; }
        const mean = statisticalData.reduce((acc, val) => acc + val, 0) / statisticalData.length;
        const sqDiff = statisticalData.map(val => (val - mean) ** 2);
        const variance = sqDiff.reduce((acc, val) => acc + val, 0) / (statisticalData.length - 1);
        const result = Math.sqrt(variance);
        addHistoryEntry("StdDev", formatValue(result, false, true)); currentInternalValue = result; updateExpressionDisplay();
    }
    function clearStatisticalData() {
        statisticalData = []; currentInternalValue = "Data Cleared";
        shouldResetDisplay = true; isFractionMode = false; addHistoryEntry("Clear Stat Data", "Done"); updateExpressionDisplay();
    }

    // --- 행렬 함수 ---
    function storeMatrixA() {
        matrixA = parseMatrix(matrixAInput.value);
        const msg = matrixA ? "Stored A: " + formatMatrixToString(matrixA) : "Matrix Error: Invalid A format";
        currentInternalValue = msg; if(matrixA) addHistoryEntry("StoreA", formatMatrixToString(matrixA));
        isFractionMode = false; shouldResetDisplay = true; updateDisplay(); updateExpressionDisplay();
    }
    function storeMatrixB() {
        matrixB = parseMatrix(matrixBInput.value);
        const msg = matrixB ? "Stored B: " + formatMatrixToString(matrixB) : "Matrix Error: Invalid B format";
        currentInternalValue = msg; if(matrixB) addHistoryEntry("StoreB", formatMatrixToString(matrixB));
        isFractionMode = false; shouldResetDisplay = true; updateDisplay(); updateExpressionDisplay();
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
        isFractionMode = false; shouldResetDisplay = true; updateDisplay(); updateExpressionDisplay();
    }
    // ... (parseMatrix, formatMatrixToString, addMatrices, subtractMatrices, multiplyMatrices 기존과 동일) ...
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

    // --- 1차 방정식 풀이 함수 ---
    function solveLinearEquation() {
        const aVal = parseFloat(coeffAInput.value); const bVal = parseFloat(coeffBInput.value); const cVal = parseFloat(coeffCInput.value);
        let result; let expr = `${coeffAInput.value}x + ${coeffBInput.value} = ${coeffCInput.value}`;
        if (isNaN(aVal) || isNaN(bVal) || isNaN(cVal)) result = "Invalid coefficient";
        else if (aVal === 0) result = (bVal === cVal) ? "Infinite solutions" : "No solution";
        else result = (cVal - bVal) / aVal;
        addHistoryEntry(expr, formatValue(result, false, true)); currentInternalValue = result; // formatValue 추가
        isFractionMode = false; shouldResetDisplay = true; updateDisplay(); updateExpressionDisplay();
    }

    // --- 그래프 함수 ---
    // ... (sanitizeFunctionString, drawGraph 기존과 동일, drawGraph 끝에 updateExpressionDisplay() 추가)
    function sanitizeFunctionString(funcStr) { /* ... 기존 ... */
        const knownMathFunctions = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'log10', 'log2', 'exp', 'pow', 'sqrt', 'abs', 'ceil', 'floor', 'round', 'min', 'max', 'PI', 'E'];
        knownMathFunctions.forEach(knownFunc => {
            const regex = new RegExp(`\\b${knownFunc}\\b(?!\\()`, 'g');
            funcStr = funcStr.replace(regex, `Math.${knownFunc}`);
            const regexFunc = new RegExp(`\\b${knownFunc}\\((.*?)\\)`, 'g');
            funcStr = funcStr.replace(regexFunc, `Math.${knownFunc}($1)`);
        });
        funcStr = funcStr.replace(/\b[a-df-zA-DF-Z_]\w*\b/g, '');
        const forbiddenKeywords = ['window', 'document', 'alert', 'eval', 'script', 'function', '=>', 'return', 'this', 'new'];
        forbiddenKeywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            funcStr = funcStr.replace(regex, '');
        });
        return funcStr;
    }
    function drawGraph() {
        // ... (기존 그래프 그리기 로직) ...
        addHistoryEntry(`Graph f(x)=${functionInput.value}`, "Drawn");
        updateExpressionDisplay(); // 그래프 그린 후 수식 표시줄 업데이트 (선택적)
    }


    // --- 이벤트 핸들러 (기존 버튼) ---
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const value = button.textContent;
            const buttonClassList = button.classList;
            // ... (기존 메시지 상태 처리 로직) ...

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

            // updateDisplay는 각 핸들러 끝에서 호출되거나 여기서 일괄 호출
            // 수식 표시줄 업데이트는 각 핸들러가 자신의 로직에 맞게 호출하도록 변경
            // updateExpressionDisplay(); // 여기서 일괄 호출하면 섬세한 제어가 어려움
            updateDisplay();
        });
    });

    // --- 이벤트 핸들러 (추가된 버튼 - ID로 직접 연결된 것들) ---
    // ... (기존과 동일)
    if (storeMatrixAButton) storeMatrixAButton.addEventListener('click', storeMatrixA);
    if (storeMatrixBButton) storeMatrixBButton.addEventListener('click', storeMatrixB);
    if (addMatricesButton) addMatricesButton.addEventListener('click', () => handleMatrixOperation(addMatrices, '+'));
    if (subtractMatricesButton) subtractMatricesButton.addEventListener('click', () => handleMatrixOperation(subtractMatrices, '-'));
    if (multiplyMatricesButton) multiplyMatricesButton.addEventListener('click', () => handleMatrixOperation(multiplyMatrices, '*'));
    if (solveLinearEquationButton) solveLinearEquationButton.addEventListener('click', solveLinearEquation);
    if (toggleHistoryButton) toggleHistoryButton.addEventListener('click', toggleHistory);
    if (clearHistoryButton) clearHistoryButton.addEventListener('click', clearFullHistory);
    if (drawGraphButton) drawGraphButton.addEventListener('click', drawGraph);


    // --- 핵심 로직 함수 (수정) ---
    function handleNumber(value) {
        if (shouldResetDisplay) {
            currentInput = '0'; currentInternalValue = null;
            isEnteringDenominator = false; shouldResetDisplay = false;
            // previousInput = ''; operator = null; previousInternalValue = null; // 연산자 입력 후 숫자 입력 시 이전 상태 유지
        }
        const messageStates = ["Error", "No Data", "Need >= 2 Data", "Data Cleared", "Data Added", "Invalid Data", "Infinite solutions", "No solution", "Invalid coefficient"];
        if ((typeof currentInternalValue === 'string' && (currentInternalValue.startsWith("Stored") || currentInternalValue.startsWith("Matrix Error"))) ||
            messageStates.includes(currentInput) || messageStates.includes(currentInternalValue) ) {
            currentInput = '0'; currentInternalValue = null;
            // 이 경우 previousInput과 operator도 초기화하여 완전 새 계산 시작
            previousInput = ''; operator = null; previousInternalValue = null;
        }

        if (isEnteringDenominator) {
            const parts = currentInput.split('/');
            let denPart = parts[1] === '0' ? '' : (parts[1] || "");
            if (value === '.' && denPart.includes('.')) return;
            denPart += value; currentInput = parts[0] + '/' + denPart;
        } else {
            if (value === '.' && currentInput.includes('.') && !currentInput.includes('/')) return;
            if (currentInput === '0' && value !== '.') currentInput = value;
            else {
                // 너무 긴 입력 방지 (선택적)
                if (currentInput.length > 20 && !operator) return;
                currentInput += value;
            }
        }
        if (!isEnteringDenominator) currentInternalValue = null;
        updateExpressionDisplay();
    }

    function handleOperator(op) {
        const messageStates = ["Error", "No Data", "Need >= 2 Data", "Infinite solutions", "No solution", "Invalid coefficient"];
        if (messageStates.includes(currentInternalValue) || messageStates.includes(currentInput)) {
            currentInput = "0"; currentInternalValue = 0;
        }
        if (currentInternalValue !== null && typeof currentInternalValue === 'string'){ // 이전 결과가 문자열(메시지 등)이면 초기화
            currentInternalValue = null; currentInput = '0';
        }

        if (op === '/' && !isEnteringDenominator && !operator && !currentInput.includes('/')) {
            if (currentInput.endsWith('.') || (currentInput.startsWith('-') && currentInput.endsWith('.'))) {
                currentInternalValue = "Error"; updateDisplay(); updateExpressionDisplay(); return;
            }
            isEnteringDenominator = true;
            previousInput = currentInput; // '/' 입력 시 현재 입력을 previousInput으로
            currentInput += '/0';
            operator = op; // 연산자도 설정
            shouldResetDisplay = false;
            updateExpressionDisplay();
            updateDisplay(); return;
        }

        // currentInternalValue가 null이거나, 연산자 입력 직후 새 연산자 입력 시 (currentInput이 아직 0이거나 이전 값일 때)
        if (currentInternalValue === null || (shouldResetDisplay && currentInput === formatValue(previousInternalValue, isFractionMode))) {
            currentInternalValue = parseInputToInternalValue(currentInput);
        }

        if (operator && previousInternalValue !== null && !shouldResetDisplay) {
            handleEquals(true);
            if (formatValue(currentInternalValue, false) === "Error") { updateExpressionDisplay(); return; }
        }

        previousInternalValue = currentInternalValue;
        if (previousInternalValue === null || typeof previousInternalValue === 'string') {
             previousInternalValue = parseInputToInternalValue(currentInput);
        }

        if (formatValue(previousInternalValue,false) === "Error") {
            previousInternalValue = null; currentInternalValue = "Error";
            updateDisplay(); updateExpressionDisplay(); return;
        }

        previousInput = formatValue(previousInternalValue, isFractionMode, true);
        operator = op;
        shouldResetDisplay = true;
        isEnteringDenominator = false;
        currentInput = '0'; // 연산자 입력 후 currentInput은 다음 입력을 위해 0으로 (또는 이전 값 유지)

        updateExpressionDisplay();
    }

    function handleEquals(isIntermediateCalculation = false) {
        if (isEnteringDenominator && (currentInput.endsWith('/') || currentInput.endsWith('/0'))) {
            currentInternalValue = "Error"; resetCalculationState(); expressionDisplay.textContent = ''; updateDisplay(); return;
        }
        let currentValForCalc = (currentInternalValue === null || typeof currentInternalValue === 'string' && !isEnteringDenominator) ? parseInputToInternalValue(currentInput) : currentInternalValue;

        let expressionForHistory = null;
        if (!isIntermediateCalculation && operator && previousInternalValue !== null) {
            // previousInput은 연산자 입력 시점의 값, currentInput은 등호 입력 시점의 값
            // 수식 표시줄에 표시된 값을 히스토리 표현식으로 사용
            expressionForHistory = expressionDisplay.textContent;
        }

        if (operator === null || previousInternalValue === null) {
            currentInternalValue = currentValForCalc;
            if(!isIntermediateCalculation) {
                if (formatValue(currentInternalValue, false) !== "Error" && currentInput !== formatValue(currentInternalValue, isFractionMode)) {
                     // addHistoryEntry(currentInput, currentInput);
                }
                resetCalculationState(); // 연산자 없으면 상태 리셋
            } else { // 중간계산인데 연산자가 없었다면 (사실상 이 경우는 거의 없음)
                operator = null;
            }
            if (!isIntermediateCalculation) expressionDisplay.textContent = '';
            return;
        }

        if (formatValue(currentValForCalc, false) === "Error") {
             currentInternalValue = "Error"; resetCalculationState(); expressionDisplay.textContent = ''; updateDisplay(); return;
        }
        let result = calculate(previousInternalValue, currentValForCalc, operator);

        if (!isIntermediateCalculation && expressionForHistory && formatValue(result,false) !== "Error") {
            // 히스토리에는 최종 결과와 함께 기록
            addHistoryEntry(expressionForHistory, formatValue(result, isFractionMode, true));
        }

        currentInternalValue = result;
        currentInput = formatValue(currentInternalValue, isFractionMode);

        if (!isIntermediateCalculation) {
            resetCalculationState();
            // 최종 결과 후 수식 표시줄 업데이트: 예 "2+3=5" 또는 결과만 남기기
            if (formatValue(result, false) !== "Error") {
                 expressionDisplay.textContent = expressionForHistory ? `${expressionForHistory} = ${formatValue(result, isFractionMode, true)}` : formatValue(result, isFractionMode, true);
            } else {
                 expressionDisplay.textContent = '';
            }
        } else {
            previousInternalValue = currentInternalValue;
            previousInput = currentInput;
            // 중간 계산 시 수식 표시줄은 다음 연산을 위해 업데이트 되어야 함
            updateExpressionDisplay();
        }
        shouldResetDisplay = true;
    }

    function resetCalculationState() {
        previousInput = ''; operator = null; previousInternalValue = null;
        isEnteringDenominator = false;
        // currentInput = '0'; // C 버튼이나 새 계산 시작 시 currentInput은 '0'이 됨
        // currentInternalValue = null;
    }

    // ... (calculate 기존과 동일) ...
    function calculate(prev, current, op) {
        const pIsF = typeof prev === 'object' && prev !== null && prev.hasOwnProperty('num');
        const cIsF = typeof current === 'object' && current !== null && current.hasOwnProperty('num');
        if ((pIsF && prev.num === "Error") || (cIsF && current.num === "Error")) return "Error";
        let pVal = pIsF ? prev.num / prev.den : prev;
        let cVal = cIsF ? current.num / current.den : current;
        if (typeof pVal !== 'number' || typeof cVal !== 'number' || isNaN(pVal) || isNaN(cVal) ) return "Error";

        if (op === '^') {
            const res = Math.pow(pVal, cVal); if (isNaN(res) || !isFinite(res)) return "Error";
            return Number.isInteger(res) || Math.abs(res - parseFloat(res.toFixed(7))) < 1e-9 ? res : decimalToFraction(res);
        }
        let pFrac = pIsF ? prev : decimalToFraction(pVal);
        let cFrac = cIsF ? current : decimalToFraction(cVal);
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
        if(expressionDisplay) expressionDisplay.textContent = ''; // 수식 표시줄도 클리어
    };
    function handleClear() {
        currentInput = '0'; previousInput = ''; operator = null;
        shouldResetDisplay = false; isFractionMode = false;
        currentInternalValue = null; previousInternalValue = null; isEnteringDenominator = false;
        if(expressionDisplay) expressionDisplay.textContent = ''; // 수식 표시줄도 클리어
    }

    function handleFunction(funcName) {
        let expressionForDisplay = ''; // 수식 표시줄용
        if (funcName === 'π') {
            currentInput = String(Math.PI); // 주 화면에는 PI 값
            currentInternalValue = Math.PI;
            expressionForDisplay = 'π'; // 수식 표시줄에는 π 기호
            isFractionMode = false;
            shouldResetDisplay = true;
            operator = null; previousInput = ''; previousInternalValue = null;
            addHistoryEntry("π", currentInput);
            expressionDisplay.textContent = expressionForDisplay; // π 입력 시 수식창 바로 업데이트
            return;
        }

        const messageStates = ["Error", "Infinite solutions", "No solution", "Invalid coefficient"];
        if (messageStates.includes(currentInternalValue) || messageStates.includes(currentInput)) {
             if (funcName === 'log' || funcName === 'ln' || funcName === 'sqrt') {
                currentInternalValue = "Error"; shouldResetDisplay = true; updateExpressionDisplay(); return;
             }
        }

        const originalInputValueStr = currentInput; // 함수 적용 전 currentInput 값 (수식 표시용)
        const valToProcess = (currentInternalValue === null || typeof currentInternalValue === 'string') ? parseInputToInternalValue(currentInput) : currentInternalValue;
        let numValue;

        if (typeof valToProcess === 'object' && valToProcess !== null && valToProcess.hasOwnProperty('num')) {
            if (valToProcess.num === "Error") { currentInternalValue = "Error"; shouldResetDisplay = true; updateExpressionDisplay(); return;}
            numValue = valToProcess.num / valToProcess.den;
        } else if (typeof valToProcess === 'number') {
            numValue = valToProcess;
        } else { currentInternalValue = "Error"; shouldResetDisplay = true; updateExpressionDisplay(); return; }

        if (isNaN(numValue)) { currentInternalValue = "Error"; shouldResetDisplay = true; updateExpressionDisplay(); return; }

        let result;
        switch (funcName) {
            case 'sin': result = Math.sin(numValue * Math.PI / 180); break;
            case 'cos': result = Math.cos(numValue * Math.PI / 180); break;
            case 'tan': const angleDeg = numValue % 360; if (Math.abs(angleDeg % 180) === 90) { currentInternalValue = "Error"; shouldResetDisplay = true; updateExpressionDisplay(); return; }
                result = Math.tan(numValue * Math.PI / 180); break;
            case 'log': if (numValue <= 0) { currentInternalValue = "Error"; shouldResetDisplay = true; updateExpressionDisplay(); return; } result = Math.log10(numValue); break;
            case 'ln': if (numValue <= 0) { currentInternalValue = "Error"; shouldResetDisplay = true; updateExpressionDisplay(); return; } result = Math.log(numValue); break;
            case 'sqrt': if (numValue < 0) { currentInternalValue = "Error"; shouldResetDisplay = true; updateExpressionDisplay(); return; } result = Math.sqrt(numValue); break;
            default: updateExpressionDisplay(); return;
        }

        if (isNaN(result) || !isFinite(result)) currentInternalValue = "Error";
        else currentInternalValue = result;

        const formattedResultForHistory = formatValue(currentInternalValue, false, true);
        if (currentInternalValue !== "Error") {
            addHistoryEntry(`${funcName}(${originalInputValueStr})`, formattedResultForHistory);
            expressionDisplay.textContent = `${funcName}(${originalInputValueStr})`; // 함수 적용 수식 표시
        } else {
            expressionDisplay.textContent = ''; // 오류 시 수식 표시줄 비움
        }
        currentInput = formatValue(currentInternalValue, false); // 주 화면에는 결과

        isFractionMode = false; shouldResetDisplay = true;
        operator = null; previousInput = ''; previousInternalValue = null;
        isEnteringDenominator = false;
        // updateExpressionDisplay(); // 이미 위에서 처리
    }

    function handleModeToggle() {
        isFractionMode = !isFractionMode;
        if (currentInternalValue === null || typeof currentInternalValue === 'string') {
            let parsed = parseInputToInternalValue(currentInput);
            if (!(typeof parsed === 'object' && parsed !== null && parsed.num === 'Error') && typeof parsed !== 'string') {
                 currentInternalValue = parsed;
            } else if (typeof parsed === 'number' && !isNaN(parsed)) {
                 currentInternalValue = parsed;
            }
        }
        updateExpressionDisplay(); // 모드 변경 시 수식 표시도 업데이트 (숫자 포맷이 바뀔 수 있으므로)
    }

    function updateDisplay() {
        // ... (기존 updateDisplay 로직은 거의 그대로 사용) ...
        let displayValue;
        if (typeof currentInternalValue === 'string' &&
            (currentInternalValue.startsWith("Matrix Error") || currentInternalValue.startsWith("Stored") ||
             currentInternalValue === "Infinite solutions" || currentInternalValue === "No solution" ||
             currentInternalValue === "Invalid coefficient" || currentInternalValue === "No Data" ||
             currentInternalValue === "Need >= 2 Data" || currentInternalValue === "Data Cleared" ||
             currentInternalValue === "Data Added" || currentInternalValue === "Invalid Data" ||
             currentInternalValue === "Error" )) {
            displayValue = currentInternalValue;
        }
        else if (currentInternalValue !== null && !isEnteringDenominator && operator === null && shouldResetDisplay) { // 함수, 파이, 등호 후 결과 표시
             displayValue = formatValue(currentInternalValue, isFractionMode);
        }
        else if (currentInternalValue !== null && operator !== null && shouldResetDisplay) { // 연산자 입력 후, 이전 값(currentInternalValue) 표시
             displayValue = formatValue(currentInternalValue, isFractionMode);
        }
        else { // 숫자 입력 중
            displayValue = currentInput;
        }

        if (displayValue === "Error" || (typeof displayValue === 'object' && displayValue !== null && displayValue.num === "Error")) {
            displayValue = "Error";
        }
        else if (typeof displayValue === 'string' && displayValue.length > 15 && !displayValue.includes('/') && !displayValue.startsWith("[[")) {
            try {
                const num = parseFloat(displayValue);
                if (!isNaN(num) && Math.abs(num) > 1e-9 && (Math.abs(num) > 1e7 || Math.abs(num) < 1e-5)) {
                    displayValue = num.toExponential(9);
                } else if (num === 0) {
                    displayValue = "0";
                }
            } catch(e) { /* ignore */ }
        }
        display.value = displayValue;
    }

    // 초기 화면 업데이트
    updateDisplay();
    updateExpressionDisplay(); // 초기 수식 표시줄도 업데이트
});
