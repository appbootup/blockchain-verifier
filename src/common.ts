/*
 * Copyright 2018 Hitachi America, Ltd.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { ResultSet } from "./result-set";
import { BlockProvider } from "./provider";

export interface VerificationConfig {
    networkType: string;
    networkConfig: string;

    applicationCheckers: string[];
}

export enum ResultCode {
    OK = 0,
    ERROR = 1,
    SKIPPED = 2
}

export enum ResultPredicate {
    EQ = 0,
    EQBIN = 1,
    INVOKE = 2,
    LT = 3,
    LE = 4,
    GT = 5,
    GE = 6,
}

export type ResultOperand = {
    name: string;
    value: any;
};

export type CheckResult = {
    checkerID: string;
    result: ResultCode.OK | ResultCode.ERROR;
    predicate: ResultPredicate;
    operands: ResultOperand[];
} | {
    checkerID: string;
    result: ResultCode.SKIPPED;
    skipReason: string;
};

export interface BlockResult {
    number: number;
    block: Block;
    results: CheckResult[];
}

export interface TransactionResult {
    transactionID: string;
    blockNumber: number;
    index: number;
    results: CheckResult[];
}

export interface VerificationResult {
    blocks: BlockResult[];
    transactions: TransactionResult[];
}

export class BCVerifierError extends Error {
}
export class BCVerifierNotImplemented extends Error {
}
export class BCVerifierNotFound extends Error {
}

export enum HashValueType {
    HASH_FOR_SELF = 1,
    HASH_FOR_PREV = 2
}

export interface Block {
    getRaw(): Buffer;
    getBlockNumber(): number;

    getHashValue(): Buffer;
    getPrevHashValue(): Buffer;

    calcHashValue(hashType: HashValueType): Buffer;

    getTransactions(): Transaction[];
}

export interface Transaction {
    getBlock(): Block;
    getIndexInBlock(): number;
    getTransactionID(): string;
    getTransactionType(): number;
    getKeyValueState(): Promise<KeyValueState>;
}

export interface KeyValue {
    getValue(blockOrTx?: Block | Transaction): Buffer;
    getHistory(): Transaction[];
}

export interface KeyValueState {
    getKeys(): KeyValue[];
}

export class CheckPlugin {
    constructor(provider: BlockProvider, resultSet: ResultSet) {
    }
}

export interface BlockCheckPlugin {
    performCheck(blockNumber: number): Promise<void>;
}

export interface TransactionCheckPlugin {
    performCheck(transactionID: string): Promise<void>;
}

export interface OutputPlugin {
    convertResult(resultSet: ResultSet): Promise<Buffer>;
}

export interface AppStateCheckLogic {
    probeStateCheck(kvState: KeyValueState): Promise<boolean>;
    performStateCheck(kvState: KeyValueState): Promise<void>;
}

export interface AppTransactionCheckLogic {
    probeTransactionCheck(tx: Transaction): Promise<boolean>;
    performTransactionCheck(tx: Transaction): Promise<void>;
}
