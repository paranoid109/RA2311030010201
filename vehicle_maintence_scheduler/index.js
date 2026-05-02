const { Log } = require('../Logging_middleware');
const { maximizeImpact } = require('./scheduler.js');

const DEPOT_API = "http://20.207.122.201/evaluation-service/depots";
const VEHICLES_API = "http://20.207.122.201/evaluation-service/vehicles";
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJhYzkyMzFAc3JtaXN0LmVkdS5pbiIsImV4cCI6MTc3NzcwNDY5OSwiaWF0IjoxNzc3NzAzNzk5LCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiNTQ1YmQ5OWQtZmUwZi00ZmY0LWE0MWItNzRiMjJkZTE5MzczIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoiYWRpdHlhIGNoYXVoYW4iLCJzdWIiOiJmNGM3ZmQyNS1kMjU1LTQxOWMtODE1ZS1iNmJiODgwZDY1NWUifSwiZW1haWwiOiJhYzkyMzFAc3JtaXN0LmVkdS5pbiIsIm5hbWUiOiJhZGl0eWEgY2hhdWhhbiIsInJvbGxObyI6InJhMjMxMTAzMDAxMDIwMSIsImFjY2Vzc0NvZGUiOiJRa2JweEgiLCJjbGllbnRJRCI6ImY0YzdmZDI1LWQyNTUtNDE5Yy04MTVlLWI2YmI4ODBkNjU1ZSIsImNsaWVudFNlY3JldCI6IlZhTW5EeGpLVlhuZGVZWEYifQ.wG96Y6exWm87kLSryVGUenMXZH0hLGBATEwJMWy0lO8";

async function processDepots() {
    try {
        await Log("backend", "info", "cron_job", "Starting depot scheduling process");

        const res = await fetch(DEPOT_API, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });

        if (!res.ok) {
            await Log("backend", "error", "domain", `Failed to fetch depots: ${res.status}`);
            return;
        }

        const depotsData = await res.json();
        const depots = depotsData.depots;

        const vRes = await fetch(VEHICLES_API, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });

        if (!vRes.ok) {
            await Log("backend", "error", "domain", `Failed to fetch vehicles: ${vRes.status}`);
            return;
        }

        const vehiclesData = await vRes.json();
        const vehiclesList = vehiclesData.vehicles;

        for (const depot of depots) {
            const selected = maximizeImpact(vehiclesList, depot.MechanicHours);
            
            let totalScore = selected.reduce((sum, v) => sum + v.Impact, 0);
            let totalTime = selected.reduce((sum, v) => sum + v.Duration, 0);

            console.log(`\n=== Depot ID: ${depot.ID} ===`);
            console.log(`Vehicles selected: ${selected.length}`);
            console.log(`Total Impact Score: ${totalScore}`);
            console.log(`Total Time Used: ${totalTime} / ${depot.MechanicHours} hrs`);
            console.log(`Vehicle IDs:`, selected.map(v => v.TaskID).join(', '));

            await Log("backend", "info", "controller", `Successfully scheduled depot ${depot.ID}`);
        }

    } catch (error) {
        console.error(error);
        await Log("backend", "fatal", "domain", "Crash during scheduling process");
    }
}

processDepots();