export interface Order {
    order_no: string;
    party: string;
    party_id: number;
    lines: number;
    bill_value: number;
    allocated_value: number;
    OS: string;
    coll: string;
    salesman: string;
    beat: string;
    phone: string;
    type: string;
    cheque: string;
    allow_order: boolean;
    order_category: 'normal' | 'partial' | 'less_than_config';
    warning?: string;
}

export interface OrderProduct {
    id: string; // row identifier
    p: string;  // party name
    bd: string; // product
    t: number;  // rate
    cq: number; // Order Qty
    aq: number; // Allocated Qty
    qp: number; // To Bill Qty (editable)
    ar: string; // Reason
}

export interface ProcessStats {
    [key: string]: number;
}

export interface BillingStats {
    last_bills_count?: number;
    last_bills?: string;
    last_time?: string;
    today_bills_count?: number;
    today_bills?: string;
    unprinted_bills_count?: number;
    user?: string;
    process?: ProcessStats;
}

export interface BillingResponse extends BillingStats {
    orders?: Order[];
    hash?: string;
    message?: string;
    error?: string;
}

export interface PartyCredibilityResponse {
    avg_days: number;
    avg_value: number;
    avg_monthly: number;
    bills: {
        name: string;
        days: number | null;
        amt: number;
        collected: boolean;
    }[];
}

export interface PartyCreditResponse {
    bills: number;
    days: number;
    value: number;
}
