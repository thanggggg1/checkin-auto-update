jest.mock('dgram');

const dgram = require('dgram');

const ZKLib = require('../zklib/zklib');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('constructor', () => {
  test('when no connectionType is specify, it should assign DATA_EVENT to message', () => {
    const ZK = new ZKLib({ip: '12', inport: 1});

    expect(ZK.DATA_EVENT).toBe('message');
  });

  test('when connectionType is UDP it should assign DATA_EVENT to message', () => {
    const ZK = new ZKLib({ip: '12', inport: 1, connectionType: 'udp'});

    expect(ZK.DATA_EVENT).toBe('message');
  });

  test('when connectionType is TCP it should assign DATA_EVENT to data', () => {
    const ZK = new ZKLib({ip: '12', inport: 1, connectionType: 'tcp'});

    expect(ZK.DATA_EVENT).toBe('data');
  });
});

describe('options validation', () => {
  test('when no options are specify should throw error', () => {
    const create = () => {
      new ZKLib();
    };

    expect(create).toThrowError('Options required');
  });

  test('when no ip is specify should throw error', () => {
    const create = () => {
      new ZKLib({ip: ''});
    };

    expect(create).toThrowError('IP option required');
  });

  test('when no ip is specify should throw error', () => {
    const create = () => {
      new ZKLib({ip: '12', inport: 0});
    };

    expect(create).toThrowError('Inport option required');
  });

  test('when attendanceParser is not valid should throw error', () => {
    const create = () => {
      new ZKLib({ip: '12', inport: 12, attendanceParser: 'other'});
    };

    expect(create).toThrowError('Attendance parser option unknown');
  });

  test('when attendanceParser is valid should not throw error', () => {
    const create = () => {
      new ZKLib({ip: '12', inport: 12, attendanceParser: 'legacy'});
    };

    expect(create).not.toThrowError();
  });

  test('when attendanceParser is not specify it should return legacy as default', () => {
    const zk = new ZKLib({ip: '12', inport: 12});

    expect(zk.attendanceParser).toBe('legacy');
  });
});

describe('send', () => {
  test('when socket send returns an error it should return same error', done => {
    const zk = new ZKLib({ip: '123', inport: 123, attendanceParser: 'v6.60'});

    zk.socket = dgram.createSocket();
    zk.socket.send = jest.fn((msg, offset, length, port, ip, cb) => {
      cb('some error');
    });

    zk.send([], 0, 0, err => {
      expect(err).toBe('some error');
      done();
    });
  });

  test('when the device does not respond it should return timeout error', done => {
    const zk = new ZKLib({ip: '123', inport: 123, attendanceParser: 'v6.60', timeout: 5});

    zk.socket = dgram.createSocket();
    zk.socket.send = jest.fn((msg, offset, length, port, ip, cb) => {
      cb();
    });

    zk.send([], 0, 0, err => {
      expect(err).toEqual(new Error('Timeout error'));
      done();
    });
  });

  test('when the device responds it should not return an error', done => {
    const zk = new ZKLib({ip: '123', inport: 123, attendanceParser: 'v6.60', timeout: 10});

    zk.socket = dgram.createSocket();
    zk.socket.once = jest.fn((eventType, cb) => {
      setTimeout(() => cb(), 5);
    });
    zk.socket.send = jest.fn((msg, offset, length, port, ip, cb) => {
      cb();
    });

    zk.send([], 0, 0, err => {
      expect(err).toBeUndefined();
      done();
    });
  });
});

describe('executeCmd', () => {
  test('when socket send returns an error it should return same error', done => {
    const zk = new ZKLib({ip: '123', inport: 123, attendanceParser: 'v6.60', timeout: 5});

    zk.socket = dgram.createSocket('udp4');

    zk.socket.send = jest.fn((msg, offset, length, port, ip, cb) => {
      cb('some error');
    });

    zk.executeCmd(1234, '', err => {
      expect(err).toBe('some error');
      done();
    });
  });

  test('when the device does not respond it should return timeout error', done => {
    const zk = new ZKLib({ip: '123', inport: 123, attendanceParser: 'v6.60', timeout: 5});

    zk.socket = dgram.createSocket('udp4');

    zk.socket.send = jest.fn((msg, offset, length, port, ip, cb) => {
      cb();
    });

    zk.executeCmd(12, '', err => {
      expect(err).toEqual(new Error('Timeout error'));
      done();
    });
  });

  test('when the device responds with an empty msg it should return an error', done => {
    const zk = new ZKLib({ip: '123', inport: 123, attendanceParser: 'v6.60', timeout: 10});

    zk.socket = dgram.createSocket('udp4');

    zk.socket.send = jest.fn((msg, offset, length, port, ip, cb) => {
      cb();
    });
    zk.socket.once = jest.fn((eventType, cb) => {
      setTimeout(() => cb(), 5);
    });

    zk.executeCmd(12, '', err => {
      expect(err).toEqual(new Error('Invalid length reply'));
      done();
    });
  });

  test('when the device does respond but its not valid it should return an error', done => {
    const zk = new ZKLib({ip: '123', inport: 123, attendanceParser: 'v6.60', timeout: 10});

    zk.socket = dgram.createSocket('udp4');

    zk.socket.send = jest.fn((msg, offset, length, port, ip, cb) => {
      cb();
    });
    zk.socket.once = jest.fn((eventType, cb) => {
      setTimeout(() => cb(Buffer.from(new Array(10))), 5);
    });

    zk.executeCmd(12, '', err => {
      expect(err).toEqual(new Error('Invalid request'));
      done();
    });
  });

  test('when the device does respond it should not return an error', done => {
    const zk = new ZKLib({ip: '123', inport: 123, attendanceParser: 'v6.60', timeout: 10});

    zk.socket = dgram.createSocket('udp4');

    zk.socket.send = jest.fn((msg, offset, length, port, ip, cb) => {
      cb();
    });
    zk.socket.once = jest.fn((eventType, cb) => {
      setTimeout(() => cb(Buffer.from([0xd0, 0x07, 1, 2, 3, 4, 5, 6])), 5);
    });

    zk.executeCmd(12, '', (err, reply) => {
      expect(err).toBeFalsy();
      expect(reply.length).toBe(8);
      done();
    });
  });
});
