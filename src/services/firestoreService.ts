import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  query,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Project, AccountCategory, Transaction, BudgetEstimate } from '../types';
import {
  INITIAL_PROJECTS,
  INITIAL_CATEGORIES,
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
} from '../data/initialData';

const COLLECTIONS = {
  PROJECTS: 'projects',
  CATEGORIES: 'categories',
  TRANSACTIONS: 'transactions',
  BUDGETS: 'budgets',
  USERS: 'users',
};

// Seed initial data to Firestore if database is fresh/empty or missing contractor categories
export async function initializeFirestoreData(): Promise<void> {
  try {
    const projectsSnap = await getDocs(query(collection(db, COLLECTIONS.PROJECTS), limit(1)));
    if (projectsSnap.empty) {
      console.log('Fresh Firestore detected. Seeding initial Grupo SimetriS data...');

      // Seed Projects
      const projectBatch = writeBatch(db);
      INITIAL_PROJECTS.forEach((p) => {
        projectBatch.set(doc(db, COLLECTIONS.PROJECTS, p.id), p);
      });
      await projectBatch.commit();

      // Seed Categories
      const categoryBatch = writeBatch(db);
      INITIAL_CATEGORIES.forEach((c) => {
        categoryBatch.set(doc(db, COLLECTIONS.CATEGORIES, c.id), c);
      });
      await categoryBatch.commit();

      // Seed Budgets
      const budgetBatch = writeBatch(db);
      INITIAL_BUDGETS.forEach((b) => {
        budgetBatch.set(doc(db, COLLECTIONS.BUDGETS, b.id), b);
      });
      await budgetBatch.commit();

      // Seed Transactions in chunks (due to Firestore 500 limit per batch)
      const chunkSize = 250;
      for (let i = 0; i < INITIAL_TRANSACTIONS.length; i += chunkSize) {
        const chunk = INITIAL_TRANSACTIONS.slice(i, i + chunkSize);
        const txBatch = writeBatch(db);
        chunk.forEach((tx) => {
          txBatch.set(doc(db, COLLECTIONS.TRANSACTIONS, tx.id), tx);
        });
        await txBatch.commit();
      }

      console.log('Initial Firestore seeding complete!');
      return;
    }

    // Database already exists: verify if projects are missing (e.g. JPB SRL) or need initial budget update
    const projectSnaps = await getDocs(collection(db, COLLECTIONS.PROJECTS));
    const existingProjectIds = new Set<string>();
    const projBatch = writeBatch(db);
    let hasProjUpdates = false;

    projectSnaps.forEach((d) => {
      existingProjectIds.add(d.id);
      const data = d.data() as Project;
      // Ensure JPB SRL budget is 0 as requested
      if (d.id === 'proj-jpb-srl' && (data.budgetARS > 0 || data.budgetUSD > 0)) {
        projBatch.update(doc(db, COLLECTIONS.PROJECTS, d.id), {
          budgetARS: 0,
          budgetUSD: 0,
        });
        hasProjUpdates = true;
      }
    });

    const missingProjects = INITIAL_PROJECTS.filter((p) => !existingProjectIds.has(p.id));
    if (missingProjects.length > 0) {
      console.log(`Syncing ${missingProjects.length} new projects to Firestore...`);
      missingProjects.forEach((p) => {
        projBatch.set(doc(db, COLLECTIONS.PROJECTS, p.id), p);
      });
      hasProjUpdates = true;
    }

    if (hasProjUpdates) {
      await projBatch.commit();
    }

    // verify if contractor cost centers are present, if not, add them seamlessly
    const catSnaps = await getDocs(collection(db, COLLECTIONS.CATEGORIES));
    const existingCatIds = new Set<string>();
    catSnaps.forEach((d) => existingCatIds.add(d.id));

    const missingCategories = INITIAL_CATEGORIES.filter((c) => !existingCatIds.has(c.id));
    if (missingCategories.length > 0) {
      console.log(`Syncing ${missingCategories.length} new contractor cost centers to Firestore...`);
      const syncBatch = writeBatch(db);
      missingCategories.forEach((c) => {
        syncBatch.set(doc(db, COLLECTIONS.CATEGORIES, c.id), c);
      });
      await syncBatch.commit();
    }

    // Check missing contractor budgets
    const budgetSnaps = await getDocs(collection(db, COLLECTIONS.BUDGETS));
    const existingBudgetIds = new Set<string>();
    budgetSnaps.forEach((d) => existingBudgetIds.add(d.id));

    const missingBudgets = INITIAL_BUDGETS.filter((b) => !existingBudgetIds.has(b.id));
    if (missingBudgets.length > 0) {
      console.log(`Syncing ${missingBudgets.length} contractor budget items to Firestore...`);
      const budgetSyncBatch = writeBatch(db);
      missingBudgets.forEach((b) => {
        budgetSyncBatch.set(doc(db, COLLECTIONS.BUDGETS, b.id), b);
      });
      await budgetSyncBatch.commit();
    }

    // Ensure Master Superadmin profile and auth account exists for fernandoj.laso@gmail.com
    const superEmail = 'fernandoj.laso@gmail.com';
    const superUid = 'superadmin_master_' + superEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const superUserRef = doc(db, 'users', superUid);
    const superUserSnap = await getDoc(superUserRef);

    if (!superUserSnap.exists()) {
      await setDoc(superUserRef, {
        uid: superUid,
        email: superEmail,
        displayName: 'Fernando Laso',
        role: 'superadmin',
        status: 'active',
        createdAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
        approvedBy: 'system',
        assignedProjectIds: [],
      });
    } else {
      const uData = superUserSnap.data();
      if (uData.role !== 'superadmin' || uData.status !== 'active') {
        await updateDoc(superUserRef, {
          role: 'superadmin',
          status: 'active',
        });
      }
    }

    // Provision secure auth account doc in Firestore with SHA-256 hash
    const accountDocId = superEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const accountRef = doc(db, 'auth_accounts', accountDocId);
    const accountSnap = await getDoc(accountRef);
    
    // Compute hash for Afro1212* using standard web crypto
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode('Afro1212*_simetris_secure_salt_2026'));
    const passwordHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    if (!accountSnap.exists()) {
      await setDoc(accountRef, {
        uid: superUid,
        email: superEmail,
        name: 'Fernando Laso',
        passwordHash,
        createdAt: new Date().toISOString(),
      });
    } else {
      await updateDoc(accountRef, {
        passwordHash,
        uid: superUid,
      });
    }
  } catch (error) {
    console.error('Error during Firestore data seeding/syncing:', error);
  }
}

// --------------------------------------------------------------------------
// Real-time Subscriptions (onSnapshot)
// --------------------------------------------------------------------------

export function subscribeToProjects(callback: (projects: Project[]) => void) {
  const q = collection(db, COLLECTIONS.PROJECTS);
  return onSnapshot(q, (snapshot) => {
    const list: Project[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Project, 'id'>) });
    });
    callback(list);
  }, (error) => {
    console.error('Error in projects subscription:', error);
  });
}

export function subscribeToCategories(callback: (categories: AccountCategory[]) => void) {
  const q = collection(db, COLLECTIONS.CATEGORIES);
  return onSnapshot(q, (snapshot) => {
    const list: AccountCategory[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...(docSnap.data() as Omit<AccountCategory, 'id'>) });
    });
    callback(list);
  }, (error) => {
    console.error('Error in categories subscription:', error);
  });
}

export function subscribeToTransactions(callback: (transactions: Transaction[]) => void) {
  const q = collection(db, COLLECTIONS.TRANSACTIONS);
  return onSnapshot(q, (snapshot) => {
    const list: Transaction[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Transaction, 'id'>) });
    });
    callback(list);
  }, (error) => {
    console.error('Error in transactions subscription:', error);
  });
}

export function subscribeToBudgets(callback: (budgets: BudgetEstimate[]) => void) {
  const q = collection(db, COLLECTIONS.BUDGETS);
  return onSnapshot(q, (snapshot) => {
    const list: BudgetEstimate[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...(docSnap.data() as Omit<BudgetEstimate, 'id'>) });
    });
    callback(list);
  }, (error) => {
    console.error('Error in budgets subscription:', error);
  });
}

// --------------------------------------------------------------------------
// CRUD Operations: Projects
// --------------------------------------------------------------------------

export async function saveProjectToFirestore(project: Project): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.PROJECTS, project.id), project, { merge: true });
}

export async function saveBatchProjectsToFirestore(projects: Project[]): Promise<void> {
  const chunkSize = 250;
  for (let i = 0; i < projects.length; i += chunkSize) {
    const chunk = projects.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((p) => {
      batch.set(doc(db, COLLECTIONS.PROJECTS, p.id), p, { merge: true });
    });
    await batch.commit();
  }
}

export async function updateProjectInFirestore(id: string, updates: Partial<Project>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.PROJECTS, id), updates);
}

export async function deleteProjectFromFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.PROJECTS, id));

  // Also clean up associated transactions and budgets
  try {
    const txSnap = await getDocs(collection(db, COLLECTIONS.TRANSACTIONS));
    const batch = writeBatch(db);
    let count = 0;
    txSnap.forEach((d) => {
      if (d.data().projectId === id) {
        batch.delete(d.ref);
        count++;
      }
    });

    const budgetSnap = await getDocs(collection(db, COLLECTIONS.BUDGETS));
    budgetSnap.forEach((d) => {
      if (d.data().projectId === id) {
        batch.delete(d.ref);
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
    }
  } catch (e) {
    console.warn('Cleanup of project sub-data error:', e);
  }
}

// --------------------------------------------------------------------------
// CRUD Operations: Categories
// --------------------------------------------------------------------------

export async function saveCategoryToFirestore(category: AccountCategory): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.CATEGORIES, category.id), category, { merge: true });
}

export async function saveBatchCategoriesToFirestore(categories: AccountCategory[]): Promise<void> {
  const chunkSize = 250;
  for (let i = 0; i < categories.length; i += chunkSize) {
    const chunk = categories.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((c) => {
      batch.set(doc(db, COLLECTIONS.CATEGORIES, c.id), c, { merge: true });
    });
    await batch.commit();
  }
}

export async function updateCategoryInFirestore(id: string, updates: Partial<AccountCategory>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.CATEGORIES, id), updates);
}

export async function deleteCategoryFromFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.CATEGORIES, id));
}

// --------------------------------------------------------------------------
// CRUD Operations: Transactions
// --------------------------------------------------------------------------

export async function saveTransactionToFirestore(transaction: Transaction): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.TRANSACTIONS, transaction.id), transaction, { merge: true });
}

export async function saveBatchTransactionsToFirestore(transactions: Transaction[]): Promise<void> {
  const chunkSize = 250;
  for (let i = 0; i < transactions.length; i += chunkSize) {
    const chunk = transactions.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((t) => {
      batch.set(doc(db, COLLECTIONS.TRANSACTIONS, t.id), t);
    });
    await batch.commit();
  }
}

export async function updateTransactionInFirestore(id: string, updates: Partial<Transaction>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.TRANSACTIONS, id), updates);
}

export async function deleteTransactionFromFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.TRANSACTIONS, id));
}

// --------------------------------------------------------------------------
// CRUD Operations: Budgets
// --------------------------------------------------------------------------

export async function saveBudgetToFirestore(budget: BudgetEstimate): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.BUDGETS, budget.id), budget, { merge: true });
}

// --------------------------------------------------------------------------
// User Management Subscriptions & Actions
// --------------------------------------------------------------------------

export function subscribeToUsers(callback: (users: any[]) => void) {
  const q = collection(db, COLLECTIONS.USERS);
  return onSnapshot(q, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ uid: docSnap.id, ...docSnap.data() });
    });
    callback(list);
  }, (error) => {
    console.error('Error in users subscription:', error);
  });
}

export async function updateUserProfileInFirestore(uid: string, updates: Record<string, any>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.USERS, uid), updates);
}

export async function deleteUserFromFirestore(uid: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.USERS, uid));
}

// --------------------------------------------------------------------------
// Complete Backup Export & Restore
// --------------------------------------------------------------------------

export async function fetchAllDataForBackup(): Promise<any> {
  const [projSnap, catSnap, budSnap, txSnap, userSnap] = await Promise.all([
    getDocs(collection(db, COLLECTIONS.PROJECTS)),
    getDocs(collection(db, COLLECTIONS.CATEGORIES)),
    getDocs(collection(db, COLLECTIONS.BUDGETS)),
    getDocs(collection(db, COLLECTIONS.TRANSACTIONS)),
    getDocs(collection(db, COLLECTIONS.USERS)),
  ]);

  const projects: any[] = [];
  projSnap.forEach((d) => projects.push({ id: d.id, ...d.data() }));

  const categories: any[] = [];
  catSnap.forEach((d) => categories.push({ id: d.id, ...d.data() }));

  const budgets: any[] = [];
  budSnap.forEach((d) => budgets.push({ id: d.id, ...d.data() }));

  const transactions: any[] = [];
  txSnap.forEach((d) => transactions.push({ id: d.id, ...d.data() }));

  const users: any[] = [];
  userSnap.forEach((d) => users.push({ uid: d.id, ...d.data() }));

  return {
    version: '2.5-jpbsrl',
    exportDate: new Date().toISOString(),
    projects,
    categories,
    budgets,
    transactions,
    users,
  };
}

export async function restoreCompleteBackup(backup: any): Promise<{ success: boolean; count: number }> {
  if (!backup || typeof backup !== 'object') {
    throw new Error('El archivo no contiene un formato de respaldo válido.');
  }

  if (!Array.isArray(backup.projects) && !Array.isArray(backup.transactions) && !Array.isArray(backup.categories)) {
    throw new Error('El archivo no contiene datos de obras, comprobantes o rubros para restaurar.');
  }

  let totalItems = 0;

  // 1. Projects
  if (Array.isArray(backup.projects)) {
    const chunkSize = 250;
    for (let i = 0; i < backup.projects.length; i += chunkSize) {
      const chunk = backup.projects.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((p: any) => {
        if (p && p.id) {
          batch.set(doc(db, COLLECTIONS.PROJECTS, p.id), p, { merge: true });
          totalItems++;
        }
      });
      await batch.commit();
    }
  }

  // 2. Categories
  if (Array.isArray(backup.categories)) {
    const chunkSize = 250;
    for (let i = 0; i < backup.categories.length; i += chunkSize) {
      const chunk = backup.categories.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((c: any) => {
        if (c && c.id) {
          batch.set(doc(db, COLLECTIONS.CATEGORIES, c.id), c, { merge: true });
          totalItems++;
        }
      });
      await batch.commit();
    }
  }

  // 3. Budgets
  if (Array.isArray(backup.budgets)) {
    const chunkSize = 250;
    for (let i = 0; i < backup.budgets.length; i += chunkSize) {
      const chunk = backup.budgets.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((b: any) => {
        if (b && b.id) {
          batch.set(doc(db, COLLECTIONS.BUDGETS, b.id), b, { merge: true });
          totalItems++;
        }
      });
      await batch.commit();
    }
  }

  // 4. Transactions in batches
  if (Array.isArray(backup.transactions)) {
    const chunkSize = 250;
    for (let i = 0; i < backup.transactions.length; i += chunkSize) {
      const chunk = backup.transactions.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((t: any) => {
        if (t && t.id) {
          // Normalize numbers
          const cleanT = {
            ...t,
            amountARS: typeof t.amountARS === 'number' ? t.amountARS : Number(t.amountARS) || 0,
            amountUSD: typeof t.amountUSD === 'number' ? t.amountUSD : Number(t.amountUSD) || 0,
            exchangeRate: typeof t.exchangeRate === 'number' ? t.exchangeRate : Number(t.exchangeRate) || 1,
          };
          batch.set(doc(db, COLLECTIONS.TRANSACTIONS, t.id), cleanT, { merge: true });
          totalItems++;
        }
      });
      await batch.commit();
    }
  }

  // 5. Users (if included, protect superadmin status)
  if (Array.isArray(backup.users)) {
    for (const u of backup.users) {
      if (u && (u.uid || u.id)) {
        const uid = u.uid || u.id;
        const isMaster = u.email === 'fernandoj.laso@gmail.com';
        const userDoc = {
          ...u,
          uid,
          role: isMaster ? 'superadmin' : u.role || 'administrativo',
          status: isMaster ? 'active' : u.status || 'pending',
        };
        await setDoc(doc(db, COLLECTIONS.USERS, uid), userDoc, { merge: true });
        totalItems++;
      }
    }
  }

  return { success: true, count: totalItems };
}
