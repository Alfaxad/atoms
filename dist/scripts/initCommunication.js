"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atomManager_1 = require("../agents/atomManager");
const communicationSystem_1 = require("../communication/communicationSystem");
const environment_1 = require("../utils/environment");
const simulationConfig_1 = require("../config/simulationConfig");
async function main() {
    try {
        // Validate environment variables
        (0, environment_1.validateEnvironment)();
        // Load configuration
        const config = (0, simulationConfig_1.loadConfig)();
        console.log('Initializing communication system...');
        // Create atom manager and load atoms
        const atomManager = new atomManager_1.AtomManager();
        await atomManager.loadAtoms();
        // Create communication system
        const communicationSystem = new communicationSystem_1.CommunicationSystem(atomManager);
        await communicationSystem.initialize();
        // Register all atoms in the main channel
        communicationSystem.registerAllAtoms();
        // Generate some initial messages
        console.log('Generating initial messages...');
        const messages = await communicationSystem.batchGenerateMessages(50);
        console.log(`Generated ${messages.length} initial messages`);
        console.log('Sample messages:');
        // Show 5 random messages
        const sampleMessages = messages
            .sort(() => Math.random() - 0.5)
            .slice(0, 5);
        for (const message of sampleMessages) {
            const atom = atomManager.getAtom(message.atomId);
            console.log(`${atom?.persona.name} (${atom?.persona.profession}): ${message.content}`);
        }
        // Generate some fraudulent messages
        console.log('\nGenerating sample fraud campaign messages...');
        const fraudMessages = await communicationSystem.generateFraudCampaignMessages('ATOM1', 'buildup');
        console.log(`Generated ${fraudMessages.length} fraud campaign messages`);
        console.log('Sample fraud messages:');
        for (const message of fraudMessages) {
            const atom = atomManager.getAtom(message.atomId);
            console.log(`${atom?.persona.name} (${atom?.persona.profession}) [FRAUDULENT]: ${message.content}`);
        }
        // Show topic trends
        console.log('\nCurrent topic trends:');
        const trends = communicationSystem.getTopicTrends(5);
        console.log(trends);
        console.log('\nCommunication system initialized successfully!');
    }
    catch (error) {
        console.error('Error initializing communication system:', error);
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
