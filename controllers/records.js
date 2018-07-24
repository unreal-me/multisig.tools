const socket = require('../utils/socket') 
const services = require('../services/records')
const Records = require('../models/records')

async function detail(ctx) {
    // await services.vaildateSignature(ctx)
    const hash = ctx.params.hash
    const record = await Records.findOne({ hash })
    const sumWeight = await services.sumWeight(record["_doc"].signers)
    if (record) {
        ctx.body = {
            ...record["_doc"],
            sumWeight
        }
    } else {
        ctx.throw(404, "Not Found")
    }

}

async function create(ctx) {
    // TODO: error handler
    await services.vaildateSignature(ctx)
    const address = ctx.request.headers['x-stellar-address']
    const account = await services.fetchAccount(ctx.request.body.sourcePaymentPublicKey)
    if (!account.signers[address]) {
        // TODO: Need to do this?
        ctx.throw(400, "Your address is not in the signers list.")
    }
    const { sourcePublicKey, sourcePaymentPublicKey, receiverPublicKey, assetCode, assetIssuer, amount } = { ...ctx.request.body }
    const xdr = await services.generateXdr(sourcePublicKey, sourcePaymentPublicKey, receiverPublicKey, assetCode, assetIssuer, amount)
    const record = { ...xdr, ...account, ...{ detail: ctx.request.body } }
    const newRecord = new Records(record)
    try {
        const savedRecord = await newRecord.save()
        ctx.body = savedRecord
    } catch (e) {
        // TODO: Return hash
        ctx.throw(400, "The payment already exists.")
    }
}

async function list(ctx) {
    // await services.vaildateSignature(ctx)
    const address = ctx.request.headers['x-stellar-address']
    const records = await Records.find({ [`signers.${address}`]: { $exists: true } }).sort({ '_id': -1 })
    ctx.body = records
}

async function sign(ctx) {
    // await services.vaildateSignature(ctx)
    const address = ctx.request.headers['x-stellar-address']
    const { hash, xdr } = ctx.request.body
    const record = await Records.findOne({ hash })

    if (record.signers[address].signed === true) {
        ctx.throw(400, "You have already signed it.")
    }

    const validHash = await services.equalHash(xdr, record.hash)
    if (!validHash) {
        ctx.throw(400, "Illegal xdr")
    }
    console.log(record.signers[address].signed)
    record.xdr = xdr
    record.signers[address].signed = true
    record.markModified('signers')
    record.save()
    console.log(record.signers[address].signed)
    const sumWeight = await services.sumWeight(record.signers)
    if (sumWeight >= record.medThreshold) {
        // submit to xdr
        // TODO: reason
        try {
            resp = await services.submitXdr(xdr)
            record.status = 1
            console.log(resp.response)
        } catch (err) {
            // TODO: Retry
            console.log(err)
            record.status = 2
        }
        record.save()
    }
    // await socket.sendMessageByHash(hash)
    console.log(record)
    ctx.body = record
    await socket.sendMessageByHash(hash, {
        ...record["_doc"],
        sumWeight
    })
}

module.exports = {
    detail,
    create,
    list,
    sign
}
