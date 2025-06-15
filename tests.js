// tests.js
document.addEventListener('DOMContentLoaded', () => {
    const mainDisplay = document.getElementById('result'); // 주 결과 화면
    const expressionDisplay = document.getElementById('expressionDisplay'); // 수식 표시줄
    const historyDisplayArea = document.getElementById('historyDisplay'); // 히스토리 표시 영역

    const testSummaryDiv = document.getElementById('summary');
    const testDetailsUl = document.getElementById('details');

    let testsPassed = 0;
    let testsFailed = 0;

    function logResult(message, passed) {
        const li = document.createElement('li');
        li.textContent = message;
        li.className = passed ? 'test-pass' : 'test-fail';
        testDetailsUl.appendChild(li);
        if (passed) {
            testsPassed++;
            console.log(`%cPASS: ${message}`, 'color: green;');
        } else {
            testsFailed++;
            console.error(`FAIL: ${message}`);
        }
    }

    function assertEquals(expected, actual, testName) {
        if (expected === actual) {
            logResult(`${testName}: Expected "${expected}", Got "${actual}"`, true);
        } else {
            logResult(`${testName}: Expected "${expected}", Got "${actual}"`, false);
        }
    }

    function assertAlmostEquals(expected, actual, testName, tolerance = 0.00001) {
        const actualNum = parseFloat(actual);
        if (Math.abs(expected - actualNum) < tolerance) {
            logResult(`${testName}: Expected around "${expected}", Got "${actualNum}"`, true);
        } else {
            logResult(`${testName}: Expected around "${expected}", Got "${actualNum}" (Diff: ${Math.abs(expected - actualNum)})`, false);
        }
    }

    function getButton(textOrSelector) {
        let button;
        // .buttons 내부의 버튼들 (기존 계산기 버튼)
        const calcButtons = Array.from(document.querySelectorAll('.buttons button'));
        button = calcButtons.find(btn => btn.textContent.trim() === textOrSelector);

        if (!button) { // ID로 다른 버튼들 검색
            try {
                button = document.querySelector(textOrSelector) || document.getElementById(textOrSelector);
            } catch (e) { /* ignore */ }
        }
        return button;
    }

    function simulateClick(textOrSelector) {
        const button = getButton(textOrSelector);
        if (button) {
            button.click();
        } else {
            const errorMsg = `Button "${textOrSelector}" not found for simulation.`;
            logResult(errorMsg, false);
        }
    }

    // Helper functions to get display values
    function getMainDisplayValue() {
        return mainDisplay.value;
    }

    function getExpressionDisplayValue() {
        return expressionDisplay.textContent;
    }

    function isElementVisible(element) {
        if (!element) return false;
        return element.style.display !== 'none' && element.getClientRects().length > 0;
    }

    function resetCalculatorState() {
        simulateClick('C'); // 'C' 버튼 클릭으로 대부분의 상태 초기화
        // expressionDisplay는 C 버튼에 의해 script.js에서 초기화됨
        // 히스토리 초기화는 별도 테스트에서 다루거나, 필요시 여기서 clearHistory 버튼 클릭
    }

    // --- Test Cases ---
    function testAddition() { /* 기존 */
        resetCalculatorState(); simulateClick('3'); simulateClick('+'); simulateClick('5'); simulateClick('=');
        assertEquals('8', getMainDisplayValue(), 'Addition (3+5=8)');
    }
    function testSubtraction() { /* 기존 */
        resetCalculatorState(); simulateClick('1'); simulateClick('0'); simulateClick('-'); simulateClick('4'); simulateClick('=');
        assertEquals('6', getMainDisplayValue(), 'Subtraction (10-4=6)');
    }
    function testMultiplication() { /* 기존 */
        resetCalculatorState(); simulateClick('7'); simulateClick('*'); simulateClick('6'); simulateClick('=');
        assertEquals('42', getMainDisplayValue(), 'Multiplication (7*6=42)');
    }
    function testDivision() { /* 기존 */
        resetCalculatorState(); simulateClick('1'); simulateClick('2'); simulateClick('/'); simulateClick('3'); simulateClick('=');
        assertEquals('4', getMainDisplayValue(), 'Division (12/3=4)');
    }
    function testDivisionByZero() { /* 기존 */
        resetCalculatorState(); simulateClick('5'); simulateClick('/'); simulateClick('0'); simulateClick('=');
        assertEquals('Error', getMainDisplayValue(), 'Division by Zero (5/0=Error)');
    }
    function testOrderOfOperations() { /* 기존 */
        resetCalculatorState(); simulateClick('2'); simulateClick('+'); simulateClick('3'); simulateClick('*'); simulateClick('4'); simulateClick('=');
        assertEquals('20', getMainDisplayValue(), 'Order of Operations (Sequential: 2+3*4=20)');
    }
    function testDecimalInput() { /* 기존 */
        resetCalculatorState(); simulateClick('1'); simulateClick('.'); simulateClick('2'); simulateClick('+'); simulateClick('3'); simulateClick('.'); simulateClick('4'); simulateClick('=');
        assertEquals('4.6', getMainDisplayValue(), 'Decimal Input (1.2+3.4=4.6)');
    }
    function testClearButton() { /* 기존 + expressionDisplay 확인 */
        resetCalculatorState(); simulateClick('1'); simulateClick('2'); simulateClick('+'); simulateClick('3');
        assertEquals('12 + 3', getExpressionDisplayValue(), 'Clear Button - Expression before C');
        simulateClick('C');
        assertEquals('0', getMainDisplayValue(), 'Clear Button (Display: 12+3 -> C -> 0)');
        assertEquals('', getExpressionDisplayValue(), 'Clear Button (Expression: 12+3 -> C -> Cleared)');
    }
    function testFunctionSin() { /* 기존 */
        resetCalculatorState(); simulateClick('3'); simulateClick('0'); simulateClick('sin');
        assertAlmostEquals(0.5, getMainDisplayValue(), 'Sine Function (sin(30)=0.5)');
        assertEquals('sin(30)', getExpressionDisplayValue(), 'Sine Function - Expression Display');
    }
    function testFractionInputAndToggle() { /* 기존 */
        resetCalculatorState(); simulateClick('2'); simulateClick('/'); simulateClick('4');
        simulateClick('F<=>D');
        assertEquals('1/2', getMainDisplayValue(), 'Fraction Input and Toggle (2/4 -> F<=>D -> 1/2)');
        assertEquals('1/2', getExpressionDisplayValue(), 'Fraction Input - Expression Display after F<=>D'); // F<=>D 누르면 수식창도 현재 값 반영
        simulateClick('F<=>D');
        assertAlmostEquals(0.5, getMainDisplayValue(), 'Fraction Toggle to Decimal (1/2 -> F<=>D -> 0.5)');
        assertEquals('0.5', getExpressionDisplayValue(), 'Fraction Toggle to Decimal - Expression Display');
    }
    function testChainedOperations() { /* 기존 */
        resetCalculatorState(); simulateClick('1'); simulateClick('0'); simulateClick('+'); simulateClick('5');
        simulateClick('-');
        assertEquals('15 - ', getExpressionDisplayValue(), 'Chained Ops - Expr after 10+5-');
        simulateClick('3'); simulateClick('=');
        assertEquals('12', getMainDisplayValue(), 'Chained Operations (10+5-3=12)');
        assertEquals('15 - 3 = 12', getExpressionDisplayValue(), 'Chained Ops - Final Expression');
    }

    // --- New Test Cases ---
    function testPiButton() {
        resetCalculatorState();
        simulateClick('π'); // 'π' 버튼의 textContent 또는 ID로 클릭
        assertEquals(String(Math.PI), getMainDisplayValue(), "Pi button should display PI value on main display");
        assertEquals('π', getExpressionDisplayValue(), "Pi button should show π in expression display");
    }

    function testPiCalculation() {
        resetCalculatorState();
        simulateClick('π');
        simulateClick('+');
        simulateClick('1');
        simulateClick('=');
        assertAlmostEquals(Math.PI + 1, getMainDisplayValue(), "PI + 1 calculation");
        assertEquals('π + 1 = ' + String(Math.PI + 1), getExpressionDisplayValue(), "PI + 1 - Final Expression");
    }

    function testPiInFunction() {
        resetCalculatorState();
        simulateClick('π');
        simulateClick('cos'); // cos(Math.PI degrees)
        assertAlmostEquals(Math.cos(Math.PI * Math.PI / 180), getMainDisplayValue(), "cos(PI degrees)");
        assertEquals(`cos(π)`, getExpressionDisplayValue(), "cos(PI) - Expression Display");
    }

    function testHistoryDisplayToggle() {
        resetCalculatorState();
        // 히스토리 버튼 ID로 시뮬레이션
        const toggleBtn = document.getElementById('toggleHistory');
        if (!toggleBtn) { logResult("History toggle button not found", false); return; }

        assertEquals(false, isElementVisible(historyDisplayArea), "History should be hidden initially or after reset");

        toggleBtn.click(); // 첫번째 클릭: 보이기
        assertEquals(true, isElementVisible(historyDisplayArea), "History should be visible after first toggle");

        toggleBtn.click(); // 두번째 클릭: 숨기기
        assertEquals(false, isElementVisible(historyDisplayArea), "History should be hidden after second toggle");
    }

    function testExpressionDisplayUpdate() {
        resetCalculatorState();
        simulateClick('1');
        assertEquals('1', getExpressionDisplayValue(), "Expression display for 1");
        simulateClick('+');
        assertEquals('1 + ', getExpressionDisplayValue(), "Expression display for 1+"); // currentInput이 '0'이므로 생략됨
        simulateClick('2');
        assertEquals('1 + 2', getExpressionDisplayValue(), "Expression display for 1+2");
        simulateClick('-');
        assertEquals('3 - ', getExpressionDisplayValue(), "Expression display for 1+2- (evaluates to 3-)");
        simulateClick('π');
        assertEquals('3 - π', getExpressionDisplayValue(), "Expression display for 1+2-π (evaluates to 3-π)");
    }

    function testExpressionDisplayClearOnEquals() {
        resetCalculatorState();
        simulateClick('1');
        simulateClick('+');
        simulateClick('2');
        simulateClick('=');
        // 현재 script.js는 handleEquals에서 expressionDisplay.textContent = expressionForHistory ? `${expressionForHistory} = ${formatValue(result, isFractionMode, true)}` : formatValue(result, isFractionMode, true);
        // 로 설정하므로, 비워지지 않고 최종 결과를 표시함.
        assertEquals('1 + 2 = 3', getExpressionDisplayValue(), "Expression display shows final equation on equals");
    }

    function testExpressionDisplayFormatting() {
        resetCalculatorState();
        simulateClick('1');
        simulateClick('/');
        simulateClick('2'); // currentInput = "1/2"
        // 이때 expressionDisplay는 currentInput인 "1/2" 또는 parse된 {num:1, den:2}의 포맷팅된 값
        assertEquals('1/2', getExpressionDisplayValue(), "Expression display for 1/2");
        simulateClick('+');
        assertEquals('1/2 + ', getExpressionDisplayValue(), "Expression display for 1/2 +");
        simulateClick('π');
        assertEquals('1/2 + π', getExpressionDisplayValue(), "Expression display for 1/2 + π");
    }


    // --- Run Tests ---
    function runAllTests() {
        console.log("Starting Calculator Tests...");

        // 기존 테스트
        testAddition();
        testSubtraction();
        testMultiplication();
        testDivision();
        testDivisionByZero();
        testOrderOfOperations();
        testDecimalInput();
        testClearButton();
        testFunctionSin();
        testFractionInputAndToggle();
        testChainedOperations();

        // 신규 테스트
        testPiButton();
        testPiCalculation();
        testPiInFunction();
        testHistoryDisplayToggle();
        testExpressionDisplayUpdate();
        testExpressionDisplayClearOnEquals();
        testExpressionDisplayFormatting();

        console.log("Calculator Tests Finished.");
        testSummaryDiv.textContent = `Tests Completed: ${testsPassed} Passed, ${testsFailed} Failed.`;
        if (testsFailed > 0) {
            testSummaryDiv.className = 'test-fail';
        } else {
            testSummaryDiv.className = 'test-pass';
        }
    }

    // test.html에 계산기 UI가 모두 로드된 후 테스트 실행
    // script.js가 DOMContentLoaded를 기다리므로, 여기서도 동일하게 처리하거나 약간의 지연을 줄 수 있음.
    // 현재 script.js와 tests.js 모두 DOMContentLoaded를 기다리므로, script.js가 먼저 실행되도록 보장 필요.
    // test.html에서 script.js를 tests.js보다 먼저 로드하면 일반적으로 script.js의 DOMContentLoaded가 먼저 실행됨.
    runAllTests();
});
