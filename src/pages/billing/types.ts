export interface Order {
    order_no: string;
    party: string;
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

export interface BillingResponse {
    orders?: Order[];
    hash?: string;
    process?: ProcessStats;
    last_bills_count?: number;
    last_bills?: string;
    last_time?: string;
    message?: string;
    error?: string;
}

export interface PartyCredibilityResponse {
    avg_days: number;
    avg_value: number;
    days: number[];
    values: number[];
}
