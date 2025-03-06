"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.keypair = void 0;
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = __importDefault(require("bs58"));
exports.keypair = web3_js_1.Keypair.generate();
console.log(exports.keypair.publicKey.toString());
console.log(bs58_1.default.encode(exports.keypair.secretKey));
//# sourceMappingURL=keypair.js.map