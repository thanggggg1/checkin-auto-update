const {createHeader, removeTcpHeader, checkNotEventTCP, checkNotEventUDP} = require('./utils');
const {Commands, ConnectionTypes} = require('./constants');

module.exports = class {
  /**
   * Untested
   * @param {*} opts    *
   */
  startMon(opts) {
    this.updateReplyId();
    // this.connect(err => {

    //   this.createSocket();

    const monFn = (ret) => {
      if (this.connectionType === ConnectionTypes.TCP) {
        if (!checkNotEventTCP(ret)) return;
      }

      if (this.connectionType === ConnectionTypes.UDP) {
        if (!checkNotEventUDP(ret)) return;
      }

      if (ret.length === 40) {
        return opts.onatt(decodeRecordRealTimeLog40(ret));
      }

      if (ret.length === 52) {
        opts.onatt(decodeRecordRealTimeLog52(ret));
      }
    };

    this.socket.on(this.DATA_EVENT, monFn);

    // const buf = new Buffer(12);
    //
    // buf.writeUInt16LE(Commands.REG_EVENT, 0);
    // buf.writeUInt16LE(0, 2);
    // buf.writeUInt16LE(this.session_id, 4);
    // buf.writeUInt16LE(this.reply_id, 6);
    // buf.writeUInt32LE(0x0000ffff, 8);

    const buf = createHeader(
      Commands.REG_EVENT,
      this.session_id,
      this.reply_id,
      Buffer.from('ffff0000', 'hex'),
      this.connectionType
    );

    // const chksum = createChkSum(buf);
    // buf.writeUInt16LE(chksum, 2);
    // this.reply_id = (this.reply_id + 1) % USHRT_MAX;
    // buf.writeUInt16LE(this.reply_id, 6);

    // this.socket.send(buf, 0, buf.length, this.port, this.ip, err => {
    //   if (err) {
    //     return console.log(err);
    //   }
    //
    //   if (opts.start) {
    //     opts.start(null, 'monitoring started on device ' + this.ip + ':' + this.port);
    //   }
    // });

    this.socket.write(buf, null, (err) => {
      opts.start(err);
    });

    // this.send(buf, 0, buf.length, err => {
    //     if (err) {
    //         opts.start(err);
    //         return;
    //     }
    //
    //     if (opts.start) {
    //         opts.start();
    //     }
    // });
    // });

    return () => {
      this.socket.removeListener(this.DATA_EVENT, monFn);
    };
  }

  // stopMon(cb) {
  //   this.disconnect(cb);
  // }
};

const decodeRecordRealTimeLog40 = (buf) => {
  return {
    userId: parseInt(buf.slice(8, 11).toString('ascii')),
    time: new Date(2000 + buf[34], buf[35] - 1, buf[36], buf[37], buf[38], buf[39]).getTime(),
  };
};

const parseHexToTime = (hex) => {
  const time = {
    year: hex.readUIntLE(0, 1),
    month: hex.readUIntLE(1, 1),
    date: hex.readUIntLE(2, 1),
    hour: hex.readUIntLE(3, 1),
    minute: hex.readUIntLE(4, 1),
    second: hex.readUIntLE(5, 1),
  };

  return new Date(2000 + time.year, time.month - 1, time.date, time.hour, time.minute, time.second);
};

const decodeRecordRealTimeLog52 = (recordData) => {
  const payload = removeTcpHeader(recordData);

  const recvData = payload.subarray(8);

  const userId = recvData.slice(0, 9).toString('ascii').split('\0').shift();

  const time = parseHexToTime(recvData.subarray(26, 26 + 6));

  return {userId, time};
};
