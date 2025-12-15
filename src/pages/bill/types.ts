export interface Bill {
    bill: string;
    party: string;
    date: string;
    salesman: string;
    beat: string;
    amt: number | string;
    print_time: string | null;
    print_type: string | null;
    einvoice: boolean;
    delivered: boolean;
}
