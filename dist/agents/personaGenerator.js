"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonaGenerator = void 0;
const constants_1 = require("../config/constants");
const openai_1 = require("@langchain/openai");
const prompts_1 = require("@langchain/core/prompts");
class PersonaGenerator {
    constructor() {
        // Initialize OpenAI model for generating personas
        this.model = new openai_1.ChatOpenAI({
            modelName: "gpt-4o",
            temperature: 0.7,
        });
        // Sample names for personas
        this.names = [
            'Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Avery', 'Quinn',
            'Blake', 'Skyler', 'Reese', 'Finley', 'Dakota', 'Hayden', 'Cameron', 'Peyton',
            'Jamie', 'Robin', 'Sam', 'Charlie', 'Sydney', 'Harper', 'Emerson', 'Rowan',
            'Parker', 'Tatum', 'Hayley', 'Bailey', 'Spencer', 'Mason', 'Ashton', 'Nico',
            'Elliot', 'Marley', 'Kai', 'Remy', 'Phoenix', 'Harley', 'River', 'Zion',
            'Jaden', 'Ellis', 'Sage', 'Aspen', 'Reagan', 'Kennedy', 'Blair', 'Jude'
        ];
        // Personality traits
        this.personalityTraits = [
            'risk_averse', 'risk_taker', 'analytical', 'impulsive', 'patient',
            'impatient', 'optimistic', 'pessimistic', 'social', 'independent',
            'conservative', 'aggressive', 'cautious', 'intuitive', 'methodical',
            'innovative', 'traditional', 'trendsetting', 'detail_oriented', 'big_picture',
            'emotional', 'rational', 'cooperative', 'competitive', 'generous', 'frugal'
        ];
    }
    async generatePersona(profession) {
        // Generate a random name
        const name = this.names[Math.floor(Math.random() * this.names.length)];
        // Generate age appropriate for the profession
        const age = this.generateAgeForProfession(profession);
        // Select 2-3 personality traits
        const traits = this.selectRandomTraits();
        // Generate experience level based on age and profession
        const experience = this.generateExperienceLevel(age, profession);
        // Generate a bio using LangChain and GPT-4
        const bio = await this.generateBio(name, age, profession, traits, experience);
        return {
            name,
            age,
            profession,
            traits,
            experience,
            bio
        };
    }
    selectProfessionByDistribution() {
        const rand = Math.random();
        let cumulativeProbability = 0;
        for (const [profession, probability] of Object.entries(constants_1.ATOM_TYPE_DISTRIBUTION)) {
            cumulativeProbability += probability;
            if (rand <= cumulativeProbability) {
                return profession;
            }
        }
        // Default fallback (should not reach here if probabilities sum to 1)
        return constants_1.ATOM_TYPES.CASUAL_INVESTOR;
    }
    selectRandomTraits() {
        const traits = [];
        const numTraits = 2 + Math.floor(Math.random() * 2); // 2-3 traits
        // Copy array to avoid modifying the original
        const availableTraits = [...this.personalityTraits];
        for (let i = 0; i < numTraits; i++) {
            if (availableTraits.length === 0)
                break;
            const index = Math.floor(Math.random() * availableTraits.length);
            traits.push(availableTraits[index]);
            availableTraits.splice(index, 1); // Remove selected trait
        }
        return traits;
    }
    generateAgeForProfession(profession) {
        switch (profession) {
            case constants_1.ATOM_TYPES.COLLEGE_STUDENT:
                return 18 + Math.floor(Math.random() * 8); // 18-25
            case constants_1.ATOM_TYPES.PROFESSIONAL:
                return 25 + Math.floor(Math.random() * 40); // 25-64
            case constants_1.ATOM_TYPES.BUSINESS_OWNER:
                return 30 + Math.floor(Math.random() * 35); // 30-64
            case constants_1.ATOM_TYPES.FULL_TIME_TRADER:
                return 25 + Math.floor(Math.random() * 40); // 25-64
            case constants_1.ATOM_TYPES.RETIREE:
                return 65 + Math.floor(Math.random() * 20); // 65-84
            case constants_1.ATOM_TYPES.CASUAL_INVESTOR:
                return 20 + Math.floor(Math.random() * 50); // 20-69
            default:
                return 25 + Math.floor(Math.random() * 40); // 25-64
        }
    }
    generateExperienceLevel(age, profession) {
        // Calculate potential years of experience based on age and profession
        let potentialYears;
        switch (profession) {
            case constants_1.ATOM_TYPES.COLLEGE_STUDENT:
                potentialYears = Math.max(0, age - 18); // Assuming they start at 18
                break;
            case constants_1.ATOM_TYPES.PROFESSIONAL:
            case constants_1.ATOM_TYPES.BUSINESS_OWNER:
                potentialYears = Math.max(0, age - 25); // Assuming they start at 25
                break;
            case constants_1.ATOM_TYPES.FULL_TIME_TRADER:
                potentialYears = Math.max(0, age - 22); // Assuming they start at 22
                break;
            case constants_1.ATOM_TYPES.RETIREE:
                potentialYears = Math.floor(Math.random() * 20); // Random 0-20 years
                break;
            case constants_1.ATOM_TYPES.CASUAL_INVESTOR:
                potentialYears = Math.max(0, Math.floor((age - 20) / 2)); // Half their adult life
                break;
            default:
                potentialYears = Math.max(0, age - 25);
        }
        // Add some randomness
        const actualYears = Math.floor(potentialYears * (0.3 + Math.random() * 0.7));
        // Categorize experience level
        if (actualYears < 2)
            return 'novice';
        if (actualYears < 5)
            return 'intermediate';
        if (actualYears < 10)
            return 'experienced';
        return 'expert';
    }
    async generateBio(name, age, profession, traits, experience) {
        const prompt = prompts_1.PromptTemplate.fromTemplate(`
      Create a brief bio (2-3 sentences) for a fictional crypto trader/investor with the following characteristics:
      Name: {name}
      Age: {age}
      Profession: {profession}
      Personality traits: {traits}
      Trading experience: {experience}
      
      The bio should highlight their approach to crypto trading/investing and their personality.
      Keep it concise and realistic.
    `);
        const formattedTraits = traits.join(', ');
        const promptInput = await prompt.format({
            name,
            age,
            profession,
            traits: formattedTraits,
            experience
        });
        const response = await this.model.invoke(promptInput);
        return response.content.toString().trim();
    }
    async generateBatch(count) {
        const personas = [];
        for (let i = 0; i < count; i++) {
            const profession = this.selectProfessionByDistribution();
            const persona = await this.generatePersona(profession);
            personas.push(persona);
        }
        return personas;
    }
}
exports.PersonaGenerator = PersonaGenerator;
