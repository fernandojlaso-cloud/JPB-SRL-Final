export type Currency = 'ARS' | 'USD';

export type TransactionType = 'ingreso' | 'egreso';

export type ProjectStatus = 'active' | 'completed' | 'paused';

export type UserRole = 'superadmin' | 'director' | 'administrativo' | 'comitente';
export type UserStatus = 'pending' | 'active' | 'rejected' | 'revoked';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  approvedAt?: string | null;
  approvedBy?: string | null;
  assignedProjectIds?: string[]; // Para comitentes: IDs de obras que pueden ver
}

export interface Project {
  id: string;
  name: string;
  code: string;
  address?: string;
  client?: string;
  status: ProjectStatus;
  startDate: string;
  budgetARS: number;
  budgetUSD: number;
  defaultExchangeRate: number;
  notes?: string;
}

export interface AccountCategory {
  id: string;
  type: TransactionType;
  code: string;
  name: string;
  description?: string;
  color: string;
  isDefault?: boolean;
}

export interface BudgetEstimate {
  id: string;
  projectId: string;
  categoryId: string;
  budgetedARS: number;
  budgetedUSD: number;
  notes?: string;
}

export interface Transaction {
  id: string;
  projectId: string;
  type: TransactionType;
  categoryId: string;
  date: string; // YYYY-MM-DD
  concept: string;
  amountARS: number;
  amountUSD: number;
  exchangeRate: number; // t.c.
  paymentMethod?: string;
  payerOrRecipient?: string;
  invoiceNumber?: string;
  status?: 'pagado' | 'pendiente' | 'previsto';
  notes?: string;
}

export interface DeviationAnalysis {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  budgetedARS: number;
  budgetedUSD: number;
  actualARS: number;
  actualUSD: number;
  diffARS: number;
  diffUSD: number;
  percentageUsed: number;
  deviationPercentage: number;
  specificWeightPercentage: number; // Peso específico sobre el presupuesto total
  riskLevel: 'normal' | 'alerta' | 'critico';
}

export interface ActivityLog {
  id: string;
  timestamp: string; // ISO string
  action: 'create' | 'update' | 'delete' | 'import' | 'backup_export' | 'backup_restore' | 'user_approve' | 'user_role_change' | 'user_status_change';
  entity: 'obra' | 'ingreso' | 'egreso' | 'rubro' | 'presupuesto' | 'usuario' | 'sistema';
  entityId?: string;
  entityName?: string;
  projectName?: string;
  projectId?: string;
  userEmail: string;
  userName: string;
  userRole: UserRole;
  details: string;
  amountARS?: number;
  amountUSD?: number;
}

export interface SystemBackupData {
  version: string;
  exportDate: string;
  exportedBy: string;
  projects: Project[];
  categories: AccountCategory[];
  budgets: BudgetEstimate[];
  transactions: Transaction[];
  users?: UserProfile[];
  activityLogs?: ActivityLog[];
}
