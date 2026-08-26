import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Scale, 
  Layers, 
  FolderTree, 
  Plus, 
  UploadCloud, 
  Download, 
  ArrowRightLeft, 
  RefreshCw,
  FileSpreadsheet,
  Users,
  ShieldCheck,
  Database,
  Lock
} from 'lucide-react';
import { 
  Project, 
  AccountCategory, 
  BudgetEstimate, 
  Transaction, 
  Currency, 
  TransactionType 
} from './types';
import { 
  INITIAL_PROJECTS, 
  INITIAL_CATEGORIES, 
  INITIAL_BUDGETS, 
  INITIAL_TRANSACTIONS 
} from './data/initialData';
import { exportTransactionsToExcel, downloadExcelTemplate } from './utils/excelHelper';
import { Header } from './components/Header';
import { IncomesTab } from './components/IncomesTab';
import { ExpensesTab } from './components/ExpensesTab';
import { BudgetDeviationsTab } from './components/BudgetDeviationsTab';
import { MacroOverview } from './components/MacroOverview';
import { AccountsAdminTab } from './components/AccountsAdminTab';
import { UsersAdminTab } from './components/UsersAdminTab';
import { TransactionModal } from './components/TransactionModal';
import { CurrencyConverterModal } from './components/CurrencyConverterModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { ProjectModal } from './components/ProjectModal';
import { UserManualModal } from './components/UserManualModal';
import { BackupModal } from './components/BackupModal';
import { AuthScreen } from './components/AuthScreen';
import { JpbSrlLogo } from './components/JpbSrlLogo';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import {
  initializeFirestoreData,
  subscribeToProjects,
  subscribeToCategories,
  subscribeToTransactions,
  subscribeToBudgets,
  saveProjectToFirestore,
  saveBatchProjectsToFirestore,
  updateProjectInFirestore,
  deleteProjectFromFirestore,
  saveCategoryToFirestore,
  saveBatchCategoriesToFirestore,
  updateCategoryInFirestore,
  deleteCategoryFromFirestore,
  saveTransactionToFirestore,
  saveBatchTransactionsToFirestore,
  updateTransactionInFirestore,
  deleteTransactionFromFirestore,
  saveBudgetToFirestore,
} from './services/firestoreService';

function MainDashboard() {
  const { 
    currentUser, 
    userProfile, 
    isLoading, 
    isSuperAdmin, 
    isDirector, 
    isAdministrativo, 
    isComitente,
    canManageUsers,
    canManageObras,
    canCreateTransactions,
    canEditDeleteTransactions,
    canEditTransactions,
    canViewPlanDeCuentas,
    canBackup 
  } = useAuth();

  // Real-time Firestore state with localStorage fallback
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('obrafin_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [categories, setCategories] = useState<AccountCategory[]>(() => {
    const saved = localStorage.getItem('obrafin_categories');
    if (!saved) return INITIAL_CATEGORIES;
    try {
      const parsed: AccountCategory[] = JSON.parse(saved);
      const existingIds = new Set(parsed.map(c => c.id));
      const missing = INITIAL_CATEGORIES.filter(c => !existingIds.has(c.id));
      return [...parsed, ...missing];
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [budgets, setBudgets] = useState<BudgetEstimate[]>(() => {
    const saved = localStorage.getItem('obrafin_budgets');
    if (!saved) return INITIAL_BUDGETS;
    try {
      const parsed: BudgetEstimate[] = JSON.parse(saved);
      const existingIds = new Set(parsed.map(b => b.id));
      const missing = INITIAL_BUDGETS.filter(b => !existingIds.has(b.id));
      return [...parsed, ...missing];
    } catch {
      return INITIAL_BUDGETS;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('obrafin_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem('obrafin_currency');
    return (saved as Currency) || 'ARS';
  });

  const [isCloudConnected, setIsCloudConnected] = useState(false);

  // Filter projects accessible by comitente
  const visibleProjects = useMemo(() => {
    if (isSuperAdmin || isDirector || isAdministrativo) {
      return projects;
    }
    if (isComitente) {
      const assigned = userProfile?.assignedProjectIds || [];
      if (assigned.length === 0) return projects;
      return projects.filter(p => assigned.includes(p.id));
    }
    return projects;
  }, [projects, isSuperAdmin, isDirector, isAdministrativo, isComitente, userProfile]);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj-1');
  const [activeTab, setActiveTab] = useState<'ingresos' | 'egresos' | 'desvios' | 'macro' | 'cuentas' | 'usuarios'>('egresos');

  // Modal States
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [modalTransactionType, setModalTransactionType] = useState<TransactionType>('egreso');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [isConverterOpen, setIsConverterOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Update selectedProjectId if visible projects change
  useEffect(() => {
    if (visibleProjects.length > 0) {
      if (selectedProjectId !== 'macro' && !visibleProjects.some(p => p.id === selectedProjectId)) {
        setSelectedProjectId(visibleProjects[0].id);
      }
    }
  }, [visibleProjects, selectedProjectId]);

  // Initialize Firestore and subscribe to real-time updates
  useEffect(() => {
    let unsubProjects: (() => void) | undefined;
    let unsubCategories: (() => void) | undefined;
    let unsubTransactions: (() => void) | undefined;
    let unsubBudgets: (() => void) | undefined;

    const setupFirestore = async () => {
      try {
        await initializeFirestoreData();
        setIsCloudConnected(true);

        unsubProjects = subscribeToProjects((cloudProjects) => {
          if (cloudProjects.length > 0) {
            setProjects(cloudProjects);
          }
        });

        unsubCategories = subscribeToCategories((cloudCategories) => {
          if (cloudCategories.length > 0) {
            setCategories(cloudCategories);
          }
        });

        unsubTransactions = subscribeToTransactions((cloudTransactions) => {
          if (cloudTransactions.length > 0) {
            setTransactions(cloudTransactions);
          }
        });

        unsubBudgets = subscribeToBudgets((cloudBudgets) => {
          if (cloudBudgets.length > 0) {
            setBudgets(cloudBudgets);
          }
        });
      } catch (err) {
        console.error('Error initializing Firestore realtime sync:', err);
      }
    };

    setupFirestore();

    return () => {
      if (unsubProjects) unsubProjects();
      if (unsubCategories) unsubCategories();
      if (unsubTransactions) unsubTransactions();
      if (unsubBudgets) unsubBudgets();
    };
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('obrafin_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('obrafin_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('obrafin_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('obrafin_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('obrafin_currency', currency);
  }, [currency]);

  // Project transactions filtered
  const currentProjectTransactions = useMemo(() => {
    if (selectedProjectId === 'macro') {
      if (isComitente) {
        const allowedIds = new Set(visibleProjects.map(p => p.id));
        return transactions.filter(t => allowedIds.has(t.projectId));
      }
      return transactions;
    }
    return transactions.filter((t) => t.projectId === selectedProjectId);
  }, [transactions, selectedProjectId, isComitente, visibleProjects]);

  // Aggregate stats for Header
  const totalIncomeARS = currentProjectTransactions
    .filter((t) => t.type === 'ingreso')
    .reduce((acc, t) => acc + t.amountARS, 0);

  const totalIncomeUSD = currentProjectTransactions
    .filter((t) => t.type === 'ingreso')
    .reduce((acc, t) => acc + t.amountUSD, 0);

  const totalExpenseARS = currentProjectTransactions
    .filter((t) => t.type === 'egreso')
    .reduce((acc, t) => acc + t.amountARS, 0);

  const totalExpenseUSD = currentProjectTransactions
    .filter((t) => t.type === 'egreso')
    .reduce((acc, t) => acc + t.amountUSD, 0);

  // If loading auth state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold">Cargando sesión y credenciales seguras...</span>
        </div>
      </div>
    );
  }

  // If not logged in or pending/rejected status
  if (!currentUser || userProfile?.status !== 'active') {
    return <AuthScreen />;
  }

  // Transaction Handlers with Firestore Persistence
  const handleOpenNewTransaction = (type: TransactionType) => {
    if (!canCreateTransactions) {
      alert('No tienes permisos para registrar nuevos movimientos.');
      return;
    }
    setModalTransactionType(type);
    setEditingTransaction(null);
    setIsTransactionModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    if (!canEditDeleteTransactions) {
      alert('Acceso denegado: Únicamente el Director de Proyecto puede corregir o modificar asientos registrados.');
      return;
    }
    setEditingTransaction(tx);
    setModalTransactionType(tx.type);
    setIsTransactionModalOpen(true);
  };

  const handleSaveTransaction = async (txData: Omit<Transaction, 'id'>, editId?: string) => {
    if (editId) {
      if (!canEditDeleteTransactions) {
        alert('Acceso denegado: Únicamente el Director de Proyecto puede modificar un asiento.');
        return;
      }
      const updatedTx = { ...txData, id: editId };
      setTransactions((prev) =>
        prev.map((t) => (t.id === editId ? updatedTx : t))
      );
      try {
        await updateTransactionInFirestore(editId, txData);
      } catch (err) {
        console.error('Error updating transaction in Firestore:', err);
      }
    } else {
      if (!canCreateTransactions) {
        alert('No tienes permisos para registrar asientos.');
        return;
      }
      const newTx: Transaction = {
        ...txData,
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      setTransactions((prev) => [newTx, ...prev]);
      try {
        await saveTransactionToFirestore(newTx);
      } catch (err) {
        console.error('Error saving new transaction to Firestore:', err);
      }
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!canEditDeleteTransactions) {
      alert('Acceso denegado: Únicamente el Director de Proyecto puede borrar asientos contables.');
      return;
    }
    if (confirm('¿Estás seguro de eliminar este registro? Esta acción sólo puede ser realizada por la Dirección de Obra.')) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      try {
        await deleteTransactionFromFirestore(id);
      } catch (err) {
        console.error('Error deleting transaction from Firestore:', err);
      }
    }
  };

  // Category Handlers with Firestore Persistence
  const handleAddCategory = async (catData: Omit<AccountCategory, 'id'>) => {
    const newCat: AccountCategory = {
      ...catData,
      id: `cat-${Date.now()}`,
    };
    setCategories((prev) => [...prev, newCat]);
    try {
      await saveCategoryToFirestore(newCat);
    } catch (err) {
      console.error('Error adding category to Firestore:', err);
    }
  };

  const handleUpdateCategory = async (id: string, updated: Partial<AccountCategory>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
    );
    try {
      await updateCategoryInFirestore(id, updated);
    } catch (err) {
      console.error('Error updating category in Firestore:', err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteCategoryFromFirestore(id);
    } catch (err) {
      console.error('Error deleting category from Firestore:', err);
    }
  };

  const handleAddBatchCategories = async (newCats: Omit<AccountCategory, 'id'>[]) => {
    const formatted: AccountCategory[] = newCats.map((cat, idx) => ({
      ...cat,
      id: `cat-batch-${Date.now()}-${idx}`,
    }));
    setCategories((prev) => [...prev, ...formatted]);
    try {
      await saveBatchCategoriesToFirestore(formatted);
    } catch (err) {
      console.error('Error batch adding categories to Firestore:', err);
    }
  };

  // Project Handlers with Firestore Persistence
  const handleOpenProjectModal = (projToEdit?: Project) => {
    setEditingProject(projToEdit || null);
    setIsProjectModalOpen(true);
  };

  const handleAddProject = async (projData: Omit<Project, 'id'>) => {
    const newProj: Project = {
      ...projData,
      id: `proj-${Date.now()}`,
    };
    setProjects((prev) => [...prev, newProj]);
    setSelectedProjectId(newProj.id);
    try {
      await saveProjectToFirestore(newProj);
    } catch (err) {
      console.error('Error saving project to Firestore:', err);
    }
  };

  const handleUpdateProject = async (id: string, updated: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
    );
    try {
      await updateProjectInFirestore(id, updated);
    } catch (err) {
      console.error('Error updating project in Firestore:', err);
    }
  };

  const handleSaveProject = async (projData: Omit<Project, 'id'>, editId?: string) => {
    if (editId) {
      await handleUpdateProject(editId, projData);
    } else {
      await handleAddProject(projData);
    }
    setIsProjectModalOpen(false);
    setEditingProject(null);
  };

  const handleDeleteProject = async (projectId: string) => {
    // 1. Remove project locally
    setProjects((prev) => {
      const filtered = prev.filter((p) => p.id !== projectId);
      if (selectedProjectId === projectId) {
        setSelectedProjectId(filtered.length > 0 ? filtered[0].id : 'macro');
      }
      return filtered;
    });

    // 2. Remove associated transactions locally
    setTransactions((prev) => prev.filter((t) => t.projectId !== projectId));

    // 3. Remove associated budgets locally
    setBudgets((prev) => prev.filter((b) => b.projectId !== projectId));

    // 4. Delete in Firestore
    try {
      await deleteProjectFromFirestore(projectId);
    } catch (err) {
      console.error('Error deleting project in Firestore:', err);
    }
  };

  // Budget Handlers with Firestore Persistence
  const handleUpdateBudget = async (
    projectId: string,
    categoryId: string,
    budgetedARS: number,
    budgetedUSD: number
  ) => {
    let targetBudget: BudgetEstimate;
    setBudgets((prev) => {
      const existing = prev.find(
        (b) => b.projectId === projectId && b.categoryId === categoryId
      );
      if (existing) {
        targetBudget = { ...existing, budgetedARS, budgetedUSD };
        return prev.map((b) =>
          b.id === existing.id ? targetBudget : b
        );
      } else {
        targetBudget = {
          id: `bud-${Date.now()}`,
          projectId,
          categoryId,
          budgetedARS,
          budgetedUSD,
        };
        return [...prev, targetBudget];
      }
    });

    try {
      const current = budgets.find(
        (b) => b.projectId === projectId && b.categoryId === categoryId
      );
      const toSave: BudgetEstimate = current 
        ? { ...current, budgetedARS, budgetedUSD }
        : { id: `bud-${Date.now()}`, projectId, categoryId, budgetedARS, budgetedUSD };
      await saveBudgetToFirestore(toSave);
    } catch (err) {
      console.error('Error saving budget to Firestore:', err);
    }
  };

  // Excel Import Handler with Firestore Batch Persistence
  const handleImportSuccess = async (imported: Transaction[]) => {
    setTransactions((prev) => [...imported, ...prev]);
    try {
      await saveBatchTransactionsToFirestore(imported);
      alert(`¡Se importaron y guardaron exitosamente en la nube ${imported.length} movimientos!`);
    } catch (err) {
      console.error('Error batch saving transactions to Firestore:', err);
      alert(`¡Se importaron ${imported.length} movimientos al sistema!`);
    }
  };

  // Excel Export Handler
  const handleExportExcel = () => {
    const project = visibleProjects.find((p) => p.id === selectedProjectId);
    const fileName = selectedProjectId === 'macro' 
      ? 'JPB_SRL_Control_Financiero_Macro.xlsx'
      : `JPB_SRL_${project ? project.name.replace(/\s+/g, '_') : 'Obra'}.xlsx`;

    exportTransactionsToExcel(currentProjectTransactions, visibleProjects, categories, fileName);
  };

  // Reset to original seed data (superadmin only)
  const handleResetData = async () => {
    if (confirm('¿Deseas restaurar los datos iniciales y sincronizarlos con la base de datos en la nube?')) {
      try {
        setProjects(INITIAL_PROJECTS);
        setCategories(INITIAL_CATEGORIES);
        setBudgets(INITIAL_BUDGETS);
        setTransactions(INITIAL_TRANSACTIONS);
        setSelectedProjectId('proj-1');

        await Promise.all([
          saveBatchProjectsToFirestore(INITIAL_PROJECTS),
          saveBatchCategoriesToFirestore(INITIAL_CATEGORIES),
          saveBatchTransactionsToFirestore(INITIAL_TRANSACTIONS),
        ]);
        alert('Datos restaurados y sincronizados con la nube con éxito.');
      } catch (e: any) {
        alert('Datos restaurados localmente.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Application Header */}
      <Header
        projects={visibleProjects}
        selectedProjectId={selectedProjectId}
        onSelectProject={(id) => {
          setSelectedProjectId(id);
          if (id === 'macro' && activeTab !== 'macro') {
            // keep tab
          }
        }}
        currency={currency}
        onToggleCurrency={setCurrency}
        onOpenConverter={() => setIsConverterOpen(true)}
        onOpenImport={() => setIsImportModalOpen(true)}
        onExportExcel={handleExportExcel}
        onNewProject={() => handleOpenProjectModal()}
        onOpenManual={() => setIsManualOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        totalIncomeARS={totalIncomeARS}
        totalIncomeUSD={totalIncomeUSD}
        totalExpenseARS={totalExpenseARS}
        totalExpenseUSD={totalExpenseUSD}
        isCloudSynced={isCloudConnected}
      />

      {/* Main Tab Navigation Bar */}
      <nav className="bg-slate-900/90 border-b border-slate-800 shadow-sm sticky top-[106px] z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between overflow-x-auto py-2 gap-2 no-scrollbar">
            <div className="flex items-center gap-1.5 min-w-max">
              {/* Solapa 1: Ingresos */}
              <button
                id="tab-ingresos-btn"
                onClick={() => setActiveTab('ingresos')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                  activeTab === 'ingresos'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                <span>Origen de Fondos (Ingresos)</span>
              </button>

              {/* Solapa 2: Egresos */}
              <button
                id="tab-egresos-btn"
                onClick={() => setActiveTab('egresos')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                  activeTab === 'egresos'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <ArrowDownRight className="h-4 w-4 text-rose-400" />
                <span>Aplicación de Fondos (Egresos)</span>
              </button>

              {/* Solapa 3: Presupuesto vs Real & Desvíos */}
              <button
                id="tab-desvios-btn"
                onClick={() => setActiveTab('desvios')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                  activeTab === 'desvios'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Scale className="h-4 w-4 text-amber-400" />
                <span>Presupuesto vs. Real (Desvíos)</span>
              </button>

              {/* Solapa 4: Consolidado Macro (Oculto para comitente) */}
              {!isComitente && (
                <button
                  id="tab-macro-btn"
                  onClick={() => {
                    setActiveTab('macro');
                    setSelectedProjectId('macro');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                    activeTab === 'macro'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Layers className="h-4 w-4 text-blue-400" />
                  <span>Consolidado Macro</span>
                </button>
              )}

              {/* Solapa 5: Plan de Cuentas / Back (Oculto para comitente) */}
              {canViewPlanDeCuentas && (
                <button
                  id="tab-cuentas-btn"
                  onClick={() => setActiveTab('cuentas')}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                    activeTab === 'cuentas'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <FolderTree className="h-4 w-4 text-purple-400" />
                  <span>Plan de Cuentas & Back</span>
                </button>
              )}

              {/* Solapa 6: Gestión de Usuarios y Permisos (Super Admin & Director) */}
              {canManageUsers && (
                <button
                  id="tab-usuarios-btn"
                  onClick={() => setActiveTab('usuarios')}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                    activeTab === 'usuarios'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                      : 'text-amber-400 hover:text-amber-300 hover:bg-slate-800/60'
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Permisos & Usuarios</span>
                </button>
              )}
            </div>

            {/* Right Tools: Reset & Template */}
            <div className="flex items-center gap-1.5 min-w-max">
              <button
                onClick={downloadExcelTemplate}
                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition text-xs flex items-center gap-1"
                title="Descargar Plantilla Excel"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                <span className="hidden lg:inline">Plantilla</span>
              </button>

              {isSuperAdmin && (
                <button
                  onClick={handleResetData}
                  className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition text-xs flex items-center gap-1"
                  title="Restaurar datos de ejemplo"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline">Restaurar Ejemplo</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'ingresos' && (
          <IncomesTab
            transactions={currentProjectTransactions}
            projects={visibleProjects}
            categories={categories}
            currency={currency}
            onNewIncome={() => handleOpenNewTransaction('ingreso')}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            selectedProjectId={selectedProjectId}
          />
        )}

        {activeTab === 'egresos' && (
          <ExpensesTab
            transactions={currentProjectTransactions}
            projects={visibleProjects}
            categories={categories}
            currency={currency}
            onNewExpense={() => handleOpenNewTransaction('egreso')}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            selectedProjectId={selectedProjectId}
          />
        )}

        {activeTab === 'desvios' && (
          <BudgetDeviationsTab
            projects={visibleProjects}
            selectedProjectId={selectedProjectId}
            categories={categories}
            budgets={budgets}
            transactions={transactions}
            currency={currency}
            onUpdateBudget={handleUpdateBudget}
          />
        )}

        {activeTab === 'macro' && !isComitente && (
          <MacroOverview
            projects={visibleProjects}
            categories={categories}
            budgets={budgets}
            transactions={transactions}
            currency={currency}
            onSelectProject={(id) => {
              setSelectedProjectId(id);
              setActiveTab('egresos');
            }}
            onNewProject={() => handleOpenProjectModal()}
            onEditProject={handleOpenProjectModal}
            onDeleteProject={handleDeleteProject}
          />
        )}

        {activeTab === 'cuentas' && canViewPlanDeCuentas && (
          <AccountsAdminTab
            categories={categories}
            projects={visibleProjects}
            onAddCategory={handleAddCategory}
            onAddBatchCategories={handleAddBatchCategories}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
            onAddProject={handleAddProject}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
            onOpenProjectModal={handleOpenProjectModal}
          />
        )}

        {activeTab === 'usuarios' && canManageUsers && (
          <UsersAdminTab projects={projects} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 bg-slate-950 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <JpbSrlLogo variant="compact" />
            <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            <span className="text-slate-400 font-medium hidden sm:inline">
              Control Financiero de Obras y Liquidaciones Bimonetarias ($ / u$s)
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsManualOpen(true)}
              className="text-rose-400 hover:text-rose-300 font-semibold underline underline-offset-2 flex items-center gap-1 transition"
            >
              <span>📘 Abrir Manual de Usuario</span>
            </button>
            <span className="text-slate-700">•</span>
            <span className="text-slate-500">
              {visibleProjects.length} Obras • {categories.length} Rubros • {transactions.length} Registros
            </span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* User Manual Modal */}
      <UserManualModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
      />

      {/* Backup Modal */}
      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
      />

      {/* Transaction Modal (New / Edit) */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSave={handleSaveTransaction}
        initialType={modalTransactionType}
        editingTransaction={editingTransaction}
        projects={visibleProjects}
        categories={categories}
        defaultProjectId={selectedProjectId}
      />

      {/* Currency Converter Modal */}
      <CurrencyConverterModal
        isOpen={isConverterOpen}
        onClose={() => setIsConverterOpen(false)}
        initialRate={visibleProjects.find(p => p.id === selectedProjectId)?.defaultExchangeRate || 180.0}
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        projects={visibleProjects}
        categories={categories}
        defaultProjectId={selectedProjectId}
        onImportSuccess={handleImportSuccess}
      />

      {/* Project Modal (New / Edit) */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
        editingProject={editingProject}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainDashboard />
    </AuthProvider>
  );
}
