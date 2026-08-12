import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Search, 
  Building2, 
  Mail, 
  Lock, 
  Sparkles,
  Info,
  Check,
  X,
  Shield,
  FileSpreadsheet,
  Download,
  RefreshCw,
  PackageCheck,
  PlusCircle,
  Edit3,
  Filter,
  Layers,
  History,
  Activity
} from 'lucide-react';
import { AppUser, UserRole, ApprovalRequest, InventoryItem, AuditTrailEvent, AuditCategory } from '../types';

interface UserManagementViewProps {
  users: AppUser[];
  currentUser: AppUser;
  approvalRequests: ApprovalRequest[];
  auditLogs: AuditTrailEvent[];
  onAddUser: (user: Omit<AppUser, 'id' | 'createdAt'>) => void;
  onUpdateUserRole: (userId: string, newRole: UserRole) => void;
  onToggleUserStatus: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string, adminNote?: string) => void;
  inventoryItems: InventoryItem[];
  onExportAuditLogs: () => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  currentUser,
  approvalRequests,
  auditLogs,
  onAddUser,
  onUpdateUserRole,
  onToggleUserStatus,
  onDeleteUser,
  onApproveRequest,
  onRejectRequest,
  inventoryItems,
  onExportAuditLogs,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'approvals' | 'audit'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Audit filters state
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<'ALL' | AuditCategory>('ALL');
  const [auditActorFilter, setAuditActorFilter] = useState<string>('ALL');
  const [auditSearch, setAuditSearch] = useState<string>('');

  // New user form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('USER');
  const [newDepartment, setNewDepartment] = useState('Warehouse & Operations');

  const isAdmin = currentUser?.role === 'ADMIN';

  // Stats
  const safeUsers = users || [];
  const safeApprovals = approvalRequests || [];
  const safeAuditLogs = auditLogs || [];

  const adminCount = safeUsers.filter((u) => u.role === 'ADMIN').length;
  const staffCount = safeUsers.filter((u) => u.role === 'USER').length;
  const pendingRequestsCount = safeApprovals.filter((r) => r.status === 'PENDING').length;

  // Filtered users
  const filteredUsers = safeUsers.filter((u) =>
    (u.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
    (u.email || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
    (u.department || '').toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  // Filtered audit logs
  const filteredAuditLogs = safeAuditLogs.filter((log) => {
    const matchesCategory = auditCategoryFilter === 'ALL' || log.category === auditCategoryFilter;
    const matchesActor = auditActorFilter === 'ALL' || log.actorId === auditActorFilter;
    const query = (auditSearch || '').toLowerCase();
    const matchesSearch =
      !query ||
      (log.action || '').toLowerCase().includes(query) ||
      (log.actorName || '').toLowerCase().includes(query) ||
      (log.targetEntity || '').toLowerCase().includes(query) ||
      (log.details || '').toLowerCase().includes(query);

    return matchesCategory && matchesActor && matchesSearch;
  });

  // Audit counts
  const stockUpdateLogsCount = safeAuditLogs.filter((l) => l.category === 'STOCK_UPDATE').length;
  const approvalLogsCount = safeAuditLogs.filter((l) => l.category === 'APPROVAL').length;
  const userLogsCount = safeAuditLogs.filter((l) => l.category === 'USER_MANAGEMENT').length;
  const itemLogsCount = safeAuditLogs.filter((l) => l.category === 'ITEM_MANAGEMENT').length;

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const bgColors = ['bg-indigo-600', 'bg-emerald-600', 'bg-amber-600', 'bg-purple-600', 'bg-rose-600'];
    const randomBg = bgColors[Math.floor(Math.random() * bgColors.length)];

    onAddUser({
      name: newName.trim(),
      email: newEmail.trim(),
      role: newRole,
      department: newDepartment.trim(),
      status: 'ACTIVE',
      avatarBg: randomBg,
    });

    setNewName('');
    setNewEmail('');
    setNewRole('USER');
    setIsAddUserModalOpen(false);
  };

  return (
    <div className="space-y-6 mb-10">
      {/* Top Banner & Summary Stats */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-950/60 rounded-2xl text-indigo-600 dark:text-indigo-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  User Roles & Approval Control Center
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Role-Based Access
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage system users, assign roles (Admin vs Limited Staff), and review SKU addition/deletion approval requests.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => setIsAddUserModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                <UserPlus className="h-4 w-4" />
                <span>Create New User</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <div className="text-[11px] font-medium text-slate-500">Total Registered Users</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              {users.length}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <div className="text-[11px] font-medium text-slate-500">Admins (Full Access)</div>
            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {adminCount}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <div className="text-[11px] font-medium text-slate-500">Staff Users (Approval Reqd)</div>
            <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
              {staffCount}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <div className="text-[11px] font-medium text-slate-500">Pending SKU Approvals</div>
            <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1.5">
              <span>{pendingRequestsCount}</span>
              {pendingRequestsCount > 0 && (
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>User Directory ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors relative whitespace-nowrap ${
              activeTab === 'approvals'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Approval Queue</span>
            {pendingRequestsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950">
                {pendingRequestsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors relative whitespace-nowrap ${
              activeTab === 'audit'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Shield className="h-4 w-4 text-purple-200" />
            <span>System Audit Trail ({auditLogs.length})</span>
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search user name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>

      {/* TAB 1: User Directory Table */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Role & Access Level</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Added On</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No users match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelf = u.id === currentUser.id;
                    const initials = u.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase();

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        {/* User info */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-xl ${u.avatarBg} text-white font-bold flex items-center justify-center text-xs shadow-2xs`}>
                              {initials}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                          {u.department}
                        </td>

                        {/* Role badge & toggle */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {u.role === 'ADMIN' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Admin (Full Access)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                <UserCheck className="h-3.5 w-3.5" />
                                Staff User (Approval Required)
                              </span>
                            )}

                            {isAdmin && !isSelf && (
                              <button
                                onClick={() =>
                                  onUpdateUserRole(
                                    u.id,
                                    u.role === 'ADMIN' ? 'USER' : 'ADMIN'
                                  )
                                }
                                className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold ml-1"
                                title="Switch role between Admin and Staff User"
                              >
                                Change Role
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>

                        {/* Added Date */}
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {u.createdAt}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          {isAdmin ? (
                            <div className="flex items-center justify-end gap-2">
                              {!isSelf && (
                                <button
                                  onClick={() => onToggleUserStatus(u.id)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300"
                                >
                                  {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                                </button>
                              )}

                              {!isSelf ? (
                                <button
                                  onClick={() => setDeletingUserId(u.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                  title="Delete User"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">Protected</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">View Only</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Pending Approval Queue */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl flex items-start gap-3">
            <Info className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-900 dark:text-indigo-200">
              <span className="font-bold">Workflow Rule:</span> Staff users with limited access can create or request item deletions, but the final addition or deletion to the live inventory table requires final confirmation by an <strong>Admin</strong>.
            </div>
          </div>

          {approvalRequests.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                No Pending Approvals
              </div>
              <p className="text-xs text-slate-500 mt-1">
                All inventory addition and deletion requests have been processed.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {approvalRequests.map((req) => {
                const isAdd = req.type === 'ADD_ITEM';
                const isDelete = req.type === 'DELETE_ITEM';
                const isPending = req.status === 'PENDING';

                return (
                  <div
                    key={req.id}
                    className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-2xs transition-all ${
                      isPending
                        ? 'border-amber-300 dark:border-amber-800/80'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase ${
                            isAdd
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {isAdd ? 'Request: Add New SKU' : 'Request: Delete SKU'}
                        </span>

                        <span className="text-xs font-medium text-slate-500">
                          Requested by <strong className="text-slate-900 dark:text-white">{req.requestedByUserName}</strong>
                        </span>

                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(req.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            req.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : req.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                    </div>

                    {/* Request Details */}
                    <div className="py-3 flex flex-col md:flex-row justify-between gap-4 text-xs">
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                          {req.itemData.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          SKU: {req.itemData.sku} | Category: {req.itemData.category || 'N/A'}
                        </div>
                        {req.itemData.notes && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 italic bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                            "{req.itemData.notes}"
                          </p>
                        )}
                      </div>

                      {isAdd && (
                        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                          <div>
                            <div className="text-[10px] text-slate-400">Initial Stock</div>
                            <div className="font-extrabold text-slate-900 dark:text-white">
                              {req.itemData.quantity} units
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">Unit Cost</div>
                            <div className="font-extrabold text-slate-900 dark:text-white">
                              ₹{req.itemData.unitCost?.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">Retail Price</div>
                            <div className="font-extrabold text-emerald-600 dark:text-emerald-400">
                              ₹{req.itemData.retailPrice?.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      )}

                      {isDelete && (
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shrink-0">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span className="text-[11px]">Deletion will remove this SKU permanently from live inventory.</span>
                        </div>
                      )}
                    </div>

                    {/* Admin Action Bar */}
                    {isPending && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                        {isAdmin ? (
                          <>
                            <button
                              onClick={() => onRejectRequest(req.id, 'Rejected by admin.')}
                              className="px-3.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 text-xs font-bold transition-colors"
                            >
                              Reject Request
                            </button>
                            <button
                              onClick={() => onApproveRequest(req.id)}
                              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Approve & Finalize SKU</span>
                            </button>
                          </>
                        ) : (
                          <div className="text-xs text-amber-600 font-semibold italic flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 animate-spin" />
                            Awaiting Admin Review & Approval
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Audit Trail Log Explorer */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Audit Header & CSV Export */}
          <div className="p-5 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-purple-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    System Operations Audit Trail
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    Compliance & Security Log
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Immutable record tracking stock quantity updates, approval workflows (approved by / requested by), SKU additions/deletions, and user role creation/modifications.
                </p>
              </div>
            </div>

            <button
              onClick={onExportAuditLogs}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all shrink-0"
            >
              <Download className="h-4 w-4" />
              <span>Export Audit Trail CSV</span>
            </button>
          </div>

          {/* Audit Stats Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Audit Events</div>
              <div className="text-lg font-black text-slate-900 dark:text-white mt-1">{auditLogs.length}</div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stock Updates</div>
              <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1">{stockUpdateLogsCount}</div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approval Events</div>
              <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1">{approvalLogsCount}</div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">User Admin Events</div>
              <div className="text-lg font-black text-purple-600 dark:text-purple-400 mt-1">{userLogsCount}</div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                <button
                  onClick={() => setAuditCategoryFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    auditCategoryFilter === 'ALL'
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  All ({auditLogs.length})
                </button>

                <button
                  onClick={() => setAuditCategoryFilter('STOCK_UPDATE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    auditCategoryFilter === 'STOCK_UPDATE'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  Stock Updates ({stockUpdateLogsCount})
                </button>

                <button
                  onClick={() => setAuditCategoryFilter('APPROVAL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    auditCategoryFilter === 'APPROVAL'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  Approvals ({approvalLogsCount})
                </button>

                <button
                  onClick={() => setAuditCategoryFilter('ITEM_MANAGEMENT')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    auditCategoryFilter === 'ITEM_MANAGEMENT'
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  SKU Created/Mods ({itemLogsCount})
                </button>

                <button
                  onClick={() => setAuditCategoryFilter('USER_MANAGEMENT')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    auditCategoryFilter === 'USER_MANAGEMENT'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  User Admin ({userLogsCount})
                </button>
              </div>

              {/* Actor Filter Dropdown & Search Input */}
              <div className="flex items-center gap-2">
                <select
                  value={auditActorFilter}
                  onChange={(e) => setAuditActorFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="ALL">All Users / System</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>

                <div className="relative w-48 sm:w-60">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search audit trail..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Audit Logs Stream List */}
          <div className="space-y-3">
            {filteredAuditLogs.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <Shield className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  No Audit Trail Events Found
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Try adjusting your filter category or search query.
                </p>
              </div>
            ) : (
              filteredAuditLogs.map((log) => {
                let badgeStyle = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
                let CategoryIcon = History;

                if (log.category === 'STOCK_UPDATE') {
                  badgeStyle = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
                  CategoryIcon = RefreshCw;
                } else if (log.category === 'APPROVAL') {
                  badgeStyle = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800';
                  CategoryIcon = ShieldCheck;
                } else if (log.category === 'ITEM_MANAGEMENT') {
                  badgeStyle = 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-200 dark:border-teal-800';
                  CategoryIcon = PackageCheck;
                } else if (log.category === 'USER_MANAGEMENT') {
                  badgeStyle = 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800';
                  CategoryIcon = Users;
                }

                return (
                  <div
                    key={log.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs hover:border-purple-300 dark:hover:border-purple-800 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase flex items-center gap-1.5 border ${badgeStyle}`}>
                          <CategoryIcon className="h-3.5 w-3.5" />
                          <span>{log.action}</span>
                        </span>

                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                          {log.targetEntity}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Actor & Details */}
                    <div className="pt-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-medium">Performed By:</span>
                          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                            {log.actorName}
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                              log.actorRole === 'ADMIN'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            }`}>
                              {log.actorRole === 'ADMIN' ? 'Admin' : 'Staff User'}
                            </span>
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                          {log.details}
                        </p>
                      </div>

                      <div className="text-[10px] font-mono text-slate-400 text-right shrink-0">
                        <div>Log ID: {log.id}</div>
                        {log.ipAddress && <div>IP: {log.ipAddress}</div>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* CREATE NEW USER MODAL */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-lg">
                  <UserPlus className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Create New System User
                </h2>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Mehta"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. vikram@inventorybrief.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  placeholder="e.g. Warehouse Operations"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Role & Permissions *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole('USER')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      newRole === 'USER'
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="font-bold text-xs">Staff User (Limited)</div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Can view stock & restock. Item creation/deletion requires Admin approval.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRole('ADMIN')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      newRole === 'ADMIN'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="font-bold text-xs">Admin (Full Access)</div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Full control. Direct item creation, deletion, user management & approval powers.
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deletingUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-100 dark:bg-rose-950 rounded-xl">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Confirm User Deletion
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to delete this user from the system? They will lose all access to Inventory Brief.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingUserId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteUser(deletingUserId);
                  setDeletingUserId(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
