import { translate } from "../store/settings/languages";

const convertPyzkErrorToMessage = (error?: Error) => {
  if (!error) return;

  const {message} = error;

  interface MapLanguage {
    [include: string]: {
      vi: string,
      en?: string
    }
  }

  const map: MapLanguage = {
    Unauthenticated:  {
      vi: 'Máy chấm công đặt mật khẩu, vui lòng kiểm tra lại mật khẩu',
      en: 'Attendance machine has password, please re-check the password'
    },
    "Invalid response: Can't connect":  {
      vi: 'Lỗi không thể kết nối',
      en: `Can't connect`
    },
    "can't disconnect": {
      vi: 'Không thể ngắt kết nối',
      en: "Can't disconnect"
    },
    "Can't disable device": {
      vi: 'Không thể vô hiệu thiết bị',
      en: `Cant disable device`
    },
    "Can't read the frimware version": {
      vi: 'Không đọc được phiên bản firmware',
      en: `Can't read firmware version`
    },
    "Can't read platform name": {
      vi: "Không thể đọc tên hãng"
    },
    "can't read mac address": {
      vi: "Không thể đọc địa chỉ MAC"
    },
    "can't read fingerprint version": {
      vi: "Không thể đọc phiên bản vân tay"
    },
    "can0t get pin width": {
      vi: "Không thể đọc pin width",
      en: "Can't get pin width"
    },
    "can't free data": {
      vi: "Không thể giải phóng dữ liệu",
    },
    "can't read sizes": {
      vi: "Không thể đọc dung lượng trong máy"
    },
    "Can't open door": {
      vi: "Không thể mở cửa"
    },
    "can't restart device": {
      vi: "Không thể khởi động lại thiết bị"
    },
    "can't get time": {
      vi: "Không thể lấy thời gian của thiết bị"
    },
    "can't set time": {
      vi: "Không thể đặt thời gian của thiết bị"
    },
    "Can't prepare data": {
      vi: "Không thể chuẩn bị dữ liệu"
    },
    "Can't send chunk": {
      vi: "Không thể gửi mảnh dữ liệu nhỏ"
    },
    "cant' reg events": {
      vi: "Không thể đăng ký sự kiện"
    },
    "can't read chunk": {
      vi: "Không thể đọc mảnh dữ liệu nhỏ"
    },
    "RWB Not supported": {
      vi: "Thiết bị không hỗ trợ"
    }
  }

  for (const [key, value] of Object.entries(map)) {
    if (message.includes(key)) {
      return translate('__', {
        vi: value.vi,
        en: value.en || key
      })
    }
  }

  return message;
}

export default convertPyzkErrorToMessage;
