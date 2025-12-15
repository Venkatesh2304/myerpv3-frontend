export interface BillingStats {
    stats: {
        today: {
            "TODAY BILLS COUNT": number;
            "TODAY BILLS": string;
            "SUCCESS": number;
            "FAILURES": number;
        };
        last: {
            "LAST BILLS COUNT": string | number;
            "LAST BILLS": string;
            "LAST STATUS": string;
            "LAST TIME": string;
            "LAST REJECTED": number;
            "LAST PENDING": number;
        };
        bill_counts: {
            "rejected": number;
            "pending": number;
            "creditlock": number;
        };
    }
}

export interface Order {
    order_no: string;
    party: string;
    lines: number;
    bill_value: number;
    OS: string;
    coll: string;
    salesman: string;
    beat: string;
    phone: string;
    type: string;
    cheque: string;
    potential_release: boolean;
}

export interface BillingStatus {
    process: string;
    status: number;
    time: number;
}
