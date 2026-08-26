import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Trash2, 
  Search,
  Lock,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { UserProfile, UserRole, UserStatus, Project } from '../types';
import { useAuth, SUPERADMIN_EMAIL } from '../contexts/AuthContext';
import { 
  subscribeToUsers, 
  updateUserProfileInFirestore, 
  deleteUserFromFirestore 
} from '../services/firestoreService';

interface UsersAdminTabProps {
  projects: Project[];
}

export const UsersAdminTab: React.FC<UsersAdminTabProps> = ({ projects }) => {
  const { userProfile, isSuperAdmin, isDirector } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'active' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserToEdit, setSelectedUserToEdit] = useState<UserProfile | null>(null);

  // Modal assign projects for comitentes
  const [assignedProjects, setAssignedProjects] = useState<string[]>([]);
  const [assignedRole, setAssignedRole] = useState<UserRole>('administrativo');

  useEffect(() => {
    const unsub = subscribeToUsers((cloudUsers) => {
      setUsers(cloudUsers);
    });
    return () => unsub();
  }, []);

  const handleApprove = async (user: UserProfile, newRole?: UserRole) => {
    try {
      const roleToSet = newRole || user.role;
      // Director cannot approve as superadmin or director
      if (!isSuperAdmin && (roleToSet === 'superadmin' || roleToSet === 'director')) {
        alert('Solo el Super Administrador puede asignar o aprobar Directores.');
        return;
      }

      await updateUserProfileInFirestore(user.uid, {
        status: 'active',
        role: roleToSet,
        approvedAt: new Date().toISOString(),
        approvedBy: userProfile?.email || 'admin',
      });
    } catch (err) {
      console.error('Error approving user:', err);
      alert('Error al aprobar el usuario.');
    }
  };

  const handleReject = async (user: UserProfile) => {
    if (confirm(`¿Deseas rechazar o revocar el acceso a ${user.email}?`)) {
      try {
        await updateUserProfileInFirestore(user.uid, {
          status: 'rejected',
        });
      } catch (err) {
        console.error('Error rejecting user:', err);
      }
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (user.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()) {
      alert('No se puede eliminar la cuenta del Super Administrador.');
      return;
    }
    if (confirm(`¿Eliminar definitivamente el registro de ${user.email}?`)) {
      try {
        await deleteUserFromFirestore(user.uid);
      } catch (err) {
        console.error('Error deleting user:', err);
      }
    }
  };

  const handleSaveUserConfig = async () => {
    if (!selectedUserToEdit) return;

    if (!isSuperAdmin && (assignedRole === 'superadmin' || assignedRole === 'director')) {
      alert('Solo el Super Administrador puede asignar roles directivos.');
      return;
    }

    try {
      await updateUserProfileInFirestore(selectedUserToEdit.uid, {
        role: assignedRole,
        assignedProjectIds: assignedRole === 'comitente' ? assignedProjects : [],
      });
      setSelectedUserToEdit(null);
    } catch (err) {
      console.error('Error updating user config:', err);
      alert('Error al guardar la configuración del usuario.');
    }
  };

  const openConfigModal = (u: UserProfile) => {
    setSelectedUserToEdit(u);
    setAssignedRole(u.role);
    setAssignedProjects(u.assignedProjectIds || []);
  };

  const toggleProjectAssignment = (projId: string) => {
    setAssignedProjects((prev) =>
      prev.includes(projId) ? prev.filter((id) => id !== projId) : [...prev, projId]
    );
  };

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    const matchStatus = filterStatus === 'all' || u.status === filterStatus;
    const matchSearch =
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.displayName && u.displayName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const pendingCount = users.filter((u) => u.status === 'pending').length;
  const activeCount = users.filter((u) => u.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Users className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <span>Administración de Usuarios y Permisos</span>
              {isSuperAdmin && (
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-500/30 font-bold flex items-center gap-1">
                  👑 Super Administrador Maestro
                </span>
              )}
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Panel de control de accesos. Como Super Administrador ({SUPERADMIN_EMAIL}), puedes aprobar usuarios, designar <strong className="text-blue-300">Directores de Obra</strong>, asignar comitentes y gestionar permisos.
          </p>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-semibold text-amber-300">
              {pendingCount} Pendientes
            </span>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-300">
              {activeCount} Activos
            </span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800'
            }`}
          >
            Todos ({users.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              filterStatus === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-amber-400 hover:text-amber-300 bg-slate-800'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Pendientes ({pendingCount})</span>
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filterStatus === 'active'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-emerald-400 hover:text-emerald-300 bg-slate-800'
            }`}
          >
            Activos ({activeCount})
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por email o nombre..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Rol en el Sistema</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Obras Asignadas</th>
                <th className="py-3 px-4">Fecha Solicitud</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No se encontraron usuarios en esta categoría.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSuper = u.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase();
                  return (
                    <tr key={u.uid} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{u.displayName || 'Sin nombre'}</div>
                        <div className="text-slate-400 font-mono text-[11px]">{u.email}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider border ${
                            u.role === 'superadmin'
                              ? 'bg-purple-950/60 text-purple-300 border-purple-800'
                              : u.role === 'director'
                              ? 'bg-blue-950/60 text-blue-300 border-blue-800'
                              : u.role === 'administrativo'
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                              : 'bg-amber-950/60 text-amber-300 border-amber-800'
                          }`}
                        >
                          {u.role === 'superadmin'
                            ? '👑 Super Administrador'
                            : u.role === 'director'
                            ? '🏗️ Director de Obra'
                            : u.role === 'administrativo'
                            ? '💼 Administrativo'
                            : '🏢 Comitente (Solo Lectura)'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {u.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            Activo
                          </span>
                        ) : u.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1.5 text-amber-400 font-bold text-xs bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            <Clock className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                            Pendiente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-rose-400 font-semibold text-xs">
                            <UserX className="h-4 w-4 text-rose-400" />
                            Rechazado
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {u.role === 'comitente' ? (
                          u.assignedProjectIds && u.assignedProjectIds.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {u.assignedProjectIds.map((pid) => {
                                const proj = projects.find((p) => p.id === pid);
                                return (
                                  <span
                                    key={pid}
                                    className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-[10px]"
                                  >
                                    🏗️ {proj ? proj.name : pid}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-amber-400/80 italic text-[11px]">
                              Todas las obras (o sin asignar)
                            </span>
                          )
                        ) : (
                          <span className="text-slate-500 text-[11px]">Acceso a todas las obras</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-AR') : '-'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {u.status === 'pending' && (
                            <button
                              onClick={() => handleApprove(u)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1"
                              title="Aprobar acceso inmediatamente"
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              <span>Aprobar</span>
                            </button>
                          )}

                          <button
                            onClick={() => openConfigModal(u)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs transition cursor-pointer border border-slate-700"
                            title="Cambiar Rol y Asignación de Obras"
                          >
                            Editar Rol
                          </button>

                          {u.status === 'active' && !isSuper && (
                            <button
                              onClick={() => handleReject(u)}
                              className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition"
                              title="Revocar acceso"
                            >
                              <UserX className="h-4 w-4" />
                            </button>
                          )}

                          {!isSuper && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                              title="Eliminar registro"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Role & Assign Projects Modal */}
      {selectedUserToEdit && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-base">
                  Configurar Permisos de Usuario
                </h3>
                <p className="text-xs text-slate-400">{selectedUserToEdit.email}</p>
              </div>
              <button
                onClick={() => setSelectedUserToEdit(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Rol del Usuario
              </label>
              <select
                value={assignedRole}
                onChange={(e) => setAssignedRole(e.target.value as UserRole)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              >
                {isSuperAdmin && (
                  <option value="director">🏗️ Director de Obra (Gestión completa, aprobación de gastos y control)</option>
                )}
                <option value="administrativo">💼 Administrativo (Carga de comprobantes, ingresos y egresos)</option>
                <option value="comitente">🏢 Comitente / Cliente (Solo Lectura de sus obras asignadas)</option>
              </select>
            </div>

            {assignedRole === 'comitente' && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block text-xs font-semibold text-slate-300">
                  Obras autorizadas para este Comitente:
                </label>
                <p className="text-[11px] text-slate-500">
                  Selecciona una o más obras a las que tendrá acceso en modo solo lectura.
                </p>
                <div className="max-h-48 overflow-y-auto space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {projects.map((p) => {
                    const isChecked = assignedProjects.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-900 cursor-pointer text-xs text-slate-200"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleProjectAssignment(p.id)}
                          className="rounded border-slate-700 text-amber-500 focus:ring-amber-400"
                        />
                        <div className="flex-1">
                          <span className="font-semibold">{p.name}</span>
                          <span className="text-slate-500 ml-1.5 text-[11px]">({p.code})</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedUserToEdit(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveUserConfig}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition shadow cursor-pointer"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
