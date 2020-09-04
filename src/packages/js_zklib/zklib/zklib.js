const Bluebird = require("bluebird");

const dgram = require('dgram');
const net = require('net');

const mixin = require('./mixin');
const attParserLegacy = require('./att_parser_legacy');
const attParserV660 = require('./att_parser_v6.60');
const { defaultTo, createHeader, checkValid, removeTcpHeader, decodeTCPHeader, decodeUDPHeader, MAX_CHUNK, USHRT_MAX, checkNotEventTCP, checkNotEventUDP, exportErrorMessage, createChkSum } = require('./utils');
const { Commands, ConnectionTypes, REQUEST_DATA } = require('./constants');
const {decode} = require('./timestamp_parser');


const REQUEST_TIMEOUT = 10 * 60 * 1000; //10 minutes

/**
  @typedef {object} Options
  @property {string} ip - Zk device ipAddress
  @property {?number} [port] - Zk device port
  @property {number} inport - Socket port to bind to
  @property {?number} [timeout] - Zk device port
  @property {?string} [attendanceParser] - Zk device port
  @property {?string} [connectionType] - Connection type UDP/TCP
 */

/**
  @property {string} ip - Zk device ipAddress
  @property {number} [port] - Zk device port
  @property {number} inport - Socket port to bind to
  @property {number} [timeout] - Zk device port
  @property {string} [attendanceParser] - Zk device port
  @property {string} [connectionType] - Connection type UDP/TCP
  @property {('message' | 'data')} DATA_EVENT
  @property {dgram.Socket | net.Socket} socket
 */
class ZKLib {
    /**
     * @param  {Options} options
     */
    constructor(options) {
        this.validateOptions(options);

        this.ip = options.ip;
        this.port = defaultTo(options.port, 4370);
        this.inport = options.inport;
        this.timeout = options.timeout;
        this.attendanceParser = defaultTo(options.attendanceParser, attParserLegacy.name);
        this.connectionType = defaultTo(options.connectionType, ConnectionTypes.TCP);

        this.DATA_EVENT = this.connectionType === ConnectionTypes.UDP ? 'message' : 'data';

        this.socket = null;
    }

    validateOptions(options) {
        if (!options) {
            throw new Error('Options required');
        }

        if (!options.ip) {
            throw new Error('IP option required');
        }

        if (!options.inport) {
            throw new Error('Inport option required');
        }

        if (options.attendanceParser && ![attParserLegacy.name, attParserV660.name].includes(options.attendanceParser)) {
            throw new Error('Attendance parser option unknown');
        }

        if (options.connectionType && ![ConnectionTypes.UDP, ConnectionTypes.TCP].includes(options.connectionType)) {
            throw new Error('Connection type option unknown');
        }
    }

    updateReplyId() {
        if (this.reply_id === 65534) this.reply_id = 1;
        this.reply_id++;
        return this.reply_id;
    }

    /**
     *
     * @param {number} command
     * @param {string | Uint8Array | Buffer} data
     * @param {*} cb
     */
    executeCmd(command, data, cb) {
        if (command === Commands.CONNECT) {
            this.session_id = 0;
            this.reply_id = 1;
        } else {
            this.updateReplyId();
        }

        const buf = createHeader(command, this.session_id, this.reply_id, data, this.connectionType);

        const handleOnData = (reply, remote) => {
            // console.log(reply.toString('hex'));

            reply = this.connectionType === ConnectionTypes.UDP ? reply : removeTcpHeader(reply);

            if (reply && reply.length && reply.length >= 8) {
                if (command === Commands.CONNECT) {
                    this.session_id = reply.readUInt16LE(4);
                }

                cb && cb(checkValid(reply) ? null : new Error('Invalid request'), reply);
            } else {
                cb && cb(new Error('Invalid length reply'));
            }
        };

        this.socket.once(this.DATA_EVENT, handleOnData);

        // console.log(buf.toString('hex'));

        this.send(buf, 0, buf.length, err => {
            if (err) {
                cb && cb(err);
                return;
            }
        });
    }

    /**
     *
     * @param {(error: Error) => void} [cb]
     */
    createSocket(cb) {
        this.socket =
            this.connectionType === ConnectionTypes.UDP ? this.createUdpSocket(this.inport, cb) : this.createTcpSocket(cb);
    }

    /**
     *
     * @param {number} port
     * @param {(error?: Error) => void} [cb]
     */
    createUdpSocket(port, cb) {
        const socket = dgram.createSocket('udp4');

        socket.once('error', err => {
            socket.close();

            cb(err);
        });

        socket.once('listening', () => {
            cb();
        });

        socket.bind(port);

        return socket;
    }

    /**
     *
     * @param {(error?: Error) => void} [cb]
     */
    createTcpSocket(cb) {
        const socket = new net.Socket();

        socket.once('error', err => {
            socket.end();

            cb(err);
        });

        socket.once('connect', () => {
            console.log('connected');
            cb();
        });

        if (this.timeout) {
            socket.setTimeout(this.timeout);
        }

        socket.connect({
            port: this.port,
            host: this.ip
        });

        return socket;
    }

    /**
     *
     * @param {String | Uint8Array | Buffer} msg
     * @param {number} offset
     * @param {number} length
     * @param {(error: Error) => void} [cb]
     */
    send(msg, offset, length, cb) {
        if (this.connectionType === ConnectionTypes.UDP) {
            this.writeUdpSocket(this.socket, msg, offset, length, cb);
        } else {
            this.writeTcpSocket(this.socket, msg, offset, length, cb);
        }
    }

    /**
     *
     * @param {dgram.Socket} socket
     * @param {String | Uint8Array | Buffer} msg
     * @param {number} offset
     * @param {number} length
     * @param {(error?: Error) => void} [cb]
     */
    writeUdpSocket(socket, msg, offset, length, cb) {
        let sendTimeoutId;

        socket.once(this.DATA_EVENT, () => {
            sendTimeoutId && clearTimeout(sendTimeoutId);

            cb();
        });

        socket.send(msg, offset, length, this.port, this.ip, err => {
            if (err) {
                cb && cb(err);
                return;
            }

            if (this.timeout) {
                sendTimeoutId = setTimeout(() => {
                    cb && cb(new Error('Timeout error'));
                }, this.timeout);
            }
        });
    }

    /**
     *
     * @param {net.Socket} socket
     * @param {String | Uint8Array | Buffer} msg
     * @param {number} offset
     * @param {number} length
     * @param {(error?: Error) => void} [cb]
     */
    writeTcpSocket(socket, msg, offset, length, cb) {
        socket.once(this.DATA_EVENT, () => {
            socket.removeListener('timeout', handleOnTimeout);

            cb();
        });

        const handleOnTimeout = () => {
            cb && cb(new Error('Timeout error'));
        };

        socket.once('timeout', handleOnTimeout);

        socket.write(msg, null, err => {
            if (err) {
                cb && cb(err);
                return;
            }
        });
    }

    closeSocket() {
        console.log('close socket');
        if (this.connectionType === ConnectionTypes.UDP) {
            this.closeUdpSocket(this.socket);
        } else {
            this.closeTcpSocket(this.socket);
        }
    }

    /**
     *
     * @param {dgram.Socket} socket
     */
    closeUdpSocket(socket) {
        socket.removeAllListeners('message');
        socket.close();
    }

    /**
     *
     * @param {net.Socket} socket
     */
    closeTcpSocket(socket) {
        socket.removeAllListeners('data');
        socket.end();
    }

    freeData(cb) {
        this.executeCmd(Commands.FREE_DATA, '', cb);
    }

    freeData2 = Bluebird.promisify(this.freeData);

    sendChunkRequest(start, size) {
        const reply_id = this.updateReplyId();
        const reqData = Buffer.alloc(8)
        reqData.writeUInt32LE(start, 0)
        reqData.writeUInt32LE(size, 4)
        const buf = createHeader(Commands.DATA_RDY, this.session_id, reply_id, reqData, this.connectionType);

        this.socket.write(buf, null, err => {
            if (err) {
                console.log(`[TCP][SEND_CHUNK_REQUEST]` + err.toString())
            }
        });

        return reply_id;
    }


    requestData = (msg)  => {
        return new Promise(((resolve, reject) => {
            let timer = null
            let replyBuffer = Buffer.from([])


            const internalCallback = (data) => {
                this.socket.removeListener(this.DATA_EVENT, handleOnData)
                timer && clearTimeout(timer)
                return resolve(data);
            }

            const handleOnData = (data) => {
                replyBuffer = Buffer.concat([replyBuffer, data])
                if (this.connectionType === ConnectionTypes.TCP ? checkNotEventTCP(data) : checkNotEventUDP(data)) return;
                clearTimeout(timer)
                const header = this.connectionType === ConnectionTypes.TCP ? decodeTCPHeader(replyBuffer.subarray(0,16)) : decodeUDPHeader(replyBuffer.subarray(0,16));
                if(header.commandId === Commands.DATA){
                    timer = setTimeout(()=>{
                        internalCallback(replyBuffer)
                    }, 1000)
                }else{
                    timer = setTimeout(() => {
                        reject(new Error('TIMEOUT_ON_RECEIVING_REQUEST_DATA'))
                    }, REQUEST_TIMEOUT)

                    const packetLength = data.readUIntLE(4, 2)
                    if (packetLength > 8) {
                        internalCallback(data)
                    }
                }
            }

            this.socket.on(this.DATA_EVENT, handleOnData)

            this.socket.write(msg, null, (err) => {
                if (err) {
                    this.socket.removeListener('data', handleOnData)
                    console.log(`[TCP][ERROR_WRTING_REQUEST_DATA] ${err.toString()}`)
                    return reject(err);
                }

                timer = setTimeout(() => {
                    this.socket.removeListener('data', handleOnData)
                    return reject(new Error('TIMEOUT_IN_RECEIVING_RESPONSE_AFTER_REQUESTING_DATA'))
                }, 30000)

            })
        }))
    }



    /**
     *
     * @param {*} reqData - indicate the type of data that need to receive ( user or attLog)
     * @param {*} cb - callback is triggered when receiving packets
     *
     * readWithBuffer will reject error if it'wrong when starting request data
     * readWithBuffer will return { data: replyData , err: Error } when receiving requested data
     */
    readWithBuffer(reqData, cb = null) {
        return new Promise(async (resolve, reject) => {

            let reply_chunk = 0 ;
            let counter = 0 ;
            this.updateReplyId();
            const buf = createHeader(Commands.DATA_WRRQ, this.session_id, this.reply_id, reqData, this.connectionType)
            let reply = null

            try {
                reply = await this.requestData(buf)
            } catch (err) {
                reject(err)
            }

            const header = this.connectionType === 'tcp' ? decodeTCPHeader(reply.subarray(0, 16)) : decodeUDPHeader(reply.subarray(0, 16));
            switch (header.commandId) {
                case Commands.DATA: {
                    return resolve({ data: reply.subarray(16), mode: 8 })
                }
                case Commands.ACK_OK:
                case Commands.PREPARE_DATA: {
                    // this case show that data is prepared => send command to get these data
                    // reply variable includes information about the size of following data
                    const recvData = reply.subarray(16)
                    const size = recvData.readUIntLE(1, 4)

                    // We need to split the data to many chunks to receive , because it's to large
                    // After receiving all chunk data , we concat it to TotalBuffer variable , that 's the data we want
                    let remain = size % MAX_CHUNK
                    let numberChunks = (size - remain) / MAX_CHUNK
                    let totalPackets = numberChunks + (remain > 0 ? 1 : 0)
                    let replyData = Buffer.from([])

                    let totalBuffer = Buffer.from([])
                    let realTotalBuffer = Buffer.from([])

                    const timeout = 10000;
                    let timer = setTimeout(() => {
                        internalCallback(replyData, new Error('TIMEOUT WHEN RECEIVING PACKET'))
                    }, REQUEST_TIMEOUT)


                    const internalCallback = (replyData, err = null) => {
                        this.socket && this.socket.removeListener(this.DATA_EVENT, handleOnData)
                        timer && clearTimeout(timer);

                        if (err) return reject(err);
                        return resolve({data: replyData, size});
                    }

                    const handleOnData = (reply) => {
                        console.log('reply', reply);

                        reply_chunk += reply.length;
                        if (this.connectionType === ConnectionTypes.TCP ? checkNotEventTCP(reply) : checkNotEventUDP(reply)) return;

                        clearTimeout(timer)
                        timer = setTimeout(() => {
                            internalCallback(replyData,
                              new Error(`TIME OUT !! ${totalPackets} PACKETS REMAIN !`))
                        }, timeout)

                        totalBuffer = Buffer.concat([totalBuffer, reply])
                        const packetLength = totalBuffer.readUIntLE(4, 2)
                        console.log('packetLength', packetLength);
                        if (totalBuffer.length >= 8 + packetLength) {
                            realTotalBuffer = Buffer.concat([realTotalBuffer, totalBuffer.subarray(16, 8 + packetLength)]);
                            if(reply_chunk >= MAX_CHUNK * (counter)){
                                if(counter === numberChunks){
                                    this.sendChunkRequest(numberChunks * MAX_CHUNK, remain)
                                }else{
                                    this.sendChunkRequest(counter * MAX_CHUNK, MAX_CHUNK)
                                }
                                counter ++;
                            }
                            totalBuffer = totalBuffer.subarray(8 + packetLength)

                            if ((totalPackets > 1 && realTotalBuffer.length === MAX_CHUNK + 8)
                              || (totalPackets === 1 && realTotalBuffer.length === remain + 8)) {

                                replyData = Buffer.concat([replyData, realTotalBuffer.subarray(8)])
                                totalBuffer = Buffer.from([])
                                realTotalBuffer = Buffer.from([])

                                totalPackets--
                                cb && cb(replyData.length, size)
                                if (replyData.length === size) {
                                    internalCallback(replyData)
                                }
                            }
                        }
                    }

                    this.socket.once('close', () => {
                        internalCallback(replyData, new Error('Socket is disconnected unexpectedly'))
                    })

                    this.socket.on('data', handleOnData);

                    if(counter === numberChunks){
                        this.sendChunkRequest(numberChunks * MAX_CHUNK, remain)
                    }else{
                        this.sendChunkRequest(counter * MAX_CHUNK, MAX_CHUNK)
                    }
                    counter ++;


                    break;
                }
                default: {
                    reject(new Error('ERROR_IN_UNHANDLE_CMD ' + exportErrorMessage(header.commandId)))
                }
            }
        })
    }

    async getAttendances(callbackInProcess = () => { }) {
        await this.freeData2();
        const data = await this.readWithBuffer(REQUEST_DATA.GET_ATTENDANCE_LOGS, callbackInProcess);
        const RECORD_PACKET_SIZE = 40
        let recordData = data.data.subarray(4)
        let records = []
        while (recordData.length >= RECORD_PACKET_SIZE) {
            const record = decodeRecordData40(recordData.subarray(0, RECORD_PACKET_SIZE))
            records.push({ ...record, ip: this.ip })
            recordData = recordData.subarray(RECORD_PACKET_SIZE)
        }

        return { data: records, err: data.err , max: Math.round((data.size-4)/RECORD_PACKET_SIZE)}
    }

}

const decodeRecordData40 = (recordData) => {
    return {
        userSn: recordData.readUIntLE(0, 2),
        deviceUserId: parseInt(recordData
          .slice(2, 2 + 9)
          .toString('ascii')
          .split('\0')
          .shift()),
        recordTime: decode(recordData.readUInt32LE(27)),
    }
}

mixin(ZKLib, require('./zkconnect'));
mixin(ZKLib, require('./zkserial'));
mixin(ZKLib, require('./zkversion'));
mixin(ZKLib, require('./zktime'));
mixin(ZKLib, require('./zkattendance'));
mixin(ZKLib, require('./zkuser'));
mixin(ZKLib, require('./zkmon'));
mixin(ZKLib, require('./zkdevice'));

module.exports = ZKLib;
