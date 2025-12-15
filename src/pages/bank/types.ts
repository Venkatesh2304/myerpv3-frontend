export interface BankCollection {
  balance: number;
  amt: number;
  bill: string;
  party: string;
}

export interface Bank {
  id: string;
  date: string;
  ref: string;
  desc: string;
  amt: number;
  bank: string;
  status: number;
  pushed: boolean;
  type: string | null;
  cheque_entry: string | null;
  cheque_status: string | null;
  collection: BankCollection[];
}
