#!/bin/bash
echo "=== ATOMS Simulation Full Process ==="
echo ""

echo "Step 1: Installing dependencies..."
npm install

echo ""
echo "Step 2: Building the project..."
npm run build

echo ""
echo "Step 3: Generating atoms..."
npm run generate-atoms

echo ""
echo "Step 4: Initializing communication system..."
npm run init-communication

echo ""
echo "Step 5: Initializing trading environment..."
npm run init-trading

echo ""
echo "Step 6: Running simulation..."
echo "The simulation will run for 10 minutes automatically"
echo "Starting simulation with 50x time acceleration"

# Create a temporary JavaScript file to control the simulation
cat > run_simulation.js << 'EOF'
const { spawn } = require('child_process');
const simulationProcess = spawn('npm', ['run', 'simulate'], { stdio: ['pipe', 'inherit', 'inherit'] });

// Send commands to the simulation
function sendCommand(command) {
  simulationProcess.stdin.write(command + '\n');
}

// Start the simulation with commands
setTimeout(() => sendCommand('start'), 5000);
setTimeout(() => sendCommand('speed 50'), 7000);
setTimeout(() => sendCommand('status'), 30000);
setTimeout(() => sendCommand('status'), 120000);
setTimeout(() => sendCommand('status'), 300000);
setTimeout(() => sendCommand('status'), 480000);
setTimeout(() => {
  console.log('\nSimulation ran for 10 minutes, stopping now...');
  sendCommand('stop');
  setTimeout(() => {
    sendCommand('exit');
    setTimeout(() => {
      // Move on to reporting
      const reportProcess = spawn('node', ['run_reporting.js'], { stdio: 'inherit' });
      reportProcess.on('close', () => {
        console.log('\n=== ATOMS Simulation Complete ===');
        console.log('Reports and data exports are available in the data directory');
        // Clean up temp files
        require('fs').unlinkSync('run_simulation.js');
        require('fs').unlinkSync('run_reporting.js');
      });
    }, 2000);
  }, 2000);
}, 600000); // 10 minutes
EOF

# Create a temporary JavaScript file to handle reporting
cat > run_reporting.js << 'EOF'
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
EOF

# Run the simulation control script
node run_simulation.js

echo ""
echo "=== ATOMS Simulation Process Completed ==="
