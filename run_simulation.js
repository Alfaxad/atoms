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
