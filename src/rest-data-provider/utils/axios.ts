import axios from "axios";
import type { HttpError } from "@refinedev/core";
import { errorTracker } from "@/lib/error-tracker";

const axiosInstance = axios.create();

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    try {
      errorTracker.recordFailure({
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        params: error.config?.params,
        data: error.config?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("Failed to record failure in axiosInstance", e);
    }

    const customError: HttpError = {
      ...error,
      message: error.response?.data?.message,
      statusCode: error.response?.status,
    };

    return Promise.reject(customError);
  }
);

export { axiosInstance };
