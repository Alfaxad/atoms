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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSolanaTools = exports.SolanaAgentKit = void 0;
const agent_1 = require("./agent"); // Move the SolanaAgentKit class to src/agent.ts
Object.defineProperty(exports, "SolanaAgentKit", { enumerable: true, get: function () { return agent_1.SolanaAgentKit; } });
const langchain_1 = require("./langchain");
Object.defineProperty(exports, "createSolanaTools", { enumerable: true, get: function () { return langchain_1.createSolanaTools; } });
// Optional: Export types that users might need
__exportStar(require("./types"), exports);
//# sourceMappingURL=index.js.map