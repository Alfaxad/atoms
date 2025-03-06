import { AtomProfile } from './types';
import * as fs from 'fs';
import * as path from 'path';

export class AtomManager {
  private basePath: string;
  private atoms: Map<string, AtomProfile> = new Map();

  constructor() {
    this.basePath = path.join(process.cwd(), 'data', 'atoms');
  }

  async loadAtoms(): Promise<void> {
    // Clear existing atoms
    this.atoms.clear();
    
    // Ensure the directory exists
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
      return;
    }
    
    // Read all atom files
    const files = fs.readdirSync(this.basePath).filter(file => file.endsWith('.json'));
    
    for (const file of files) {
      const filePath = path.join(this.basePath, file);
      const atomData = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as AtomProfile;
      this.atoms.set(atomData.id, atomData);
    }
    
    console.log(`Loaded ${this.atoms.size} atoms from disk`);
  }

  getAtom(id: string): AtomProfile | undefined {
    return this.atoms.get(id);
  }

  getAllAtoms(): AtomProfile[] {
    return Array.from(this.atoms.values());
  }

  getAtomsByProfession(profession: string): AtomProfile[] {
    return this.getAllAtoms().filter(atom => atom.persona.profession === profession);
  }

  getAtomsByTradingStrategy(strategy: string): AtomProfile[] {
    return this.getAllAtoms().filter(atom => atom.tradingStrategy === strategy);
  }

  getAtomsByDecisionModel(model: string): AtomProfile[] {
    return this.getAllAtoms().filter(atom => atom.decisionModel === model);
  }

  getFraudulentAtoms(): AtomProfile[] {
    return this.getAllAtoms().filter(atom => atom.fraudulent);
  }

  getLegitimateAtoms(): AtomProfile[] {
    return this.getAllAtoms().filter(atom => !atom.fraudulent);
  }
}
