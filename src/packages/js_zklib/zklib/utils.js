const { Commands, USHRT_MAX } = require('./constants');

exports.defaultTo = (value, defaultValue) => {
    return value !== undefined ? value : defaultValue;
};

/**
 *
 * @param {number} command
 * @param {number} session_id
 * @param {number} reply_id
 * @param {string | Uint8Array | Buffer} data
 * @param {string | Uint8Array | Buffer} [prefix]
 * @returns {Buffer}
 */
exports.createHeader = (command, session_id, reply_id, data, prefix) => {
    const dataBuffer = Buffer.from(data);
    const buf = Buffer.alloc(8 + dataBuffer.length);

    buf.writeUInt16LE(command, 0);
    buf.writeUInt16LE(0, 2);
    buf.writeUInt16LE(session_id, 4);
    buf.writeUInt16LE(reply_id, 6);

    dataBuffer.copy(buf, 8);

    const chksum2 = createChkSum(buf);
    buf.writeUInt16LE(chksum2, 2);

    reply_id = (reply_id + 1) % USHRT_MAX;
    buf.writeUInt16LE(reply_id, 6);

    if (!prefix || prefix === 'udp') {
        return buf;
    }

    if (prefix === 'tcp') {
        const prefixBuf = Buffer.from([0x50, 0x50, 0x82, 0x7d, 0x13, 0x00, 0x00, 0x00])

        prefixBuf.writeUInt16LE(buf.length, 4)

        return Buffer.concat([prefixBuf, buf]);
    }

    const prefixBuf = Buffer.from(prefix);

    return Buffer.concat([prefixBuf, buf]);
};

/**
 *
 * @param {Buffer} buf
 * @returns {number}
 */
function createChkSum(buf) {
    let chksum = 0;

    for (let i = 0; i < buf.length; i += 2) {
        if (i == buf.length - 1) {
            chksum += buf[i];
        } else {
            chksum += buf.readUInt16LE(i);
        }

        chksum %= USHRT_MAX;
    }

    chksum = USHRT_MAX - chksum - 1;

    return chksum;
}

exports.createChkSum = createChkSum;

/**
 *
 * @param {Buffer} buf
 * @returns {boolean}
 */
exports.checkValid = buf => {
    const command = buf.readUInt16LE(0);

    // ACK_OK_2 (2005) is used in another firmware 6.60 from 2017
    return command == Commands.ACK_OK || command == Commands.ACK_OK_2;
};

/**
 *
 * @param {Buffer} buf
 * @returns {Buffer}
 */
const removeTcpHeader = buf => {
    if (buf.length < 8) {
        return buf;
    }

    if (buf.compare(Buffer.from([0x50, 0x50, 0x82, 0x7d]), 0, 4, 0, 4) !== 0) {
        return buf;
    }

    return buf.slice(8);
};
exports.removeTcpHeader = removeTcpHeader;

/**
 *
 * @param {string} hexString
 * @returns {Buffer}
 */
exports.hexStringToBuffer = hexString => {
    const buf = [];

    for (let i = 0; i < hexString.length; i += 2) {
        buf.push(parseInt(hexString.substr(i, 2), 16));
    }

    return Buffer.from(buf);
};


module.exports.decodeUDPHeader = (header)=> {
    const commandId = header.readUIntLE(0,2)
    const checkSum = header.readUIntLE(2,2)
    const sessionId = header.readUIntLE(4,2)
    const replyId = header.readUIntLE(6,2)
    return { commandId , checkSum , sessionId , replyId }
}
module.exports.decodeTCPHeader = (header) => {
    const recvData = header.subarray(8)
    const payloadSize = header.readUIntLE(4,2)

    const commandId = recvData.readUIntLE(0,2)
    const checkSum = recvData.readUIntLE(2,2)
    const sessionId = recvData.readUIntLE(4,2)
    const replyId = recvData.readUIntLE(6,2)
    return { commandId , checkSum , sessionId , replyId , payloadSize }

}

module.exports.USHRT_MAX = 65535

module.exports.MAX_CHUNK = 65472


module.exports.checkNotEventTCP = (data)=> {
    try{
        data = removeTcpHeader(data)
        const commandId = data.readUIntLE(0,2)
        const event = data.readUIntLE(4,2)
        return event === Commands.EF_ATTLOG && commandId === Commands.REG_EVENT
    }catch(err){
        return false
    }
}

module.exports.checkNotEventUDP = (data)=>{
    const commandId = this.decodeUDPHeader(data.subarray(0,8)).commandId
    return commandId === Commands.REG_EVENT
}

module.exports.exportErrorMessage = (commandValue)=>{
    const keys = Object.keys(Commands)
    for(let i =0 ; i< keys.length; i++){
        if (Commands[keys[i]] === commandValue){
            return keys[i].toString()
        }
    }

    return 'AN UNKNOWN ERROR'
}
