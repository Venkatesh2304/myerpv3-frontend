export interface ChequeCollection {
  balance: number;
  amt: number;
  bill: string;
  party: string;
  company: string;
}

export interface Cheque {
  id: number;
  cheque_date: string;
  cheque_no: string;
  party_name: string;
  amt: number;
  bank: string;
  deposit_date: string | null;
  collection: ChequeCollection[];
  party: string;
  bank_entry: string | null;
  allow_diff?: boolean;
}
