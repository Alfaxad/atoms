const { spawn } = require('child_process');
const reportProcess = spawn('npm', ['run', 'generate-reports'], { stdio: ['pipe', 'inherit', 'inherit'] });

// Send options to the report generator
function sendOption(option) {
  reportProcess.stdin.write(option + '\n');
}

console.log("\nStep 7: Generating reports and exporting data...");
// Wait for the prompt and then select options
setTimeout(() => sendOption('5'), 5000); // Generate all reports
setTimeout(() => sendOption('9'), 60000); // Export all data (after reports are done)
setTimeout(() => sendOption('0'), 90000); // Exit when done
