/*
 * Copyright 2018 Hitachi America, Ltd.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { createVerify } from "crypto";
import { verifySigningChain } from "pem";
import { BCVerifierNotFound } from "../../common";
import { FabricBlock, FabricTransaction, PROTOS } from "./fabric-data";
import { MSPConfig } from "./fabric-types";

export function getOrdererMSPs(configTx: FabricTransaction): MSPConfig[] {
    const groups = configTx.data.config.channel_group.groups.Orderer.groups;
    const results: MSPConfig[] = [];

    for (const org in groups) {
        const group = groups[org];
        const mspConfig: MSPConfig = group.values.MSP.value.config;

        results.push(mspConfig);
    }

    return results;
}

export function getApplicationMSPs(configTx: FabricTransaction): MSPConfig[] {
    const groups = configTx.data.config.channel_group.groups.Application.groups;
    const results: MSPConfig[] = [];

    for (const org in groups) {
        const group = groups[org];
        const mspConfig: MSPConfig = group.values.MSP.value.config;

        results.push(mspConfig);
    }

    return results;
}

export function findMSP(mspName: string, mspConfigs: MSPConfig[]): MSPConfig {
    for (const msp of mspConfigs) {
        if (msp.name === mspName) {
            return msp;
        }
    }
    throw new BCVerifierNotFound();
}

export function verifyIdentityMSP(mspName: string, identity: string, mspConfigs: MSPConfig[]): Promise<boolean> {
    try {
        const msp = findMSP(mspName, mspConfigs);
        return new Promise((resolve, reject) => {
            verifySigningChain(identity, msp.root_certs, (error, result) => {
                if (error != null) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    } catch (e) {
        if (e instanceof BCVerifierNotFound) {
            return Promise.resolve(false);
        }
        return Promise.reject(e);
    }
}

export async function verifySignatureHeader(signatureHeader: any, mspConfigs: MSPConfig[]): Promise<boolean> {
    return await verifyIdentityMSP(signatureHeader.creator.Mspid, signatureHeader.creator.IdBytes, mspConfigs);
}

export function verifySignature(signature: Buffer, data: Buffer, identity: any): boolean {
    // algorithm needs to conform to config.
    const verify = createVerify("sha256");

    verify.update(data);

    return verify.verify(identity.IdBytes, signature);
}

export function verifyMetadataSignature(block: FabricBlock, data: Buffer, metadataSignature: any): boolean {
    const verify = createVerify("sha256");

    const serializedIdentityType = PROTOS.identities.lookupType("msp.SerializedIdentity");
    const creator = serializedIdentityType.encode({
        mspid: metadataSignature.signature_header.creator.Mspid,
        idBytes: Buffer.from(metadataSignature.signature_header.creator.IdBytes)
    }).finish();

    const signatureHeaderType = PROTOS.common.lookupType("common.SignatureHeader");
    const sigHeader = signatureHeaderType.encode({
        creator: creator,
        nonce: metadataSignature.signature_header.nonce
    }).finish();

    verify.update(Buffer.concat([data, sigHeader, block.getHeaderBytes()]));

    return verify.verify(metadataSignature.signature_header.creator.IdBytes, metadataSignature.signature);
}
