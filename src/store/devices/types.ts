export enum FormatDateSearch {
  start = "YYYY-MM-DD 00:00:00",
  normal = "YYYY-MM-DD HH:mm:ss",
  end = "YYYY-MM-DD 23:59:59"
}

export enum FormatDateSearchHikVision {
  start = "YYYY-MM-DD[T]00:00:00",
  normal = "YYYY-MM-DD[T]HH:mm:ss",
  end = "YYYY-MM-DD[T]23:59:59"
}
//2022-09-15T00:00:00+07:00
export const MaxEvenEachRequest = 501;

export interface RawUserInterface {
  user_id: string;
  name: string;
  gender: string;
  birthday: string;
  photo_exists: string;
  pin_exists: string;
  login_id: string;
  password_exists: string;
  updated_count: string;
  last_modified: string;
  idx_last_modified: string;
  start_datetime: string;
  expiry_datetime: string;
  security_level: string;
  display_duration: string;
  display_count: string;
  permission: {
    id: string;
    name: string;
    description: string;
    filter: {
      UserGroup: string[];
      DeviceGroup: string[];
      DoorGroup: string[];
      ElevatorGroup: string[];
      ZoneType: string[];
      AccessGroup: string[];
      GraphicMapGroup: string[];
    };
    device: {
      id: string
    };
    user: {
      id: string
    };
  };
  inherited: string;
  user_group_id: {
    id: string;
    name: string;
  };
  disabled: string;
  expired: string;
  idx_user_id: string;
  idx_user_id_num: string;
  idx_name: string;
  idx_phone: string;
  idx_email: string;
  fingerprint_templates: {
    finger_index: string;
    finger_mask: string;
    template0: string;
    template1: string;

  }[];
  fingerprint_template_count: string;
  face_count: string;
  cards: {
    id: string;
    card_id: string;
    display_card_id: string;
    status: string;
    is_blocked: string;
    is_assigned: string;
    mobile_card: string;
    issue_count: string;
    card_slot: string;
    card_mask: string;
  }[];
  card_count: string;
  access_groups: {
    id: string,
    name: string
  }[];
  need_to_update_pw: string;
}

export interface RawEvent {
  id?: string | number ;
  server_datetime: string;
  datetime: string;
  index: string;
  user_id_name: string;
  user_id: {
    user_id: string;
    name: string;
    photo_exists: string;
  };
  device_id: {
    id: string;
    name: string;
  };
  tna_key: string;
  is_dst: string;
  user_update_by_device: string;
  hint: string;
}


// export interface RawEven
//     datetime(datetime: any);t {
//   id: string;
//   eventTime: string;
//   pin: string;
//   name: string;
//   lastName: string;
//   deptName: string;
//   areaName: string;
//   cardNo: string;
//   devSn: string;
//   verifyModeName: string;
//   eventName: string;
//   eventPointName: string;
//   readerName: string;
//   accZone: string;
//   devName: string;
//   logId: string;
//   eventNo: string;
//   eventLevel: string;
//   doorName: string;
// }