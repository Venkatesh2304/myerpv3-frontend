export interface BankCollection {
  balance: number;
  amt: number;
  bill: string;
  party: string;
}

export interface BankEvent {
  type: string;
  message: string;
  by: string | null;
  time: string;
}

export interface Bank {
  id: string;
  date: string;
  ref: string;
  desc: string;
  amt: number;
  bank: string;
  company: string;
  status: number;
  pushed: boolean;
  type: string | null;
  cheque_entry: string | null;
  cheque_status: string | null;
  collection: BankCollection[];
  events?: BankEvent[];
}
