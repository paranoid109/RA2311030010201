const LOG_URL = "http://20.207.122.201/evaluation-service/logs";
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJhYzkyMzFAc3JtaXN0LmVkdS5pbiIsImV4cCI6MTc3NzcwNDY5OSwiaWF0IjoxNzc3NzAzNzk5LCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiNTQ1YmQ5OWQtZmUwZi00ZmY0LWE0MWItNzRiMjJkZTE5MzczIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoiYWRpdHlhIGNoYXVoYW4iLCJzdWIiOiJmNGM3ZmQyNS1kMjU1LTQxOWMtODE1ZS1iNmJiODgwZDY1NWUifSwiZW1haWwiOiJhYzkyMzFAc3JtaXN0LmVkdS5pbiIsIm5hbWUiOiJhZGl0eWEgY2hhdWhhbiIsInJvbGxObyI6InJhMjMxMTAzMDAxMDIwMSIsImFjY2Vzc0NvZGUiOiJRa2JweEgiLCJjbGllbnRJRCI6ImY0YzdmZDI1LWQyNTUtNDE5Yy04MTVlLWI2YmI4ODBkNjU1ZSIsImNsaWVudFNlY3JldCI6IlZhTW5EeGpLVlhuZGVZWEYifQ.wG96Y6exWm87kLSryVGUenMXZH0hLGBATEwJMWy0lO8";

const Log = async (stack, level, pkg, message) => {
    try {
        const payload = {
            stack: stack.toLowerCase(),
            level: level.toLowerCase(),
            package: pkg.toLowerCase(),
            message: message
        };

        const response = await fetch(LOG_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error(`Logger API failed: ${response.status}`);
        }
    } catch (err) {
        console.error("Logger caught an error:", err.message);
    }
};

module.exports = { Log };