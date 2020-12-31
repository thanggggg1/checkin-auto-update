import {useEffect} from "react";
import {Modal} from "antd";

const useAutoAlertError = (error?: Error | string) => {
  useEffect(() => {
    if (!error) return;

    Modal.error({
      title: typeof error === 'string' ? error : error.message
    });
  }, [error]);
}

export default useAutoAlertError;
