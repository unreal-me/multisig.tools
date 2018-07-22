const socket = require('../utils/socket')
const services = require('../services/records')
const Records = require('../models/records')

async function detail(ctx) {
    // await services.vaildateSignature(ctx)
    let hash = ctx.params.hash
    let record = await Records.findOne({ hash })
    if (record) {
        ctx.body = record
    } else {
        ctx.throw(404, "Not Found")
    }
}

async function create(ctx) {
    // TODO: error handler
    // await services.vaildateSignature(ctx)
    let address = ctx.request.headers['x-stellar-address']
    let account = await services.fetchAccount(ctx.request.body.sourcePaymentPublicKey)
    if (!account.signers[address]) {
        // TODO: Need to do this?
        ctx.throw(400, "Your address is not in the signers list.")
    }
    let xdr = await services.generateXdr('GD46CTP5BW3V5F5TG7HIZT43ZP55CD34QM4SISJZFXPZ2BCVY6DZ6UVO', 'GD46CTP5BW3V5F5TG7HIZT43ZP55CD34QM4SISJZFXPZ2BCVY6DZ6UVO', 'GAIRISXKPLOWZBMFRPU5XRGUUX3VMA3ZEWKBM5MSNRU3CHV6P4PYZ74D', 'ETH', 'GAIRISXKPLOWZBMFRPU5XRGUUX3VMA3ZEWKBM5MSNRU3CHV6P4PYZ74D', '103')
    let record = { ...xdr, ...account, ...{ detail: ctx.request.body } }
    // console.log(record)
    const newRecord = new Records(record)
    const savedRecord = await newRecord.save()
    ctx.body = savedRecord
}

async function list(ctx) {
    // await services.vaildateSignature(ctx)
    let address = ctx.request.headers['x-stellar-address']
    let records = await Records.find({ [`signers.${address}`]: { $exists: true } }).sort({ '_id': -1 })
    ctx.body = records
}

async function sign(ctx) {
    // await services.vaildateSignature(ctx)
    let address = ctx.request.headers['x-stellar-address']
    let { hash, xdr } = ctx.request.body
    let record = await Records.findOne({ hash })

    if (record.signers[address].signed === true) {
        ctx.throw(400, "You have already signed it.")
    }
    
    let validHash = await services.equalHash(xdr, record.hash)
    if (!validHash) {
        ctx.throw(400, "Illegal xdr")
    }

    record.xdr = xdr
    record.signers[address].signed = true
    record.save()
    let sumWeight = await services.sumWeight(record.signers)
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
    ctx.body = record
}

module.exports = {
    detail,
    create,
    list,
    sign
}
