"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { AxiosResponse } from "axios";
import { type CaptchaAPI } from "@/lib/captcha";
import { httpClient } from "@/lib/dataprovider";
import { Spinner } from "@/components/ui/spinner";

type Deferred<T> = { resolve: (v: T) => void; reject: (e: unknown) => void };
type Phase = "idle" | "loading" | "submitting";

const CaptchaContext = createContext<CaptchaAPI | null>(null);

export const useCaptcha = (): CaptchaAPI => {
  const ctx = useContext(CaptchaContext);
  if (!ctx) throw new Error("useCaptcha must be used within CaptchaProvider");
  return ctx;
}

export const CaptchaProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");

  const retryRef = useRef<(() => Promise<AxiosResponse>) | null>(null);
  const deferredRef = useRef<Deferred<AxiosResponse> | null>(null);
  const programmaticCloseRef = useRef(false); // prevent onClose from cancelling programmatic close

  const resetState = () => {
    setCaptcha("");
    setError(null);
    setPhase("idle");
    setImageUrl(null);
    setKey(null);
    retryRef.current = null;
    deferredRef.current = null;
  };

  // Reset input and error when a new captcha key arrives
  useEffect(() => {
    if (key) {
      setCaptcha("");
      setError(null);
    }
  }, [key]);

  const fetchCaptchaImage = useCallback(async (k: string) => {
    setPhase("loading");
    try {
      // Revoke previous image URL to prevent memory leaks
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      const res = await httpClient.post("/custom/captcha", { key: k }, { responseType: "blob" });
      const blob = res.data as Blob;
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
      setPhase("idle");
    } catch (e: any) {
      setError(e?.message ?? "Failed to load captcha");
      setPhase("idle");
    }
  }, [imageUrl]);

  const challenge: CaptchaAPI["challenge"] = useCallback(
    (k, retry) => {
      // deferredRef.current?.reject(new Error("Superseded by new captcha challenge"));
      setOpen(true);
      setKey(k);
      retryRef.current = retry;
      fetchCaptchaImage(k);
      return new Promise<AxiosResponse>((resolve, reject) => {
        deferredRef.current = { resolve, reject };
      });
    },
    [fetchCaptchaImage] // removed `key` to keep reference stable
  );

  const onClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      // Only reject if user/click-driven close, not programmatic close after resolve/reject
      if (!programmaticCloseRef.current) {
        deferredRef.current?.reject(new Error("Captcha cancelled"));
      }
      resetState();
      setOpen(false);
      programmaticCloseRef.current = false;
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Capture current refs to avoid being overwritten by nested challenges
    const currentRetry = retryRef.current;
    const currentDeferred = deferredRef.current;
    if (!key || !currentRetry || !currentDeferred) return;

    setPhase("submitting");
    setError(null);
    try {
      const data = await httpClient.post("/custom/login", { key, captcha }).then((res) => res.data);
      if (data?.ok === false) {
        if (data?.error == "invalid_captcha") {
          setError("Invalid captcha, please try again");
        } else if (data?.error == "invalid_credentials") {
          setError(`${data?.message}. Change them in Configuration`);
        }
        setPhase("idle");
        setCaptcha("");
        await fetchCaptchaImage(key);
        return;
      }

      // Retry original request using captured retry; propagate its result to the captured deferred
      programmaticCloseRef.current = true;
      setOpen(false);
      try {
        const retried = await currentRetry();
        currentDeferred.resolve(retried);
      } catch (retryErr: any) {
        currentDeferred.reject(retryErr);
      } finally {
      }
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
      setPhase("idle");
    }
  };

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  const value = useMemo<CaptchaAPI>(() => ({ challenge }), [challenge]);

  const isLoadingImg = phase === "loading";
  const isSubmitting = phase === "submitting";
  const isBusy = isLoadingImg || isSubmitting;

  return (
    <CaptchaContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{key?.toUpperCase()} Login</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="flex flex-col gap-4 mt-3">
            {isLoadingImg ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner />
              </div>
            ) : imageUrl ? (
              <img src={imageUrl} alt="captcha" className="w-full h-auto rounded border" />
            ) : (
              <div className="text-sm text-muted-foreground">Captcha not available.</div>
            )}

            <Input
              id="captcha"
              value={captcha}
              onChange={(e) => setCaptcha(e.target.value)}
              placeholder="Enter captcha"
              disabled={isLoadingImg}
            />
            {error ?
              <div className="text-sm text-red-600" dangerouslySetInnerHTML={{ __html: error }} />
              : null}

            <div className="flex gap-2">
              <Button type="submit" disabled={isBusy}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" />
                  </span>
                ) : (
                  "Submit"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => onClose(false)} disabled={isBusy}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </CaptchaContext.Provider>
  );
};
