import {useEffect} from "react";
import {Alert, Modal} from "antd";

const useAutoAlertError = (error?: Error) => {
  useEffect(() => {
    if (!error) return;

    Modal.error({
      title: error.message
    });
  }, [error]);
}

export default useAutoAlertError;