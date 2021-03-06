const mongoose = require('mongoose')

const Schema = mongoose.Schema

const RecordSchema = new Schema(
    {
        xdr: { type: String, required: true },
        hash: { type: String, unique: true, required: true },
        detail: Schema.Types.Mixed,
        signers: Schema.Types.Mixed,
        medThreshold: { type: Number },
        status: { type: Number, default: 0 } // 0: process, 1: success, 2: fail
    },
    { timestamps: true }
);

const Record = mongoose.model('Record', RecordSchema)

module.exports = mongoose.model('Record')