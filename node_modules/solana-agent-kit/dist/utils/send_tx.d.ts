import { SolanaAgentKit } from "../agent";
import { Transaction, Keypair, TransactionInstruction } from "@solana/web3.js";
import { Connection } from "@solana/web3.js";
/**
 * Get priority fees for the current block
 * @param connection - Solana RPC connection
 * @returns Priority fees statistics and instructions for different fee levels
 */
export declare function getPriorityFees(connection: Connection): Promise<{
    min: number;
    median: number;
    max: number;
    instructions?: {
        low: TransactionInstruction;
        medium: TransactionInstruction;
        high: TransactionInstruction;
    };
}>;
/**
 * Send a transaction with priority fees
 * @param agent - SolanaAgentKit instance
 * @param tx - Transaction to send
 * @returns Transaction ID
 */
export declare function sendTx(agent: SolanaAgentKit, tx: Transaction, otherKeypairs?: Keypair[]): Promise<string>;
//# sourceMappingURL=send_tx.d.ts.map