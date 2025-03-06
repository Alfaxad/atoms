"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelationshipManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class RelationshipManager {
    constructor() {
        this.relationships = new Map();
        this.atomRelationships = new Map();
        this.basePath = path.join(process.cwd(), 'data', 'relationships');
        // Ensure the relationships directory exists
        if (!fs.existsSync(this.basePath)) {
            fs.mkdirSync(this.basePath, { recursive: true });
        }
    }
    getRelationshipKey(atom1Id, atom2Id) {
        // Ensure consistent ordering for the key
        return [atom1Id, atom2Id].sort().join('_');
    }
    getRelationship(atom1Id, atom2Id) {
        const key = this.getRelationshipKey(atom1Id, atom2Id);
        return this.relationships.get(key);
    }
    createOrUpdateRelationship(atom1Id, atom2Id, strengthChange) {
        const key = this.getRelationshipKey(atom1Id, atom2Id);
        const now = Date.now();
        let relationship = this.relationships.get(key);
        if (relationship) {
            // Update existing relationship
            relationship.strength = Math.max(0, Math.min(5, relationship.strength + strengthChange));
            relationship.lastInteraction = now;
        }
        else {
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
            this.atomRelationships.get(atom1Id).add(key);
            this.atomRelationships.get(atom2Id).add(key);
        }
        this.relationships.set(key, relationship);
        // Save relationship to disk
        this.saveRelationship(relationship);
        return relationship;
    }
    getAtomRelationships(atomId) {
        const relationshipKeys = this.atomRelationships.get(atomId);
        if (!relationshipKeys)
            return [];
        return Array.from(relationshipKeys)
            .map(key => this.relationships.get(key))
            .filter(rel => rel !== undefined);
    }
    getStrongestRelationships(atomId, limit = 10) {
        return this.getAtomRelationships(atomId)
            .sort((a, b) => b.strength - a.strength)
            .slice(0, limit);
    }
    decayRelationships(decayFactor = 0.95) {
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
                }
                else {
                    // Save updated relationship
                    this.saveRelationship(relationship);
                }
            }
        }
    }
    saveRelationship(relationship) {
        const key = this.getRelationshipKey(relationship.atom1Id, relationship.atom2Id);
        const filePath = path.join(this.basePath, `${key}.json`);
        fs.writeFileSync(filePath, JSON.stringify(relationship, null, 2));
    }
    async loadRelationships() {
        // Clear existing data
        this.relationships.clear();
        this.atomRelationships.clear();
        // Find all relationship files
        const files = fs.readdirSync(this.basePath).filter(file => file.endsWith('.json'));
        for (const file of files) {
            const filePath = path.join(this.basePath, file);
            const relationship = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            const key = this.getRelationshipKey(relationship.atom1Id, relationship.atom2Id);
            this.relationships.set(key, relationship);
            // Add to atom relationship mapping
            if (!this.atomRelationships.has(relationship.atom1Id)) {
                this.atomRelationships.set(relationship.atom1Id, new Set());
            }
            if (!this.atomRelationships.has(relationship.atom2Id)) {
                this.atomRelationships.set(relationship.atom2Id, new Set());
            }
            this.atomRelationships.get(relationship.atom1Id).add(key);
            this.atomRelationships.get(relationship.atom2Id).add(key);
        }
        console.log(`Loaded ${this.relationships.size} relationships`);
    }
}
exports.RelationshipManager = RelationshipManager;
