export interface Resident {
  id?: string;
  userId?: string;
  email?: string;
  name: string;
  flatId: string;
  contact: string;
  status: 'owner' | 'tenant';
  moveInDate: string;
  emergencyContact: string;
}

export interface Flat {
  id?: string;
  wing: string;
  flatNo: string;
  occupancy: 'occupied' | 'vacant';
  type: string;
  size: string;
}

export interface MaintenanceBill {
  id?: string;
  flatId: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  paymentDate?: string;
}

export interface Notice {
  id?: string;
  title: string;
  content: string;
  category: 'general' | 'urgent' | 'event';
  date: string;
}

export interface Complaint {
  id?: string;
  residentId: string;
  flatId: string;
  type: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  assignedTo?: string;
  createdAt: string;
}

export interface Visitor {
  id?: string;
  name: string;
  flatId: string;
  purpose: string;
  entryTime?: string;
  exitTime?: string;
  photo?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'left';
}
