import { Relationship } from './types';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

export class RelationshipManager {
  private relationships: Map<string, Relationship> = new Map();
  private atomRelationships: Map<string, Set<string>> = new Map();
  private basePath: string;

  constructor() {
    this.basePath = path.join(process.cwd(), 'data', 'relationships');
    
    // Ensure the relationships directory exists
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  private getRelationshipKey(atom1Id: string, atom2Id: string): string {
    // Ensure consistent ordering for the key
    return [atom1Id, atom2Id].sort().join('_');
  }

  getRelationship(atom1Id: string, atom2Id: string): Relationship | undefined {
    const key = this.getRelationshipKey(atom1Id, atom2Id);
    return this.relationships.get(key);
  }

  createOrUpdateRelationship(atom1Id: string, atom2Id: string, strengthChange: number): Relationship {
    const key = this.getRelationshipKey(atom1Id, atom2Id);
    const now = Date.now();
    
    let relationship = this.relationships.get(key);
    
    if (relationship) {
      // Update existing relationship
      relationship.strength = Math.max(0, Math.min(5, relationship.strength + strengthChange));
      relationship.lastInteraction = now;
    } else {
      // Create new relationship
      relationship = {
        atom1Id: atom1Id < atom2Id ? atom1Id : atom2Id, // Ensure consistent ordering
        atom2Id: atom1Id < atom2Id ? atom2Id : atom1Id,
        strength: Math.max(0, Math.min(5, 1 + strengthChange)), // Start at 1 + change
        lastInteraction: now
      };
      
      // Add to atom relationship mapping
      if (!this.atomRelationships.has(atom1Id)) {
        this.atomRelationships.set(atom1Id, new Set());
      }
      if (!this.atomRelationships.has(atom2Id)) {
        this.atomRelationships.set(atom2Id, new Set());
      }
      
      this.atomRelationships.get(atom1Id)!.add(key);
      this.atomRelationships.get(atom2Id)!.add(key);
    }
    
    this.relationships.set(key, relationship);
    
    // Save relationship to disk
    this.saveRelationship(relationship);
    
    return relationship;
  }

  getAtomRelationships(atomId: string): Relationship[] {
    const relationshipKeys = this.atomRelationships.get(atomId);
    if (!relationshipKeys) return [];
    
    return Array.from(relationshipKeys)
      .map(key => this.relationships.get(key)!)
      .filter(rel => rel !== undefined);
  }

  getStrongestRelationships(atomId: string, limit: number = 10): Relationship[] {
    return this.getAtomRelationships(atomId)
      .sort((a, b) => b.strength - a.strength)
      .slice(0, limit);
  }

  decayRelationships(decayFactor: number = 0.95): void {
    const now = Date.now();
    
    for (const [key, relationship] of this.relationships.entries()) {
      // Decay relationships not updated in the last 24 hours
      const hoursSinceLastInteraction = (now - relationship.lastInteraction) / (60 * 60 * 1000);
      
      if (hoursSinceLastInteraction > 24) {
        relationship.strength *= decayFactor;
        
        // Remove very weak relationships
        if (relationship.strength < 0.1) {
          this.relationships.delete(key);
          
          // Update atom relationship mappings
          this.atomRelationships.get(relationship.atom1Id)?.delete(key);
          this.atomRelationships.get(relationship.atom2Id)?.delete(key);
          
          // Remove relationship file
          const filePath = path.join(this.basePath, `${key}.json`);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } else {
          // Save updated relationship
          this.saveRelationship(relationship);
        }
      }
    }
  }

  private saveRelationship(relationship: Relationship): void {
    const key = this.getRelationshipKey(relationship.atom1Id, relationship.atom2Id);
    const filePath = path.join(this.basePath, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(relationship, null, 2));
  }

  async loadRelationships(): Promise<void> {
    // Clear existing data
    this.relationships.clear();
    this.atomRelationships.clear();
    
    // Find all relationship files
    const files = fs.readdirSync(this.basePath).filter(file => file.endsWith('.json'));
    
    for (const file of files) {
      const filePath = path.join(this.basePath, file);
      const relationship = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Relationship;
      
      const key = this.getRelationshipKey(relationship.atom1Id, relationship.atom2Id);
      this.relationships.set(key, relationship);
      
      // Add to atom relationship mapping
      if (!this.atomRelationships.has(relationship.atom1Id)) {
        this.atomRelationships.set(relationship.atom1Id, new Set());
      }
      if (!this.atomRelationships.has(relationship.atom2Id)) {
        this.atomRelationships.set(relationship.atom2Id, new Set());
      }
      
      this.atomRelationships.get(relationship.atom1Id)!.add(key);
      this.atomRelationships.get(relationship.atom2Id)!.add(key);
    }
    
    console.log(`Loaded ${this.relationships.size} relationships`);
  }
}
