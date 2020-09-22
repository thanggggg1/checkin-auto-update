import {useEffect} from "react";
import {Modal} from "antd";

const useAutoAlertError = (error?: Error) => {
  useEffect(() => {
    if (!error) return;

    Modal.error({
      title: error.message
    });
  }, [error]);
}

export default useAutoAlertError;
