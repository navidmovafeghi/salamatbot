// Copy and paste this code into your browser console at http://localhost:3000

// Test 1: Simple Persian Message
async function test1() {
    console.log("🧪 Test 1: Simple Persian Message");
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: "سلام، چطوری؟",
                conversationHistory: []
            })
        });
        const result = await response.json();
        console.log("✅ Success:", result);
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

// Test 2: Medical Question
async function test2() {
    console.log("🧪 Test 2: Medical Question");
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: "سردرد دارم و احساس خستگی می‌کنم. چه کار کنم؟",
                conversationHistory: []
            })
        });
        const result = await response.json();
        console.log("✅ Success:", result);
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

// Test 3: Emergency Keywords
async function test3() {
    console.log("🧪 Test 3: Emergency Detection");
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: "درد قفسه سینه دارم و تنگی نفس",
                conversationHistory: []
            })
        });
        const result = await response.json();
        console.log("✅ Success:", result);
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

// Test 4: Error Handling
async function test4() {
    console.log("🧪 Test 4: Error Handling (Empty Message)");
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: "",
                conversationHistory: []
            })
        });
        const result = await response.json();
        console.log("✅ Response:", result);
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

// Run all tests
async function runAllTests() {
    console.log("🚀 Starting API Tests...");
    await test1();
    console.log("---");
    await test2();
    console.log("---");
    await test3();
    console.log("---");
    await test4();
    console.log("🏁 All tests completed!");
}

// Instructions
console.log("📋 Available test functions:");
console.log("- test1() - Simple Persian message");
console.log("- test2() - Medical question");
console.log("- test3() - Emergency detection");
console.log("- test4() - Error handling");
console.log("- runAllTests() - Run all tests");
console.log("");
console.log("💡 Run: runAllTests() to test everything at once");