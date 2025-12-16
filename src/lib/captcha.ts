import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, isAxiosError } from "axios";
import { httpClient } from "./dataprovider";


export type CaptchaAPI = {
  challenge: (key: string, retry: () => Promise<AxiosResponse>) => Promise<AxiosResponse>;
};

// Axios-based helper that opens captcha flow on 501 and retries
export async function requestWithCaptcha(
  config: AxiosRequestConfig,
  captcha: CaptchaAPI,
  instance: AxiosInstance = httpClient
): Promise<AxiosResponse> {
  const doRequest = () => instance.request(config);

  try {
    const res = await doRequest();
    return res;
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 501) {
      let key: string | undefined;
      const data = err.response.data;
      if (data instanceof Blob) {
        // convert Blob to JSON
        const text = await data.text();
        const json = JSON.parse(text);
        key = json?.key;
      } else {
        // assume it's already JSON
        key = (data && (data.key ?? data?.key)) as string | undefined;
      }
      if (!key) throw err;
      return captcha.challenge(key, () => requestWithCaptcha(config, captcha, instance));
    }
    throw err; // propagate original error (e.g., 500) to caller
  }
}
