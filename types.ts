export interface Contact {
  id: string;
  name: string;
}

export type SplitParticipant = 'you' | string;

export interface Transaction {
  id:string;
  description: string;
  amount: number;
  date: string;
  paidById: SplitParticipant;
  splitBetween: SplitParticipant[];
  customSplits?: { [participantId: string]: number };
  groupId?: string | null;
  category?: string;
  receiptImage?: string; // Base64 encoded image
}

export interface Group {
  id: string;
  name:string;
  members: string[]; // array of contactIds
}

export interface SimplifiedDebt {
  from: string;
  to: string;
  amount: number;
}