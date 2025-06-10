// tests.js
document.addEventListener('DOMContentLoaded', () => {
    const display = document.getElementById('result');
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
        if (Math.abs(expected - parseFloat(actual)) < tolerance) {
            logResult(`${testName}: Expected around "${expected}", Got "${actual}"`, true);
        } else {
            logResult(`${testName}: Expected around "${expected}", Got "${actual}" (Diff: ${Math.abs(expected - parseFloat(actual))})`, false);
        }
    }

    function getButton(textOrSelector) {
        let button;
        // 먼저 텍스트로 버튼을 찾습니다.
        const buttons = Array.from(document.querySelectorAll('.buttons button, .matrix-button, .solver-button, .history-button, .graphing-button'));
        button = buttons.find(btn => btn.textContent.trim() === textOrSelector);

        if (!button) {
            // 텍스트로 못 찾으면 셀렉터로 시도
            try {
                button = document.querySelector(textOrSelector);
            } catch (e) {
                // 유효하지 않은 셀렉터일 수 있음
            }
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
            // throw new Error(errorMsg); // 테스트 중단 대신 실패로 기록
        }
    }

    function resetCalculatorState() {
        // 'C' 버튼은 .clear 클래스를 가짐
        const clearButton = document.querySelector('.clear');
        if (clearButton) {
            clearButton.click();
        } else {
            console.error("Clear button not found for resetCalculatorState");
        }
        // 추가적으로 script.js 내부 상태 변수 직접 초기화 (필요시)
        // currentInput = '0'; currentInternalValue = null; ... (script.js와 동일한 변수명 사용)
        // 하지만 버튼 클릭으로 대부분 해결되어야 함.
    }

    // --- Test Cases ---

    function testAddition() {
        resetCalculatorState();
        simulateClick('3');
        simulateClick('+');
        simulateClick('5');
        simulateClick('=');
        assertEquals('8', display.value, 'Addition (3+5=8)');
    }

    function testSubtraction() {
        resetCalculatorState();
        simulateClick('1');
        simulateClick('0');
        simulateClick('-');
        simulateClick('4');
        simulateClick('=');
        assertEquals('6', display.value, 'Subtraction (10-4=6)');
    }

    function testMultiplication() {
        resetCalculatorState();
        simulateClick('7');
        simulateClick('*');
        simulateClick('6');
        simulateClick('=');
        assertEquals('42', display.value, 'Multiplication (7*6=42)');
    }

    function testDivision() {
        resetCalculatorState();
        simulateClick('1');
        simulateClick('2');
        simulateClick('/');
        simulateClick('3');
        simulateClick('=');
        assertEquals('4', display.value, 'Division (12/3=4)');
    }

    function testDivisionByZero() {
        resetCalculatorState();
        simulateClick('5');
        simulateClick('/');
        simulateClick('0');
        simulateClick('=');
        assertEquals('Error', display.value, 'Division by Zero (5/0=Error)');
    }

    function testOrderOfOperations() {
        resetCalculatorState();
        // 현재 계산기는 순차 계산을 하므로 2 + 3 * 4는 (2+3)*4 = 20
        simulateClick('2');
        simulateClick('+');
        simulateClick('3');
        simulateClick('*');
        simulateClick('4');
        simulateClick('=');
        assertEquals('20', display.value, 'Order of Operations (Sequential: 2+3*4=20)');
        // 만약 우선순위가 구현된다면 기대값은 14
    }

    function testDecimalInput() {
        resetCalculatorState();
        simulateClick('1');
        simulateClick('.');
        simulateClick('2');
        simulateClick('+');
        simulateClick('3');
        simulateClick('.');
        simulateClick('4');
        simulateClick('=');
        assertEquals('4.6', display.value, 'Decimal Input (1.2+3.4=4.6)');
    }

    function testClearButton() {
        resetCalculatorState(); // 시작 시 초기화
        simulateClick('1');
        simulateClick('2');
        simulateClick('3');
        simulateClick('C'); // .clear 클래스를 가진 버튼
        assertEquals('0', display.value, 'Clear Button (123 -> C -> 0)');

        resetCalculatorState();
        simulateClick('1');
        simulateClick('+');
        simulateClick('2');
        simulateClick('C'); // 연산자 입력 후 C
        assertEquals('0', display.value, 'Clear Button (1+2 -> C -> 0)');
        // C를 누르면 previousInput, operator 등도 초기화되어야 함 (script.js 로직 확인)
    }

    function testFunctionSin() {
        resetCalculatorState();
        simulateClick('3');
        simulateClick('0'); // 30
        simulateClick('sin');
        assertAlmostEquals(0.5, display.value, 'Sine Function (sin(30)=0.5)');
    }

    function testFractionInputAndToggle() {
        resetCalculatorState();
        simulateClick('2');
        simulateClick('/'); // isEnteringDenominator = true, currentInput = "2/0"
        simulateClick('4'); // currentInput = "2/4"
        simulateClick('F<=>D'); // isFractionMode = true, currentInternalValue = {num:1, den:2}
        assertEquals('1/2', display.value, 'Fraction Input and Toggle (2/4 -> F<=>D -> 1/2)');

        simulateClick('F<=>D'); // isFractionMode = false
        assertAlmostEquals(0.5, display.value, 'Fraction Toggle to Decimal (1/2 -> F<=>D -> 0.5)');
    }

    function testChainedOperations() {
        resetCalculatorState();
        simulateClick('1');
        simulateClick('0');
        simulateClick('+');
        simulateClick('5');
        simulateClick('-'); // Should calculate 10+5=15, then prepare for 15 - ?
        simulateClick('3');
        simulateClick('=');
        assertEquals('12', display.value, 'Chained Operations (10+5-3=12)');
    }


    // --- Run Tests ---
    function runAllTests() {
        console.log("Starting Calculator Tests...");

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
        // 여기에 더 많은 테스트 추가

        console.log("Calculator Tests Finished.");
        testSummaryDiv.textContent = `Tests Completed: ${testsPassed} Passed, ${testsFailed} Failed.`;
        if (testsFailed > 0) {
            testSummaryDiv.className = 'test-fail';
        } else {
            testSummaryDiv.className = 'test-pass';
        }
    }

    runAllTests();
});
