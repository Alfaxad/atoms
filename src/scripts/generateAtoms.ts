import { AtomGenerator } from '../agents/atomGenerator';
import { validateEnvironment } from '../utils/environment';
import { loadConfig } from '../config/simulationConfig';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  try {
    // Validate environment variables
    validateEnvironment();
    
    // Load configuration
    const config = loadConfig();
    
    console.log(`Starting atom generation (${config.atomCount} atoms, ${config.fraudPercentage * 100}% fraudulent)...`);
    
    // Create atom generator
    const atomGenerator = new AtomGenerator();
    
    // Generate atoms
    const atoms = await atomGenerator.generateBatch(config.atomCount, config.fraudPercentage);
    
    // Save summary to file
    const summary = {
      totalAtoms: atoms.length,
      fraudulentAtoms: atoms.filter(a => a.fraudulent).length,
      legitimateAtoms: atoms.filter(a => !a.fraudulent).length,
      professionBreakdown: atoms.reduce((acc: Record<string, number>, atom) => {
        const profession = atom.persona.profession;
        acc[profession] = (acc[profession] || 0) + 1;
        return acc;
      }, {}),
      tradingStrategyBreakdown: atoms.reduce((acc: Record<string, number>, atom) => {
        const strategy = atom.tradingStrategy;
        acc[strategy] = (acc[strategy] || 0) + 1;
        return acc;
      }, {}),
      decisionModelBreakdown: atoms.reduce((acc: Record<string, number>, atom) => {
        const model = atom.decisionModel;
        acc[model] = (acc[model] || 0) + 1;
        return acc;
      }, {}),
      totalInitialBalance: atoms.reduce((sum, atom) => sum + atom.initialBalance, 0),
      averageInitialBalance: atoms.reduce((sum, atom) => sum + atom.initialBalance, 0) / atoms.length,
      generatedAt: new Date().toISOString()
    };
    
    const summaryPath = path.join(process.cwd(), 'data', 'atom_summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log(`Atom generation complete! Summary saved to ${summaryPath}`);
    console.log(`Generated ${atoms.length} atoms (${summary.fraudulentAtoms} fraudulent, ${summary.legitimateAtoms} legitimate)`);
    console.log(`Total initial balance: ${summary.totalInitialBalance.toFixed(2)} SOL`);
    console.log(`Average initial balance: ${summary.averageInitialBalance.toFixed(2)} SOL`);
    
  } catch (error) {
    console.error('Error generating atoms:', error);
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
