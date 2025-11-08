
export interface Contact {
  id: string;
  name: string;
}

export interface Participant {
  contactId: string;
  amount: number;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  paidById: string; // contactId or 'USER_ME'
  participants: Participant[];
}

export enum SplitType {
  EQUALLY = 'EQUALLY',
  UNEQUALLY = 'UNEQUALLY',
}
