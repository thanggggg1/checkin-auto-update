import { translate } from "../store/settings/languages";

const convertZklibErrorToMessage = (error: Error) => {
  const {message} = error;

  if (message === 'no data') {
    return translate('__', {
      vi: 'Không có dữ liệu',
      en: 'No data'
    })
  }

  if (message === 'zero length reply') {
    return translate('__', {
      vi: 'Máy chấm công không trả về dữ liệu',
      en: 'Attendance machine does not return any data'
    })
  }

  if (message === 'IP option required') {
    return translate('__', {
      vi: 'Bạn chưa nhập địa chỉ IP',
      en: 'IP address is required',
    })
  }

  if (message.includes('ECONNREFUSED')) {
    return translate('__', {
      vi: `Kết nối bị từ chối.
Lỗi này thường xảy ra do có nhiều thiết bị đang kết nối tới máy chấm công.
Hãy tìm các thiết bị / phần mềm khác cũng đang kết nối tới máy chấm công đó và ngắt kết nối`,
      en: `Connection refused.
This error usually because of multiple devices are connecting to this device at the same time.
You should search for another device or app connecting to this attendance machine and disconnect it`
    })
  }

  if (message.includes('ECONNRESET')) {
    return translate('__', {
      vi: `Không có kết nối: ECONNRESET.
Vui lòng kiểm tra lại kết nối.
Nguyên nhân xảy ra thường do đường truyền, hoặc do thiết bị đã bị tắt.`,
      en: `No connection: ECONNRESET.
Please re-check the connection or device.`
    })
  }

  if (message.includes('ETIMEDOUT')) {
    return translate('__', {
      vi: `Kết nối quá hạn: ETIMEDOUT.
Vui lòng kiểm tra lại kết nối đường truyền.`,
      en: `Connection timed out: ETIMEDOUT.
Please re-check the connection.`
    })
  }

  if (['ACK_ERROR', 'ACK_UNKNOWN', 'ACK_ERROR_CMD', 'ACK_ERROR_DATA', 'ACK_ERROR_INIT'].includes(message)) {
    return translate('__', {
      vi: `Có lỗi khi xử lý yêu cầu: ACK_ERROR.
Thử lại một lần nữa, nếu không được, hãy thử khởi động lại máy chấm công`,
      en: `Error while processing data: ACK_ERROR.
Retry one more time. If this error still occur, please restart the attendance machine`
    });
  }

  if (message === 'ACK_UNAUTH') {
    return translate('__', {
      vi: `Có lỗi khi xử lý yêu cầu: ACK_UNAUTH.
Máy chấm công của bạn đang cài đặt mật khẩu. Vui lòng kiểm tra lại`,
      en: `Error while processing data: ACK_ERROR.
Your attendance machine has password. Please recheck`
    });
  }

  if (message === 'zero') {
    return translate('__', {
      vi: `Không có dữ liệu`,
      en: `No data`
    })
  }

  if (message === 'zero length reply') {
    return translate('__', {
      vi: 'Không có dữ liệu trả về',
      en: 'No data reply'
    })
  }

  if (message.includes('Unknown error, length not match')) {
    return translate('__', {
      vi: 'Lỗi không rõ, dữ liệu không đồng nhất',
      en: 'Unknown error, data does not match'
    })
  }

  if (message === 'Invalid request') {
    return translate('__', {
      vi: 'Yêu cầu không hợp lệ',
      en: 'Invalid request'
    })
  }

  if (message === 'Invalid length reply') {
    return translate('__', {
      vi: 'Dữ liệu trả về không đúng định dạng. Thử khởi động lại máy chấm công và kiểm tra lại',
      en: 'The respond data is not valid. Please reboot the attendance machine and recheck'
    })
  }

  if (['TIMEOUT_ON_RECEIVING_REQUEST_DATA', 'Timeout error', 'TIMEOUT_IN_RECEIVING_RESPONSE_AFTER_REQUESTING_DATA', 'TIMEOUT WHEN RECEIVING PACKET'].includes(message)) {
    return translate('__', {
      vi: `Máy chấm công quá hạn gửi dữ liệu`,
      en: 'Attendance machine response timed out'
    }) + ' ' + message
  }

  if (message.includes('Socket is disconnected unexpectedly')) {
   return translate('__', {
     vi: 'Kết nối đã bị ngắt',
     en: 'Socket connection is disconnected unexpectedly'
   })
  }

  if (message.includes('ERROR_IN_UNHANDLE_CMD')) {
    return translate('__', {
      vi: 'Có lỗi khi xử lý yêu cầu: ' + message,
      en: 'Error while handle request: ' + message
    })
  }

  return message;
}

export default convertZklibErrorToMessage;
