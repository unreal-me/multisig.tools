const stellarSdk = require("stellar-sdk")
const axios = require("axios")

const serverURL = 'https://horizon-testnet.stellar.org'

stellarSdk.Network.useTestNetwork();
const server = new stellarSdk.Server(serverURL);

// TODO: middleware
async function vaildateSignature(ctx) {
    let { 'x-stellar-address': address, 'x-stellar-signature': signature, 'x-stellar-timestamp': timestamp } = ctx.request.headers

    if (!address || !signature || !timestamp) {
        ctx.throw(401, "Unauthorized")
    }

    if (Math.abs(Date.now() - parseInt(timestamp)) > 5 * 60 * 1000) {
        ctx.throw(401, "Unauthorized")
    }

    let dataJson = { 'x-stellar-address': address, 'x-stellar-timestamp': timestamp }
    // TODO: OPTIONS
    if (ctx.request.method !== 'GET') {
        dataJson = ctx.request.body
    }

    signData = await JSON.stringify(dataJson, Object.keys(dataJson).sort());
    valid = false
    try {
        valid = await stellarSdk.Keypair.fromPublicKey(address).verify(signData, Buffer.from(signature, 'base64'))
    } catch (err) {
        // console.log(err)
    }
    if (valid === false) {
        ctx.throw(401, "Unauthorized")
    }
}

async function fetchAccount(address) {
    // TODO: account check
    let account = await server.loadAccount(address)
    signers = {}
    account.signers.filter((signer) => signer.type === 'ed25519_public_key').forEach((signer) => {
        signers[signer.public_key] = {
            weight: signer.weight,
            signed: false
        }
    })
    resp = {
        medThreshold: account.thresholds.med_threshold,
        signers: signers
    }
    return resp
}

async function generateXdr(sourcePublicKey, sourcePaymentPublicKey, receiverPublicKey, assetCode, assetIssuer, amount) {
    let asset = null
    if (assetCode === '' || assetIssuer === '') {
        asset = new stellarSdk.Asset.native()
    } else {
        asset = new stellarSdk.Asset(assetCode, assetIssuer)
    }
    // TODO: account check
    let account = await server.loadAccount(sourcePublicKey)

    let transaction = await new stellarSdk.TransactionBuilder(account)
        .addOperation(stellarSdk.Operation.payment({
            source: sourcePaymentPublicKey,
            destination: receiverPublicKey,
            asset: asset,
            amount: amount,
        }))
        .build();
    let hash = await transaction.hash().toString('hex')
    let xdr = await transaction.toEnvelope().toXDR('base64')
    return { hash, xdr }
}

async function equalHash(xdr, hash) {
    let transactionEnvelope = stellarSdk.xdr.TransactionEnvelope.fromXDR(xdr, 'base64')
    let transaction = new stellarSdk.Transaction(transactionEnvelope)
    return transaction.hash().toString('hex') == hash
}

async function submitXdr(tx) {
    return axios.post(
        serverURL + '/transactions',
        `tx=${tx}`
    )
}

async function sumWeight(signers) {
    signers = Object.values(signers)
    weight = await signers.filter((signer) => signer.signed === true).reduce((weight, signer) => { return weight += signer.weight }, 0)
    return weight
}
module.exports = {
    vaildateSignature,
    generateXdr,
    fetchAccount,
    equalHash,
    submitXdr,
    sumWeight
}