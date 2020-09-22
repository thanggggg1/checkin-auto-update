import { useEffect } from "react";
import { message } from "antd";

const useAutoMessageError = (error?: Error, duration = 5000) => {
  useEffect(() => {
    if (!error) return;

    message.error(error.message, duration)
  }, [error])
}

export default useAutoMessageError;
