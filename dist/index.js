"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const environment_1 = require("./utils/environment");
const simulationConfig_1 = require("./config/simulationConfig");
async function main() {
    try {
        // Validate environment variables
        (0, environment_1.validateEnvironment)();
        // Load configuration
        const config = (0, simulationConfig_1.loadConfig)();
        console.log('ATOMS Simulation Starting...');
        console.log('Configuration:', config);
        // More initialization code will go here
        console.log('ATOMS Simulation initialized successfully.');
    }
    catch (error) {
        console.error('Error initializing ATOMS Simulation:', error);
        process.exit(1);
    }
}
// Run the main function
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}
