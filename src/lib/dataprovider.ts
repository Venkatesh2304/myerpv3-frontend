import {
    DataProvider,
    HttpError,
    BaseRecord,
    Pagination,
    CrudFilters,
    CrudSorting,
} from "@refinedev/core";
import RestDataProvider from "../rest-data-provider/index";
import axios from "axios";

export const httpClient = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_API_URL,
    withCredentials: true
});

type DrfDataProviderConfig = {
    baseUrl?: string;
    limitParam?: string; // default: limit
    offsetParam?: string; // default: offset
    includeTrailingSlash?: boolean; // default: true
};

export const createDrfDataProvider = (config: DrfDataProviderConfig = {}): DataProvider => {
    const {
        baseUrl = "http://127.0.0.1:8080", //43.20.224.85
        limitParam = "limit",
        offsetParam = "offset",
        includeTrailingSlash = true,
    } = config;

    const apiUrl = baseUrl.replace(/\/+$/, "");

    const withSlash = (resource: string) => {
        if (!includeTrailingSlash) return resource;
        return resource.endsWith("/") ? resource : `${resource}/`;
    };

    const buildResourceUrl = (resource: string, id?: string | number) => {
        const base = `${apiUrl}/${withSlash(resource)}`;
        return id != null ? `${base}${id}/` : base;
    };

    const toQueryString = (params: Record<string, any>) => {
        const searchParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (value === undefined || value === null || value === "") continue;
            if (Array.isArray(value)) {
                searchParams.append(key, value.join(","));
            } else {
                searchParams.append(key, String(value));
            }
        }
        const s = searchParams.toString();
        return s ? `?${s}` : "";
    };

    const mapSorters = (sorters?: CrudSorting) => {
        if (!sorters?.length) return {};
        const ordering = sorters
            .map((s) => (s.order === "desc" ? `-${s.field}` : s.field))
            .join(",");
        return { ordering };
    };

    // Simple filters: eq and contains (icontains)
    const mapFilters = (filters?: CrudFilters) => {
        if (!filters || !filters.length) return {};
        const out: Record<string, any> = {};
        for (const f of filters) {
            if (!("field" in f)) continue;
            const { field, operator, value } = f;
            if (value === undefined) continue;
            if (operator === "eq" || operator === "null") {
                out[field] = value;
            } else if (operator === "contains") {
                out[`${field}__icontains`] = value;
            }
        }
        return out;
    };

    const handleResponse = async (res: Response) => {
        const contentType = res.headers.get("content-type") || "";
        let payload: any = null;
        if (contentType.includes("application/json")) {
            try {
                payload = await res.json();
            } catch {
                payload = null;
            }
        } else {
            try {
                payload = await res.text();
            } catch {
                payload = null;
            }
        }
        if (!res.ok) {
            const error: HttpError = {
                message:
                    (payload && (payload.detail || payload.non_field_errors?.join(" "))) ||
                    res.statusText ||
                    "Request failed",
                statusCode: res.status,
                errors: payload,
            };
            throw error;
        }
        return payload;
    };

    const doFetch = async (
        input: RequestInfo,
        init?: RequestInit,
        metaHeaders?: Record<string, string>,
    ) => {
        const mergedHeaders: Record<string, string> = {
            "Content-Type": "application/json",
            ...(metaHeaders || {}),
            ...(init?.headers as Record<string, string>),
        };
        return fetch(input, { ...init, headers: mergedHeaders, credentials: "include" }).then(handleResponse);
    };

    const provider: DataProvider = {
        getApiUrl: () => apiUrl,

        getList: async ({ resource, pagination, filters, sorters, meta }) => {
            const { currentPage = 1, pageSize = 25, mode } = (pagination || {}) as Pagination;
            const params: Record<string, any> = {};
            if (mode === "server") {
                params[limitParam] = pageSize;
                params[offsetParam] = (currentPage - 1) * pageSize;
            }
            Object.assign(params, mapSorters(sorters), mapFilters(filters), meta?.query);
            const qs = toQueryString(params);
            const url = `${buildResourceUrl(resource)}${qs}`;
            const json = await doFetch(url, { method: "GET" }, meta?.headers);

            if (json && typeof json === "object" && Array.isArray(json.results) && "count" in json) {
                return { data: json.results, total: json.count };
            }
            if (Array.isArray(json)) {
                return { data: json, total: json.length };
            }
            return { data: [], total: 0 };
        },

        getOne: async ({ resource, id, meta }) => {
            const url = buildResourceUrl(resource, id);
            const data = await doFetch(url, { method: "GET" }, meta?.headers);
            return { data };
        },

        getMany: async ({ resource, ids, meta }) => {
            const params = toQueryString({ id__in: ids });
            const url = `${buildResourceUrl(resource)}${params}`;
            const json = await doFetch(url, { method: "GET" }, meta?.headers);
            const data = Array.isArray(json?.results) ? json.results : Array.isArray(json) ? json : [];
            return { data };
        },

        create: async ({ resource, variables, meta }) => {
            const url = buildResourceUrl(resource);
            const data = await doFetch(
                url,
                { method: "POST", body: JSON.stringify(variables) },
                meta?.headers,
            );
            return { data };
        },

        update: async ({ resource, id, variables, meta }) => {
            const url = buildResourceUrl(resource, id);
            const method = meta?.method === "put" ? "PUT" : "PATCH";
            const data = await doFetch(
                url,
                { method, body: JSON.stringify(variables) },
                meta?.headers,
            );
            return { data };
        },

        deleteOne: async ({ resource, id, meta }) => {
            const url = buildResourceUrl(resource, id);
            const data = await doFetch(url, { method: "DELETE" }, meta?.headers);
            return { data: data || ({ id } as BaseRecord) };
        },

        deleteMany: async ({ resource, ids, meta }) => {
            const results: BaseRecord[] = [];
            for (const id of ids) {
                try {
                    const url = buildResourceUrl(resource, id);
                    await doFetch(url, { method: "DELETE" }, meta?.headers);
                    results.push({ id } as BaseRecord);
                } catch {
                    // continue on error
                }
            }
            return { data: results };
        },

        createMany: async ({ resource, variables, meta }) => {
            const url = buildResourceUrl(resource);
            const data = await doFetch(
                url,
                { method: "POST", body: JSON.stringify(variables) },
                meta?.headers,
            );
            return { data: Array.isArray(data) ? data : [data] };
        },

        updateMany: async ({ resource, ids, variables, meta }) => {
            const updated: BaseRecord[] = [];
            for (const id of ids) {
                const url = buildResourceUrl(resource, id);
                const data = await doFetch(
                    url,
                    { method: "PATCH", body: JSON.stringify(variables) },
                    meta?.headers,
                );
                updated.push(data);
            }
            return { data: updated };
        },

        custom: async ({ url, method, headers, meta, filters, sorters, payload, query }) => {
            const params = {
                ...mapFilters(filters),
                ...mapSorters(sorters),
                ...(query || {}),
            };
            const qs = toQueryString(params);

            // Always prepend base URL to the provided url
            const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
            const fullUrl = `${apiUrl}/${cleanUrl}${qs}`;

            // Check if this is a blob/file download request
            const responseType = meta?.responseType || headers?.responseType;

            const isFormData = payload instanceof FormData;

            const mergedHeaders: Record<string, string> = {
                ...(isFormData ? {} : { "Content-Type": "application/json" }),
                ...(meta?.headers || {}),
                ...(headers as Record<string, string> || {}),
            };

            const response = await fetch(fullUrl, {
                method: method || "GET",
                body: isFormData ? payload : (payload ? JSON.stringify(payload) : undefined),
                credentials: "include",
                headers: mergedHeaders,
            });

            if (!response.ok) {
                const contentType = response.headers.get("content-type") || "";
                let errorPayload: any = null;
                if (contentType.includes("application/json")) {
                    try {
                        errorPayload = await response.json();
                    } catch {
                        errorPayload = null;
                    }
                }
                const error: HttpError = {
                    message:
                        (errorPayload && (errorPayload.detail || errorPayload.non_field_errors?.join(" "))) ||
                        response.statusText ||
                        "Request failed",
                    statusCode: response.status,
                    errors: errorPayload,
                };
                throw error;
            }

            // If blob response is requested, return the raw Response object
            if (responseType === 'blob') {
                return { data: response };
            }

            // Otherwise, parse as JSON or text
            const data = await handleResponse(response);
            return { data };
        },
    };

    return provider;
};

export const dataProvider = RestDataProvider("", httpClient);

// export const dataProvider = createDrfDataProvider();