import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AdminLayout } from '../../components/templates/AdminLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { EmptyState } from '../../components/molecules/EmptyState';
import { adminApi, referenceApi, requestsApi } from '../../api';
import type { User, Barangay, ServiceRequest } from '../../types';
import { maintenanceStore } from '../../services/maintenanceStore';
import { accountsStore } from '../../services/accountsStore';
import {
  IconSearch,
  IconPlus,
  IconChevronLeft,
  IconChevronRight,
  IconArrowDown,
  IconCheck,
  IconX,
  IconUsers,
  IconUserCheck,
  IconQrcode,
  IconTrash,
  IconPencil,
  IconAlertTriangle,
  IconReceipt,
  IconTool,
  IconKey,
  IconBan,
  IconRefresh,
  IconEye,
  IconEyeOff,
  IconCopy,
} from '@tabler/icons-react';
import { MeterTagModal } from '../../components/organisms/MeterTagModal';
import { SystemModal } from '../../components/molecules/SystemModal';

export function AdminUsersView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Role Tab: 'consumer' | 'staff' | 'admin' | 'all'
  const initialRole = (searchParams.get('role') as 'consumer' | 'staff' | 'admin' | 'all') || 'consumer';
  const initialVerification = (searchParams.get('verification') as 'all' | 'verified' | 'pending') || 'all';
  const [activeRole, setActiveRole] = useState<'consumer' | 'staff' | 'admin' | 'all'>(initialRole);

  // Data States
  const [customers, setCustomers] = useState<User[]>([]);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [tasks, setTasks] = useState<ServiceRequest[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'pending'>(initialVerification);
  const [selectedBarangay, setSelectedBarangay] = useState<string>('all');
  // Table Row Selection
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  // Pagination
  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  // Floating Toast Notification
  const [toast, setToast] = useState<{
    userName: string;
    message: string;
    undoAction?: () => void;
    viewAction?: () => void;
  } | null>(null);

  // Modal & Drawer States
  const [selectedCustomerForTag, setSelectedCustomerForTag] = useState<User | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState<User | null>(null);
  const [pendingMeterInput, setPendingMeterInput] = useState('');

  const handleOpenUserDetail = (user: User) => {
    setSelectedUserDetail(user);
    const mtr =
      user.customer_profile?.meter?.meter_number ||
      user.customer_profile?.meter_number ||
      '';
    setPendingMeterInput(mtr);
  };

  // Register Staff Modal State
  const generateStaffPassword = () => 'Staff' + Math.floor(1000 + Math.random() * 9000) + '!';
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffMobile, setNewStaffMobile] = useState('');
  const [newStaffBarangayId, setNewStaffBarangayId] = useState<number | ''>('');
  const [newStaffTempPassword, setNewStaffTempPassword] = useState('');
  const [showTempPassword, setShowTempPassword] = useState(true);
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);
  const [addStaffNotice, setAddStaffNotice] = useState<string | null>(null);
  const [staffCreatedSuccess, setStaffCreatedSuccess] = useState<{ user: User; tempPassword: string } | null>(null);
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  const handleOpenAddStaffModal = () => {
    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffMobile('');
    setNewStaffBarangayId('');
    setNewStaffTempPassword(generateStaffPassword());
    setShowTempPassword(true);
    setAddStaffNotice(null);
    setStaffCreatedSuccess(null);
    setCopiedCredentials(false);
    setShowAddStaffModal(true);
  };

  // Register Customer Modal State
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustMeter, setNewCustMeter] = useState('');
  const [newCustMobile, setNewCustMobile] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustBarangayId, setNewCustBarangayId] = useState<number | ''>('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustTempPassword, setNewCustTempPassword] = useState('');
  const [showCustTempPassword, setShowCustTempPassword] = useState(true);
  const [isSubmittingCust, setIsSubmittingCust] = useState(false);
  const [custCreatedSuccess, setCustCreatedSuccess] = useState<{ user: User; tempPassword: string } | null>(null);
  const [copiedCustCredentials, setCopiedCustCredentials] = useState(false);

  const handleOpenAddCustomerModal = () => {
    setNewCustName('');
    setNewCustMeter('');
    setNewCustMobile('');
    setNewCustEmail('');
    setNewCustBarangayId(barangays[0]?.id || 1);
    setNewCustAddress('');
    setNewCustTempPassword('Aqua' + Math.floor(1000 + Math.random() * 9000) + '!');
    setShowCustTempPassword(true);
    setCustCreatedSuccess(null);
    setCopiedCustCredentials(false);
    setShowAddCustomerModal(true);
  };

  // Update User Modal State
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBarangayId, setEditBarangayId] = useState<number | ''>('');
  const [editIsVerified, setEditIsVerified] = useState(false);
  const [editAvatar, setEditAvatar] = useState<string | null>(null);
  const [editPhotoError, setEditPhotoError] = useState<string | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete User Confirmation Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Bulk Delete Confirmation Modal State
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // System Modal for modern alerts, credentials display, and verifications
  const [systemModal, setSystemModal] = useState<{
    isOpen: boolean;
    type: 'info' | 'success' | 'warning' | 'error' | 'confirm' | 'credentials';
    title: string;
    message: string | React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void | Promise<void>;
    isDestructive?: boolean;
    credentials?: {
      userName: string;
      loginIdentifier: string;
      tempPassword?: string;
      meterNumber?: string;
      accountNumber?: string;
    };
    details?: { label: string; value: string }[];
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

  // Helper to reliably retrieve real user display name
  const getUserDisplayName = (user: User): string => {
    if (user.name && user.name.trim().length > 0 && user.name.toLowerCase() !== 'account user') {
      return user.name;
    }
    if (user.customer_profile) {
      const cp = user.customer_profile as { full_name?: string; first_name?: string; last_name?: string };
      if (cp.full_name && cp.full_name.trim().length > 0) {
        return cp.full_name;
      }
      const parts = [cp.first_name, cp.last_name].filter(Boolean);
      if (parts.length > 0) {
        return parts.join(' ');
      }
    }
    if (user.staff_profile) {
      const sp = user.staff_profile as { name?: string; first_name?: string; last_name?: string };
      if (sp.name && sp.name.trim().length > 0) {
        return sp.name;
      }
      const parts = [sp.first_name, sp.last_name].filter(Boolean);
      if (parts.length > 0) {
        return parts.join(' ');
      }
    }
    if ((user as { full_name?: string }).full_name && (user as { full_name?: string }).full_name!.trim().length > 0) {
      return (user as { full_name?: string }).full_name!;
    }
    if (user.email && user.email.includes('@')) {
      const emailPrefix = user.email.split('@')[0];
      const formatted = emailPrefix
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      if (formatted.trim().length > 0) return formatted;
    }
    if (user.customer_profile?.account_number) {
      return `Resident (${user.customer_profile.account_number})`;
    }
    return 'Resident';
  };

  // Admins dataset for unified directory
  const defaultAdmins = useMemo<User[]>(
    () => [
      {
        id: 1,
        name: 'SIWASS Administrator',
        email: 'admin@siwass.gov',
        role: 'admin',
        mobile_number: '09170000001',
        is_verified: true,
        status: 'active',
        must_change_password: false,
      },
    ],
    []
  );

  useEffect(() => {
    const roleParam = searchParams.get('role') as 'consumer' | 'staff' | 'admin' | 'all' | null;
    if (roleParam && ['consumer', 'staff', 'admin', 'all'].includes(roleParam)) {
      setActiveRole(roleParam);
    }
    const verParam = searchParams.get('verification') as 'all' | 'verified' | 'pending' | null;
    if (verParam && ['all', 'verified', 'pending'].includes(verParam)) {
      setVerificationFilter(verParam);
    }
  }, [searchParams]);


  const fetchData = async () => {
    setIsLoading(true);
    try {
      let apiCustomers: User[] | null = null;
      let apiStaff: User[] | null = null;

      try {
        const custRes = await adminApi.customersList({ per_page: 100 });
        if (custRes && Array.isArray(custRes.data)) {
          apiCustomers = custRes.data;
        }
      } catch {
        apiCustomers = null;
      }

      try {
        const staffRes = await adminApi.staffList();
        if (Array.isArray(staffRes)) {
          apiStaff = staffRes;
        }
      } catch {
        apiStaff = null;
      }

      const [bgRes, reqRes] = await Promise.all([
        referenceApi.getBarangays().catch(() => []),
        requestsApi.list({ per_page: 100 }).catch(() => ({ data: [] })),
      ]);

      const rawCustomers = apiCustomers !== null
        ? apiCustomers
        : accountsStore.getUsers().filter((u) => u.role === 'customer');

      const normalizedCustomers = rawCustomers.map((c: User) => ({
        ...c,
        is_verified: c.is_verified ?? (c.status === 'active'),
        verification_status: c.verification_status ?? (c.status === 'active' ? 'verified' : c.status),
      }));

      const rawStaff = apiStaff !== null
        ? apiStaff
        : accountsStore.getUsers().filter((u) => u.role === 'staff');

      setCustomers(normalizedCustomers);
      setStaffList(rawStaff);
      setBarangays(bgRes);
      if (reqRes && Array.isArray(reqRes.data)) {
        setTasks(reqRes.data);
      } else {
        setTasks(maintenanceStore.getRequests());
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate open tasks count per staff member
  const staffOpenTasksCount = useMemo(() => {
    const counts: Record<number, number> = {};
    tasks.forEach((t) => {
      if (t.assigned_staff_id && (t.status === 'assigned' || t.status === 'in_progress')) {
        counts[t.assigned_staff_id] = (counts[t.assigned_staff_id] || 0) + 1;
      }
    });
    return counts;
  }, [tasks]);

  // Combined Directory Filtering
  const filteredUsers = useMemo(() => {
    let sourceList: User[] = [];
    if (activeRole === 'all') {
      sourceList = [...defaultAdmins, ...staffList, ...customers];
    } else if (activeRole === 'consumer') {
      sourceList = customers;
    } else if (activeRole === 'staff') {
      sourceList = staffList;
    } else if (activeRole === 'admin') {
      sourceList = defaultAdmins;
    }

    return sourceList.filter((user) => {
      const isVerified = user.is_verified || user.status === 'active';
      // Status / Verification filter
      if (verificationFilter === 'verified') {
        if (user.role === 'customer' || (user.role as string) === 'consumer') {
          if (!isVerified) return false;
        }
      }
      if (verificationFilter === 'pending') {
        if (user.role === 'customer' || (user.role as string) === 'consumer') {
          if (isVerified) return false;
        } else {
          return false;
        }
      }

      // Barangay filter
      if (selectedBarangay !== 'all') {
        const custBg = user.customer_profile?.barangay?.name;
        const staffBg = user.staff_profile?.assigned_barangay?.name;
        const bg = custBg || staffBg;
        if (bg !== selectedBarangay) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const displayName = getUserDisplayName(user).toLowerCase();
        const name = (user.name || user.staff_profile?.name || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        const mobile = (user.mobile_number || '').toLowerCase();
        const acc = (user.customer_profile?.account_number || '').toLowerCase();
        const meter = (user.customer_profile?.meter?.meter_number || '').toLowerCase();
        const brgy = (
          user.customer_profile?.barangay?.name ||
          user.staff_profile?.assigned_barangay?.name ||
          ''
        ).toLowerCase();

        if (
          !displayName.includes(q) &&
          !name.includes(q) &&
          !email.includes(q) &&
          !mobile.includes(q) &&
          !acc.includes(q) &&
          !meter.includes(q) &&
          !brgy.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [activeRole, customers, staffList, defaultAdmins, verificationFilter, selectedBarangay, searchQuery]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  // Reset pagination on filter or role tab change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedUserIds([]);
  }, [activeRole, verificationFilter, selectedBarangay, searchQuery]);

  // Selection handlers
  const isAllCurrentSelected =
    paginatedUsers.length > 0 && paginatedUsers.every((u) => selectedUserIds.includes(u.id));

  const toggleSelectAll = () => {
    if (isAllCurrentSelected) {
      const pageIds = paginatedUsers.map((u) => u.id);
      setSelectedUserIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      const pageIds = paginatedUsers.map((u) => u.id);
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectUser = (id: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Add Customer Submit (Admin Direct Provisioning)
  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustMobile.trim() || !newCustMeter.trim() || !newCustAddress.trim()) return;

    setIsSubmittingCust(true);
    const tempPassword = newCustTempPassword.trim() || ('Aqua' + Math.floor(1000 + Math.random() * 9000) + '!');
    const selectedBg = barangays.find((b) => b.id === Number(newCustBarangayId)) || barangays[0] || { id: 1, name: 'Poblacion' };

    try {
      let createdUser: User;
      try {
        const res = await adminApi.createCustomer({
          name: newCustName.trim(),
          email: newCustEmail.trim() || undefined,
          mobile_number: newCustMobile.trim(),
          meter_number: newCustMeter.trim().toUpperCase(),
          barangay_id: Number(selectedBg.id),
          address: newCustAddress.trim(),
          temporary_password: tempPassword,
        });
        createdUser = res.user;
      } catch {
        // Fallback to accountsStore
        const storeRes = accountsStore.addCustomerByAdmin({
          name: newCustName.trim(),
          email: newCustEmail.trim() || undefined,
          mobileNumber: newCustMobile.trim(),
          meterNumber: newCustMeter.trim().toUpperCase(),
          barangayId: Number(selectedBg.id),
          barangayName: selectedBg.name,
          address: newCustAddress.trim(),
          temporaryPassword: tempPassword,
        });
        if (storeRes.success && storeRes.user) {
          createdUser = storeRes.user;
        } else {
          throw new Error(storeRes.error || 'Failed to create customer account');
        }
      }

      setCustomers((prev) => [createdUser, ...prev.filter((c) => c.id !== createdUser.id)]);
      setActiveRole('consumer');
      setCustCreatedSuccess({ user: createdUser, tempPassword });

      setToast({
        userName: newCustName,
        message: `registered with meter ${newCustMeter.toUpperCase()}`,
        viewAction: () => handleOpenUserDetail(createdUser),
      });

      setNewCustName('');
      setNewCustMeter('');
      setNewCustMobile('');
      setNewCustEmail('');
      setNewCustAddress('');
      setNewCustTempPassword('Aqua' + Math.floor(1000 + Math.random() * 9000) + '!');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setSystemModal({
        isOpen: true,
        type: 'error',
        title: 'Customer Registration Error',
        message: errorObj?.response?.data?.message || errorObj?.message || 'Failed to register customer.',
        confirmText: 'Got it',
      });
    } finally {
      setIsSubmittingCust(false);
    }
  };

  // Add Staff Submit (Section 7.2)
  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffMobile.trim()) return;

    setIsSubmittingStaff(true);
    setAddStaffNotice(null);

    const tempPassword = newStaffTempPassword.trim() || generateStaffPassword();

    try {
      const selectedBg = barangays.find((b) => b.id === Number(newStaffBarangayId));
      let createdUser: User;

      try {
        const staffEmail = newStaffEmail.trim() || `${newStaffName.trim().toLowerCase().replace(/\s+/g, '.')}@sinacaban.gov.ph`;
        const res = await adminApi.createStaff({
          name: newStaffName.trim(),
          email: staffEmail,
          mobile_number: newStaffMobile.trim(),
          assigned_barangay_id: newStaffBarangayId ? Number(newStaffBarangayId) : undefined,
          temporary_password: tempPassword,
        });
        createdUser = res.user;
        // Keep accountsStore synchronized
        accountsStore.addStaff({
          name: newStaffName.trim(),
          email: createdUser.email || staffEmail,
          mobileNumber: newStaffMobile.trim(),
          barangayId: newStaffBarangayId ? Number(newStaffBarangayId) : undefined,
          barangayName: selectedBg?.name,
          temporaryPassword: tempPassword,
        });
      } catch (apiErr: any) {
        // Fallback for offline/demo mode
        const storeRes = accountsStore.addStaff({
          name: newStaffName.trim(),
          email: newStaffEmail.trim(),
          mobileNumber: newStaffMobile.trim(),
          barangayId: newStaffBarangayId ? Number(newStaffBarangayId) : undefined,
          barangayName: selectedBg?.name,
          temporaryPassword: tempPassword,
        });

        if (storeRes.success && storeRes.user) {
          createdUser = storeRes.user;
        } else if (apiErr?.response?.data?.message) {
          throw apiErr;
        } else {
          createdUser = {
            id: Date.now(),
            role: 'staff',
            status: 'active',
            name: newStaffName.trim(),
            mobile_number: newStaffMobile.trim(),
            email: newStaffEmail.trim() || `${newStaffName.toLowerCase().replace(/\s+/g, '')}@sinacaban.gov.ph`,
            must_change_password: true,
            staff_profile: {
              id: Date.now(),
              user_id: Date.now(),
              first_name: newStaffName.trim().split(' ')[0],
              last_name: newStaffName.trim().split(' ').slice(1).join(' ') || 'Staff',
              name: newStaffName.trim(),
              assigned_barangay_id: newStaffBarangayId ? Number(newStaffBarangayId) : undefined,
              assigned_barangay: selectedBg,
            },
          };
        }
      }

      setStaffList((prev) => [createdUser, ...prev.filter((s) => s.id !== createdUser.id)]);
      setActiveRole('staff');
      setStaffCreatedSuccess({
        user: createdUser,
        tempPassword,
      });

      setToast({
        userName: newStaffName,
        message: `registered with temporary password: ${tempPassword}`,
        viewAction: () => handleOpenUserDetail(createdUser),
      });

      setNewStaffName('');
      setNewStaffEmail('');
      setNewStaffMobile('');
      setNewStaffBarangayId('');
      setNewStaffTempPassword(generateStaffPassword());
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setSystemModal({
        isOpen: true,
        type: 'error',
        title: 'Staff Registration Error',
        message: errorObj?.response?.data?.message || 'Failed to create staff account.',
        confirmText: 'Got it',
      });
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  // Open Edit User Modal
  const handleOpenEditModal = (user: User) => {
    setUserToEdit(user);
    setEditName(getUserDisplayName(user));
    setEditMobile(user.mobile_number || '');
    setEditEmail(user.email || '');
    setEditIsVerified(Boolean(user.is_verified ?? (user.status === 'active')));
    setEditAvatar(user.avatar || getUserPhoto(user));
    setEditPhotoError(null);
    const bgId =
      user.customer_profile?.barangay_id ||
      user.staff_profile?.assigned_barangay_id ||
      '';
    setEditBarangayId(bgId);
    setShowEditUserModal(true);
  };

  // Save Edit User
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;

    setIsSubmittingEdit(true);

    try {
      if (userToEdit.role === 'staff') {
        await adminApi.updateStaff(userToEdit.id, {
          name: editName,
          email: editEmail,
          mobile_number: editMobile,
          assigned_barangay_id: Number(editBarangayId) || null,
        });
      } else {
        await adminApi.updateUser(userToEdit.id, {
          name: editName,
          email: editEmail,
          mobile_number: editMobile,
          barangay_id: Number(editBarangayId) || undefined,
          address: userToEdit.customer_profile?.address,
          avatar: editAvatar || null,
          is_verified: editIsVerified,
        });
      }
    } catch {
      // offline/fallback
    }

    if (editAvatar && editAvatar !== userToEdit.avatar) {
      try {
        accountsStore.updateProfilePhoto(userToEdit.id, editAvatar);
      } catch {
        // ignore
      }
    }

    const updatedBg = barangays.find((b) => b.id === Number(editBarangayId));

    const updater = (u: User): User => {
      if (u.id !== userToEdit.id) return u;
      return {
        ...u,
        name: editName,
        mobile_number: editMobile,
        email: editEmail,
        avatar: editAvatar || u.avatar,
        is_verified: editIsVerified,
        status: editIsVerified ? 'active' : (u.status === 'active' ? 'pending' : u.status),
        customer_profile: u.customer_profile
          ? {
              ...u.customer_profile,
              first_name: editName.split(' ')[0] || editName,
              last_name: editName.split(' ').slice(1).join(' ') || '',
              barangay_id: Number(editBarangayId) || u.customer_profile.barangay_id,
              barangay: updatedBg || u.customer_profile.barangay,
            }
          : undefined,
        staff_profile: u.staff_profile
          ? {
              ...u.staff_profile,
              name: editName,
              first_name: editName.split(' ')[0] || editName,
              last_name: editName.split(' ').slice(1).join(' ') || '',
              assigned_barangay_id: Number(editBarangayId) || u.staff_profile.assigned_barangay_id,
              assigned_barangay: updatedBg || u.staff_profile.assigned_barangay,
            }
          : undefined,
      };
    };

    setCustomers((prev) => prev.map(updater));
    setStaffList((prev) => prev.map(updater));

    if (selectedUserDetail?.id === userToEdit.id) {
      setSelectedUserDetail(updater(userToEdit));
    }

    setToast({
      userName: editName,
      message: 'profile updated successfully',
    });

    setIsSubmittingEdit(false);
    setShowEditUserModal(false);
    setUserToEdit(null);
  };

  // Open Delete User Modal
  const handleOpenDeleteModal = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  // Confirm Single Delete (PDF Rule 10.2: Staff with open tasks cannot be deactivated/removed until tasks are reassigned)
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    if (userToDelete.role === 'staff' && (staffOpenTasksCount[userToDelete.id] || 0) > 0) {
      return;
    }
    const deletedName = getUserDisplayName(userToDelete);
    const deletedUser = userToDelete;

    // Safety guard: Admin account cannot be deleted
    if (deletedUser.role === 'admin') {
      setToast({
        userName: deletedName,
        message: 'Administrator accounts cannot be deleted.',
      });
      setShowDeleteModal(false);
      setUserToDelete(null);
      return;
    }

    try {
      await adminApi.deleteUser(deletedUser.id);
    } catch (err: any) {
      const status = err?.response?.status;
      // If 422 (e.g. staff with assigned tasks that cannot be deleted), abort
      if (status === 422) {
        setToast({
          userName: deletedName,
          message: err?.response?.data?.message || 'Cannot delete this account.',
        });
        setShowDeleteModal(false);
        setUserToDelete(null);
        return;
      }
      // If 404 (user doesn't exist in backend DB or offline demo), proceed to clean up locally
    }

    try {
      accountsStore.deleteAccount(deletedUser.id);
      if (deletedUser.email) {
        accountsStore.deleteAccount(deletedUser.email);
      }
    } catch {
      // ignore
    }

    setCustomers((prev) =>
      prev.filter(
        (u) =>
          u.id !== deletedUser.id &&
          (!deletedUser.email || u.email?.toLowerCase() !== deletedUser.email?.toLowerCase())
      )
    );
    setStaffList((prev) =>
      prev.filter(
        (u) =>
          u.id !== deletedUser.id &&
          (!deletedUser.email || u.email?.toLowerCase() !== deletedUser.email?.toLowerCase())
      )
    );
    setSelectedUserIds((prev) => prev.filter((id) => id !== deletedUser.id));

    if (selectedUserDetail?.id === deletedUser.id) {
      setSelectedUserDetail(null);
    }

    setToast({
      userName: deletedName,
      message: 'was removed from user directory',
    });

    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  // Confirm Bulk Delete
  const handleConfirmBulkDelete = async () => {
    const toDeleteIds = [...selectedUserIds];
    const usersToDelete = [...customers, ...staffList].filter((u) => toDeleteIds.includes(u.id));

    for (const u of usersToDelete) {
      if (u.role === 'admin') continue;
      try {
        await adminApi.deleteUser(u.id);
      } catch {
        // ignore
      }
      try {
        accountsStore.deleteAccount(u.id);
        if (u.email) accountsStore.deleteAccount(u.email);
      } catch {
        // ignore
      }
    }

    setCustomers((prev) => prev.filter((c) => !toDeleteIds.includes(c.id)));
    setStaffList((prev) => prev.filter((s) => !toDeleteIds.includes(s.id)));

    setToast({
      userName: `${toDeleteIds.length} user accounts`,
      message: 'bulk deleted successfully',
    });

    setSelectedUserIds([]);
    setShowBulkDeleteModal(false);
  };

  // Single User Approval (Section 2.2)
  // Admin can review and optionally correct the meter number before approving.
  const handleApproveUser = async (user: User, customMeterNumber?: string) => {
    const displayName = getUserDisplayName(user);

    const applyApproved = (approved: User) => {
      setCustomers((prev) => prev.map((c) => (c.id === user.id ? approved : c)));
      setSelectedUserDetail((prev) => (prev && prev.id === user.id ? approved : prev));
      setToast({
        userName: displayName,
        message: 'approved & verified successfully',
        viewAction: () => {
          setSelectedUserDetail(approved);
          setSelectedCustomerForTag(approved);
        },
      });
    };

    try {
      const meterNumber =
        customMeterNumber?.trim() ||
        user.customer_profile?.meter?.meter_number ||
        user.customer_profile?.meter_number;

      let meterId = user.customer_profile?.meter?.id;
      if (!meterId && !meterNumber && typeof adminApi.availableMeters === 'function') {
        const available = await adminApi
          .availableMeters(
            user.customer_profile?.barangay_id
              ? { barangay_id: user.customer_profile.barangay_id }
              : undefined
          )
          .catch(() => []);
        if (Array.isArray(available) && available.length > 0) {
          meterId = available[0].id;
        }
      }

      const res = await adminApi.verifyRegistration(user.id, {
        meter_id: meterId,
        meter_number: meterNumber || undefined,
      });
      accountsStore.verifyCustomer(user.id);
      if (user.email) accountsStore.verifyCustomer(user.email);
      applyApproved({
        ...user,
        ...(res?.user ?? {}),
        is_verified: true,
        status: 'active',
        verification_status: 'verified',
      });
    } catch (err) {
      const errorObj = err as { response?: { status?: number; data?: { message?: string } } };
      // No server response at all (offline / demo-only account): fall back to local store.
      if (!errorObj?.response) {
        const local = accountsStore.verifyCustomer(user.id);
        if (local.success) {
          applyApproved({ ...user, is_verified: true, status: 'active', verification_status: 'verified' });
          return;
        }
      }
      console.error('Approve failed:', err);
      setToast({
        userName: displayName,
        message: `could not be approved: ${errorObj?.response?.data?.message || 'server error'}`,
      });
    }
  };

  // Decline Registration (Section 2.2 Step 4)
  const handleDeclineUser = async (user: User) => {
    const displayName = getUserDisplayName(user);
    const reason = window.prompt(
      `Please enter the reason for declining registration for ${displayName}:`,
      'Submitted details do not match Sinacaban Water District office records.'
    );
    if (!reason || !reason.trim()) return;

    try {
      await adminApi.declineRegistration(user.id, reason.trim());
      accountsStore.declineCustomer(user.id, reason.trim());
      if (user.email) accountsStore.declineCustomer(user.email, reason.trim());
      const declined: User = {
        ...user,
        status: 'declined',
        is_verified: false,
        verification_status: 'declined',
      };
      setCustomers((prev) => prev.map((c) => (c.id === user.id ? declined : c)));
      setSelectedUserDetail((prev) => (prev && prev.id === user.id ? declined : prev));
      setToast({
        userName: displayName,
        message: 'registration application declined',
      });
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setSystemModal({
        isOpen: true,
        type: 'error',
        title: 'Decline Failed',
        message: errorObj?.response?.data?.message || 'Failed to decline registration.',
        confirmText: 'Close',
      });
    }
  };

  // Deactivate or Reactivate Account (Section 7.4)
  // Staff member with open tasks cannot be deactivated until tasks are reassigned.
  // Deactivation never deletes records.
  const handleToggleDeactivate = async (user: User) => {
    const displayName = getUserDisplayName(user);
    const isCurrentlyActive = user.status === 'active';

    if (isCurrentlyActive) {
      if (user.role === 'staff' && (staffOpenTasksCount[user.id] || 0) > 0) {
        setSystemModal({
          isOpen: true,
          type: 'warning',
          title: 'Active Tasks Reassignment Required',
          message: `This staff member has ${staffOpenTasksCount[user.id]} active task(s) assigned. Please reassign all open tasks before deactivating this account.`,
          confirmText: 'Understood',
        });
        return;
      }

      setSystemModal({
        isOpen: true,
        type: 'confirm',
        isDestructive: true,
        title: `Deactivate ${displayName}`,
        message: `Are you sure you want to deactivate ${displayName}? All records (requests, billing, advisories) will be preserved, but the user will no longer be able to log in.`,
        confirmText: 'Deactivate Account',
        cancelText: 'Keep Active',
        onConfirm: async () => {
          setSystemModal((m) => ({ ...m, isOpen: false }));
          try {
            await adminApi.deactivateUser(user.id);
            const updated: User = { ...user, status: 'inactive', is_verified: false };
            setCustomers((prev) => prev.map((c) => (c.id === user.id ? updated : c)));
            setStaffList((prev) => prev.map((s) => (s.id === user.id ? updated : s)));
            if (selectedUserDetail?.id === user.id) setSelectedUserDetail(updated);
            setToast({ userName: displayName, message: 'has been deactivated (records preserved)' });
          } catch (err: unknown) {
            const errorObj = err as { response?: { data?: { message?: string } } };
            setSystemModal({
              isOpen: true,
              type: 'error',
              title: 'Deactivation Error',
              message: errorObj?.response?.data?.message || 'Failed to deactivate user.',
              confirmText: 'Close',
            });
          }
        },
      });
    } else {
      try {
        await adminApi.reactivateUser(user.id);
        const updated: User = { ...user, status: 'active', is_verified: true };
        setCustomers((prev) => prev.map((c) => (c.id === user.id ? updated : c)));
        setStaffList((prev) => prev.map((s) => (s.id === user.id ? updated : s)));
        if (selectedUserDetail?.id === user.id) setSelectedUserDetail(updated);
        setToast({ userName: displayName, message: 'has been reactivated successfully' });
      } catch (err: unknown) {
        const errorObj = err as { response?: { data?: { message?: string } } };
        setSystemModal({
          isOpen: true,
          type: 'error',
          title: 'Reactivation Error',
          message: errorObj?.response?.data?.message || 'Failed to reactivate user.',
          confirmText: 'Close',
        });
      }
    }
  };

  // Issue Fallback Temporary Password (Section 7.5 & Section 8)
  const handleIssueTempPassword = async (user: User) => {
    const displayName = getUserDisplayName(user);
    try {
      const res = await adminApi.issueTemporaryPassword(user.id);
      const tempPass = res.temporary_password || 'Aqua2026!';
      setSystemModal({
        isOpen: true,
        type: 'credentials',
        title: 'Temporary Password Issued',
        message: 'A temporary password has been successfully issued. Give these credentials to the user. They will be required to create a permanent password upon first login.',
        confirmText: 'Done',
        credentials: {
          userName: displayName,
          loginIdentifier: user.mobile_number || user.email || 'Registered User',
          tempPassword: tempPass,
          accountNumber: user.customer_profile?.account_number,
          meterNumber: user.customer_profile?.meter?.meter_number,
        },
      });
      setToast({
        userName: displayName,
        message: `issued temporary password: ${tempPass}`,
      });
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setSystemModal({
        isOpen: true,
        type: 'error',
        title: 'Temporary Password Error',
        message: errorObj?.response?.data?.message || 'Failed to issue temporary password.',
        confirmText: 'Close',
      });
    }
  };

  // Bulk Verification Toggle
  const handleBulkVerify = (targetStatus: boolean) => {
    setCustomers((prev) =>
      prev.map((c) => (selectedUserIds.includes(c.id) ? { ...c, is_verified: targetStatus } : c))
    );
    selectedUserIds.forEach(async (id) => {
      if (targetStatus) {
        try {
          accountsStore.verifyCustomer(id);
          await adminApi.verifyRegistration(id);
        } catch {
          // ignore
        }
      }
    });
    setToast({
      userName: `${selectedUserIds.length} accounts`,
      message: targetStatus ? 'verified successfully' : 'set to pending verification',
    });
    setSelectedUserIds([]);
  };

  // User Profile Photo resolution: explicit avatar > accountsStore avatar > default profile photo
  const DEFAULT_AVATAR = '/default-avatar.svg';

  const getUserPhoto = (user?: User | null): string => {
    if (!user) return DEFAULT_AVATAR;
    if (user.avatar) return user.avatar;
    const storeUser = accountsStore.getUsers().find((u) => u.id === user.id || (u.email && u.email === user.email));
    if (storeUser?.avatar) return storeUser.avatar;
    return DEFAULT_AVATAR;
  };

  // Deterministic Avatar styling
  const getAvatarInitials = (name?: string) => {
    if (!name) return 'AQ';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Date Added & Last Active formatting based on actual user timestamps
  const formatDateAdded = (userOrId: User | number | undefined) => {
    if (!userOrId) return '—';
    const user =
      typeof userOrId === 'number'
        ? customers.find((c) => c.id === userOrId) ||
          staffList.find((s) => s.id === userOrId) ||
          accountsStore.getUserById(userOrId)
        : userOrId;

    const rawDate = user?.created_at;
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
    }

    return '—';
  };

  const formatLastActive = (userOrId: User | number | undefined) => {
    if (!userOrId) return '—';
    const user =
      typeof userOrId === 'number'
        ? customers.find((c) => c.id === userOrId) ||
          staffList.find((s) => s.id === userOrId) ||
          accountsStore.getUserById(userOrId)
        : userOrId;

    const rawDate = user?.last_active_at || user?.updated_at || user?.created_at;
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 2) return 'Just now';
        if (diffMins < 60) return `${diffMins} mins ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
    }

    return '—';
  };

  // Any modal open check (controls page blur)
  const isModalOpen = Boolean(
    showAddCustomerModal ||
    showAddStaffModal ||
    showEditUserModal ||
    showDeleteModal ||
    showBulkDeleteModal ||
    selectedUserDetail ||
    selectedCustomerForTag ||
    systemModal.isOpen
  );

  const pendingCount = customers.filter(
    (c) => c.status === 'pending' || (!c.is_verified && c.status !== 'active')
  ).length;

  return (
    <AdminLayout currentPath="/admin/users" onNavigate={(path) => navigate(path)}>
      {/* 1. Main Background Content - Safely blurred ONLY when any modal is open */}
      <div
        className={`space-y-5 text-[14px] transition-all duration-300 ${
          isModalOpen ? 'filter blur-[4px] pointer-events-none select-none opacity-40' : ''
        }`}
      >
        {/* Header - Aligned directly with Dashboard Header style */}
        <div className="border-b border-black/10 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight">
            User management
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={handleOpenAddCustomerModal}
              leftIcon={<IconPlus size={15} />}
              className="shrink-0"
            >
              Add Customer
            </Button>
            <Button
              variant="primary"
              onClick={handleOpenAddStaffModal}
              leftIcon={<IconPlus size={15} />}
              className="shrink-0"
            >
              Register Staff
            </Button>
          </div>
        </div>

        {/* 2. Top Summary Metric Cards (Exact Structure & Solid Colors matching Dashboard Photo) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Users / All Accounts (Blue #1E6FD9) */}
          <div
            onClick={() => {
              setActiveRole('all');
              setVerificationFilter('all');
            }}
            className="bg-[#1E6FD9] rounded-md shadow-[0_8px_20px_-3px_rgba(0,0,0,0.24),0_4px_8px_-2px_rgba(0,0,0,0.14)] hover:shadow-[0_14px_28px_-4px_rgba(0,0,0,0.3),0_8px_12px_-4px_rgba(0,0,0,0.18)] flex items-stretch overflow-hidden text-white transition-all duration-200 hover:-translate-y-1 cursor-pointer h-24 sm:h-28"
          >
            <div className="w-16 sm:w-20 bg-black/10 flex items-center justify-center border-r border-white/15 shrink-0">
              <IconUsers size={32} stroke={1.75} className="text-white" />
            </div>
            <div className="flex-1 px-4 py-3 flex flex-col justify-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-white leading-none">
                {isLoading ? '...' : customers.length + staffList.length + defaultAdmins.length}
              </div>
              <div className="border-t border-white/20 mt-2 pt-1.5 text-xs font-bold tracking-wider text-white uppercase">
                All Accounts
              </div>
              <span className="sr-only">All Accounts</span>
            </div>
          </div>

          {/* Card 2: Consumers (Green #43A047) */}
          <div
            onClick={() => {
              setActiveRole('consumer');
              setVerificationFilter('all');
            }}
            className="bg-[#43A047] rounded-md shadow-[0_8px_20px_-3px_rgba(0,0,0,0.24),0_4px_8px_-2px_rgba(0,0,0,0.14)] hover:shadow-[0_14px_28px_-4px_rgba(0,0,0,0.3),0_8px_12px_-4px_rgba(0,0,0,0.18)] flex items-stretch overflow-hidden text-white transition-all duration-200 hover:-translate-y-1 cursor-pointer h-24 sm:h-28"
          >
            <div className="w-16 sm:w-20 bg-black/10 flex items-center justify-center border-r border-white/15 shrink-0">
              <IconReceipt size={32} stroke={1.75} className="text-white" />
            </div>
            <div className="flex-1 px-4 py-3 flex flex-col justify-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-white leading-none">
                {isLoading ? '...' : customers.length}
              </div>
              <div className="border-t border-white/20 mt-2 pt-1.5 text-xs font-bold tracking-wider text-white uppercase">
                Consumers
              </div>
              <span className="sr-only">Registered Consumers</span>
            </div>
          </div>

          {/* Card 3: Field Staff (Orange #FB8C00) */}
          <div
            onClick={() => setActiveRole('staff')}
            className="bg-[#FB8C00] rounded-md shadow-[0_8px_20px_-3px_rgba(0,0,0,0.24),0_4px_8px_-2px_rgba(0,0,0,0.14)] hover:shadow-[0_14px_28px_-4px_rgba(0,0,0,0.3),0_8px_12px_-4px_rgba(0,0,0,0.18)] flex items-stretch overflow-hidden text-white transition-all duration-200 hover:-translate-y-1 cursor-pointer h-24 sm:h-28"
          >
            <div className="w-16 sm:w-20 bg-black/10 flex items-center justify-center border-r border-white/15 shrink-0">
              <IconTool size={32} stroke={1.75} className="text-white" />
            </div>
            <div className="flex-1 px-4 py-3 flex flex-col justify-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-white leading-none">
                {isLoading ? '...' : staffList.length}
              </div>
              <div className="border-t border-white/20 mt-2 pt-1.5 text-xs font-bold tracking-wider text-white uppercase">
                Field Staff
              </div>
              <span className="sr-only">Field Staff Personnel</span>
            </div>
          </div>

          {/* Card 4: Verifications (Purple #7C3AED) */}
          <div
            onClick={() => {
              setActiveRole('consumer');
              setVerificationFilter('pending');
            }}
            className="bg-[#7C3AED] rounded-md shadow-[0_8px_20px_-3px_rgba(0,0,0,0.24),0_4px_8px_-2px_rgba(0,0,0,0.14)] hover:shadow-[0_14px_28px_-4px_rgba(0,0,0,0.3),0_8px_12px_-4px_rgba(0,0,0,0.18)] flex items-stretch overflow-hidden text-white transition-all duration-200 hover:-translate-y-1 cursor-pointer h-24 sm:h-28"
          >
            <div className="w-16 sm:w-20 bg-black/10 flex items-center justify-center border-r border-white/15 shrink-0">
              <IconUserCheck size={32} stroke={1.75} className="text-white" />
            </div>
            <div className="flex-1 px-4 py-3 flex flex-col justify-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-white leading-none">
                {isLoading ? '...' : pendingCount}
              </div>
              <div className="border-t border-white/20 mt-2 pt-1.5 text-xs font-bold tracking-wider text-white uppercase">
                Verifications
              </div>
              <span className="sr-only">Pending Verifications</span>
            </div>
          </div>
        </div>

        {/* 3. Control & Filter Card (Dashboard solid card style) */}
        <Card className="p-4 bg-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] rounded-md border border-black/10 space-y-3.5">
          {/* Top Row: Tabs and Status Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-3">
            {/* Left: Role switcher buttons */}
            <div className="flex items-center gap-1.5 bg-black/5 p-1 rounded-md border border-black/10">
              <button
                onClick={() => setActiveRole('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                  activeRole === 'all'
                    ? 'bg-[#1E6FD9] text-white shadow-sm'
                    : 'text-black/70 hover:text-black hover:bg-black/5'
                }`}
              >
                <span>All users</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeRole === 'all' ? 'bg-white/20 text-white' : 'bg-black/10 text-black/70'}`}>
                  {customers.length + staffList.length + defaultAdmins.length}
                </span>
              </button>

              <button
                onClick={() => setActiveRole('consumer')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                  activeRole === 'consumer'
                    ? 'bg-[#1E6FD9] text-white shadow-sm'
                    : 'text-black/70 hover:text-black hover:bg-black/5'
                }`}
              >
                <span>Consumers</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeRole === 'consumer' ? 'bg-white/20 text-white' : 'bg-black/10 text-black/70'}`}>
                  {customers.length}
                </span>
              </button>

              <button
                onClick={() => setActiveRole('staff')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                  activeRole === 'staff'
                    ? 'bg-[#1E6FD9] text-white shadow-sm'
                    : 'text-black/70 hover:text-black hover:bg-black/5'
                }`}
              >
                <span>Field Staff</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeRole === 'staff' ? 'bg-white/20 text-white' : 'bg-black/10 text-black/70'}`}>
                  {staffList.length}
                </span>
              </button>

              <button
                onClick={() => setActiveRole('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                  activeRole === 'admin'
                    ? 'bg-[#1E6FD9] text-white shadow-sm'
                    : 'text-black/70 hover:text-black hover:bg-black/5'
                }`}
              >
                <span>Admins</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeRole === 'admin' ? 'bg-white/20 text-white' : 'bg-black/10 text-black/70'}`}>
                  {defaultAdmins.length}
                </span>
              </button>
            </div>

            {/* Quick Status Sub-filters */}
            {(activeRole === 'consumer' || activeRole === 'all') && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-bold text-black/60 uppercase tracking-wider text-[11px]">Verification:</span>
                {(['all', 'verified', 'pending'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setVerificationFilter(v)}
                    className={`px-2.5 py-1 rounded text-xs font-bold capitalize transition-all cursor-pointer ${
                      verificationFilter === v
                        ? v === 'verified'
                          ? 'bg-[#43A047] text-white shadow-xs'
                          : v === 'pending'
                          ? 'bg-[#FB8C00] text-white shadow-xs'
                          : 'bg-[#1E6FD9] text-white shadow-xs'
                        : 'bg-black/5 text-black/70 hover:bg-black/10'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Row: Search & Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="sm:col-span-2 lg:col-span-3 relative">
              <input
                type="text"
                placeholder="Search account #, meter #, resident name, mobile, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white text-black border border-black/20 rounded outline-none focus:border-[#1E6FD9]"
              />
              <IconSearch size={14} className="absolute left-2.5 top-2.5 text-black/40" />
            </div>

            {/* Barangay Dropdown */}
            <div className="relative">
              <select
                value={selectedBarangay}
                onChange={(e) => setSelectedBarangay(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white text-black border border-black/20 rounded outline-none focus:border-[#1E6FD9]"
              >
                <option value="all">All Barangays</option>
                {barangays.map((bg) => (
                  <option key={bg.id} value={bg.name}>
                    {bg.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* 4. Bulk Action Toolbar (Appears whenever rows are selected) */}
        {selectedUserIds.length > 0 && (
          <div className="bg-[#0F172A] text-white p-3 px-4 rounded-md shadow-lg border border-black/15 flex flex-wrap items-center justify-between gap-3 animate-slide-down">
            <div className="flex items-center gap-2.5 text-xs font-bold">
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">
                {selectedUserIds.length}
              </span>
              <span>
                {selectedUserIds.length === 1 ? '1 user account selected' : `${selectedUserIds.length} user accounts selected`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkVerify(true)}
                className="px-3 py-1.5 text-xs font-bold rounded bg-[#43A047] hover:bg-emerald-700 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <IconCheck size={14} />
                <span>Verify Selected</span>
              </button>

              <button
                onClick={() => setShowBulkDeleteModal(true)}
                className="px-3 py-1.5 text-xs font-bold rounded bg-[#E53935] hover:bg-red-700 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <IconTrash size={14} />
                <span>Bulk Delete ({selectedUserIds.length})</span>
              </button>

              <button
                onClick={() => setSelectedUserIds([])}
                className="px-2 py-1 text-xs font-semibold text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* 5. Main Directory Data Table */}
        <Card className="p-0 bg-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] rounded-md border border-black/10 overflow-hidden">
          {isLoading ? (
            <div className="py-20 text-center text-black/40 text-xs">
              Loading user directory from database...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={<IconUsers size={36} className="text-black/30" />}
                title="No users found"
                description="No team members or consumers match your current filters or search query."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-black/10 bg-black/5 text-black/70 uppercase tracking-wider font-bold select-none">
                    <th className="py-2.5 px-3 w-10">
                      <input
                        type="checkbox"
                        checked={isAllCurrentSelected}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-black/20 text-[#1E6FD9] focus:ring-[#1E6FD9] cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-3">Account & Resident</th>
                    <th className="py-2.5 px-3">Access & Permissions</th>
                    <th className="py-2.5 px-3">
                      <div className="flex items-center gap-1 cursor-pointer hover:text-black">
                        <span>Last active</span>
                        <IconArrowDown size={13} className="text-black/40" />
                      </div>
                    </th>
                    <th className="py-2.5 px-3">Date added</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-black/5">
                  {paginatedUsers.map((user) => {
                    const isSelected = selectedUserIds.includes(user.id);
                    const openTaskCount = staffOpenTasksCount[user.id] || 0;
                    const isConsumer =
                      user.role === 'customer' || (user.role as string) === 'consumer';
                    const isStaff = user.role === 'staff';
                    const isAdmin = user.role === 'admin';

                    const displayName = getUserDisplayName(user);
                    const userSubtitle = isConsumer
                      ? `${user.customer_profile?.account_number || `ACC-${user.id}`} · ${
                          user.mobile_number || user.email || 'Consumer'
                        }`
                      : user.email || user.mobile_number || 'Municipal Staff';

                    return (
                      <tr
                        key={`${user.role}-${user.id}`}
                        onClick={() => handleOpenUserDetail(user)}
                        title="Click to view full user profile"
                        className={`hover:bg-black/5 transition-colors cursor-pointer group ${
                          isSelected ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td
                          className="py-3 px-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {user.role !== 'admin' ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectUser(user.id)}
                              className="w-4 h-4 rounded border-black/20 text-[#1E6FD9] focus:ring-[#1E6FD9] cursor-pointer"
                            />
                          ) : (
                            <span className="w-4 h-4 block" />
                          )}
                        </td>

                        {/* User name: Avatar + Name + Subtitle */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-black/15 shrink-0 bg-[#1E6FD9]/15 flex items-center justify-center relative">
                              <img
                                src={getUserPhoto(user)}
                                alt={displayName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                              <span className="font-extrabold text-xs text-[#1E6FD9] absolute inset-0 -z-10 flex items-center justify-center">
                                {getAvatarInitials(displayName)}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="font-extrabold text-black group-hover:text-[#1E6FD9] transition-colors truncate">
                                {displayName}
                              </div>
                              <div className="text-[11px] text-black/50 truncate">
                                {userSubtitle}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Access & Permissions: Dashboard Solid Badges */}
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Role Badge */}
                            {isAdmin && (
                              <Badge variant="outline" className="bg-black text-white border-black font-bold">
                                ADMIN
                              </Badge>
                            )}
                            {isStaff && (
                              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 font-bold">
                                FIELD STAFF
                              </Badge>
                            )}
                            {isConsumer && (
                              <Badge variant="blue" className="font-bold">
                                CONSUMER
                              </Badge>
                            )}

                            {/* Consumer Context */}
                            {isConsumer && (
                              <>
                                {(() => {
                                  const isVerified = user.is_verified || user.status === 'active';
                                  return (
                                    <Badge
                                      variant={isVerified ? 'blue' : 'outline'}
                                      className={
                                        isVerified
                                          ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                                          : 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                                      }
                                    >
                                      {isVerified ? 'VERIFIED' : 'PENDING'}
                                    </Badge>
                                  );
                                })()}

                                {user.customer_profile?.meter?.meter_number && (
                                  <span className="font-mono text-xs font-bold text-[#1E6FD9] bg-[#1E6FD9]/10 px-2 py-0.5 rounded border border-[#1E6FD9]/20">
                                    {user.customer_profile.meter.meter_number}
                                  </span>
                                )}

                                {user.customer_profile?.barangay?.name && (
                                  <span className="text-[11px] font-semibold text-black/70 bg-black/5 px-2 py-0.5 rounded">
                                    {user.customer_profile.barangay.name}
                                  </span>
                                )}
                              </>
                            )}

                            {/* Staff Context */}
                            {isStaff && (
                              <>
                                <span
                                  className={`px-2 py-0.5 rounded font-bold text-xs ${
                                    openTaskCount > 0
                                      ? 'bg-[#FB8C00]/15 text-[#D97706]'
                                      : 'bg-[#43A047]/15 text-[#43A047]'
                                  }`}
                                >
                                  {openTaskCount} Active Task{openTaskCount !== 1 ? 's' : ''}
                                </span>

                                {user.staff_profile?.assigned_barangay?.name && (
                                  <span className="text-[11px] font-semibold text-black/70 bg-black/5 px-2 py-0.5 rounded">
                                    {user.staff_profile.assigned_barangay.name}
                                  </span>
                                )}
                              </>
                            )}

                            {/* Admin Context */}
                            {isAdmin && (
                              <span className="text-[11px] font-semibold text-black/70 bg-black/5 px-2 py-0.5 rounded">
                                Full Operations Access
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Last active */}
                        <td className="py-3 px-3 text-black/60 text-xs font-medium">
                          {formatLastActive(user)}
                        </td>

                        {/* Date added */}
                        <td className="py-3 px-3 text-black/60 text-xs font-medium">
                          {formatDateAdded(user)}
                        </td>

                        {/* Actions Column (Direct action buttons for Update, QR, Delete) */}
                        <td
                          className="py-3 px-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Approve Button for pending accounts, Update for verified */}
                            {user.status === 'pending' || (!user.is_verified && user.status !== 'active') ? (
                              <button
                                onClick={() => handleApproveUser(user)}
                                title="Approve and Verify Account"
                                className="px-2.5 py-1 text-xs font-bold rounded bg-[#43A047] hover:bg-emerald-700 text-white transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                              >
                                <IconCheck size={13} stroke={2.5} />
                                <span>Approve</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenEditModal(user)}
                                title="Update User Information"
                                className="px-2 py-1 text-xs font-bold rounded border border-black/20 hover:border-black/40 text-black hover:bg-black/5 transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <IconPencil size={13} className="text-[#1E6FD9]" />
                                <span>Update</span>
                              </button>
                            )}

                            {/* QR Meter Tag (for consumers) */}
                            {isConsumer && (
                              <button
                                onClick={() => setSelectedCustomerForTag(user)}
                                title="Print Meter QR Tag"
                                className="px-2 py-1 text-xs font-bold rounded border border-black/20 hover:border-black/40 text-black hover:bg-black/5 transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <IconQrcode size={13} />
                                <span>QR</span>
                              </button>
                            )}

                            {/* Delete Button (Consumer and Staff only; Admin accounts cannot be deleted) */}
                            {user.role !== 'admin' && (
                              <button
                                onClick={() => handleOpenDeleteModal(user)}
                                title="Delete User Account"
                                className="px-2 py-1 text-xs font-bold rounded border border-black/20 hover:border-[#E53935] text-[#E53935] hover:bg-red-50 transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <IconTrash size={13} />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Numbered Pagination Footer */}
          {!isLoading && filteredUsers.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-black/10 bg-white">
              {/* Previous Button */}
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-black/20 text-xs font-bold text-black/70 hover:bg-black/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <IconChevronLeft size={14} />
                <span>Previous</span>
              </button>

              {/* Numbered Page Buttons */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded text-xs font-bold transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-[#1E6FD9] text-white shadow-xs'
                        : 'text-black/70 hover:bg-black/5 hover:text-black'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              {/* Next Button */}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-black/20 text-xs font-bold text-black/70 hover:bg-black/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <span>Next</span>
                <IconChevronRight size={14} />
              </button>
            </div>
          )}
        </Card>

        {/* Floating Toast Notification */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-[99999] bg-[#0F172A] text-white px-4 py-3 rounded-md shadow-2xl border border-black/30 flex items-center gap-3 animate-in slide-in-from-bottom-5 text-xs max-w-md">
            <span className="w-5 h-5 rounded-full border border-emerald-400 bg-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0">
              <IconCheck size={12} stroke={3} />
            </span>
            <span className="font-normal text-slate-200">
              <span className="font-bold text-white">“{toast.userName}”</span> {toast.message}
            </span>
            <div className="flex items-center gap-2 ml-auto shrink-0">
              {toast.undoAction && (
                <button
                  onClick={toast.undoAction}
                  className="text-xs font-bold text-slate-300 hover:text-white underline cursor-pointer"
                >
                  Undo
                </button>
              )}
              {toast.viewAction && (
                <button
                  onClick={toast.viewAction}
                  className="text-xs font-bold text-[#1E6FD9] hover:underline cursor-pointer"
                >
                  View profile
                </button>
              )}
              <button
                onClick={() => setToast(null)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer ml-1"
              >
                <IconX size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          TOP LAYER MODALS & DRAWERS (Mounted to document.body via Portal)
          * NEVER BLURRED because they are direct children of document.body, not the blurred div!
         ========================================================================= */}

      {/* 1. Centered User Info Modal */}
      {selectedUserDetail &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedUserDetail(null)}
          >
            <Card
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-white rounded-md shadow-2xl border border-black/15 overflow-hidden my-auto animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
            >
              {/* Modal Top Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 bg-slate-50/70 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-[#1E6FD9]/10 text-[#1E6FD9] flex items-center justify-center font-bold shrink-0">
                    <IconUsers size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-black tracking-tight">
                      User Information
                    </h3>
                    <p className="text-[11px] text-black/50 font-medium">
                      Sinacaban Municipal Water Works · Official Directory
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUserDetail(null)}
                  className="p-1.5 rounded-md hover:bg-black/5 text-black/50 hover:text-black transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <IconX size={18} />
                </button>
              </div>

              {/* Scrollable Content Body */}
              <div className="p-6 overflow-y-auto space-y-4 text-xs">
                {/* Hero Profile Banner */}
                <div className="p-4 bg-black/5 rounded-md border border-black/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-13 h-13 rounded-full overflow-hidden border-2 border-black/15 shrink-0 bg-[#1E6FD9]/15 flex items-center justify-center shadow-xs relative">
                      <img
                        src={getUserPhoto(selectedUserDetail)}
                        alt={getUserDisplayName(selectedUserDetail)}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <span className="font-black text-lg text-[#1E6FD9] absolute inset-0 -z-10 flex items-center justify-center">
                        {getAvatarInitials(getUserDisplayName(selectedUserDetail))}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-base font-black text-black tracking-tight truncate">
                        {getUserDisplayName(selectedUserDetail)}
                      </h4>
                      <div className="text-xs text-black/60 truncate font-medium">
                        {selectedUserDetail.email || selectedUserDetail.mobile_number || 'Registered Account'}
                      </div>
                      <div className="text-[11px] text-black/40 font-mono mt-0.5">
                        ID: #{selectedUserDetail.id}
                      </div>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex sm:flex-col items-start sm:items-end gap-1.5 shrink-0">
                    {/* Role badge */}
                    {selectedUserDetail.role === 'admin' && (
                      <Badge variant="outline" className="bg-black text-white border-black font-bold">
                        ADMIN
                      </Badge>
                    )}
                    {selectedUserDetail.role === 'staff' && (
                      <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 font-bold">
                        FIELD STAFF
                      </Badge>
                    )}
                    {(selectedUserDetail.role === 'customer' || (selectedUserDetail.role as string) === 'consumer') && (
                      <Badge variant="blue" className="font-bold">
                        CONSUMER
                      </Badge>
                    )}

                    {/* Verification Status badge */}
                    {(() => {
                      const isVerified = selectedUserDetail.is_verified || selectedUserDetail.status === 'active';
                      return (
                        <Badge
                          variant={isVerified ? 'blue' : 'outline'}
                          className={
                            isVerified
                              ? 'bg-[#43A047] text-white border-[#43A047] font-bold'
                              : 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                          }
                        >
                          {isVerified ? 'VERIFIED' : 'PENDING'}
                        </Badge>
                      );
                    })()}
                  </div>
                </div>

                {/* Account & Contact Details Grid */}
                <div className="border border-black/10 rounded-md p-4 bg-white space-y-3">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-black/60 flex items-center justify-between border-b border-black/10 pb-2">
                    <span>Contact & Security</span>
                    <span className="text-black/40 lowercase font-normal">account profile</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-black/50 text-[11px] font-semibold">Mobile Number</div>
                      <div className="font-bold text-black mt-0.5 font-mono">
                        {selectedUserDetail.mobile_number || 'Not provided'}
                      </div>
                    </div>
                    <div>
                      <div className="text-black/50 text-[11px] font-semibold">Email Address</div>
                      <div className="font-bold text-black mt-0.5 truncate">
                        {selectedUserDetail.email || 'None on record'}
                      </div>
                    </div>
                    <div>
                      <div className="text-black/50 text-[11px] font-semibold">Date Added</div>
                      <div className="font-bold text-black mt-0.5">
                        {formatDateAdded(selectedUserDetail)}
                      </div>
                    </div>
                    <div>
                      <div className="text-black/50 text-[11px] font-semibold">Last Active</div>
                      <div className="font-bold text-black mt-0.5">
                        {formatLastActive(selectedUserDetail)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Consumer Utility Connection Details */}
                {selectedUserDetail.customer_profile && (
                  <div className="border border-black/10 rounded-md p-4 bg-white space-y-3">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-black/60 flex items-center justify-between border-b border-black/10 pb-2">
                      <span>Utility Connection</span>
                      <span className="font-mono text-[11px] font-bold text-[#1E6FD9] bg-[#1E6FD9]/10 px-2 py-0.5 rounded border border-[#1E6FD9]/20">
                        {selectedUserDetail.customer_profile.account_number || 'PENDING'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-black/50 text-[11px] font-semibold">Barangay Jurisdiction</div>
                        <div className="font-bold text-black mt-0.5">
                          {selectedUserDetail.customer_profile.barangay?.name || 'Poblacion'}
                        </div>
                      </div>
                      <div>
                        <div className="text-black/50 text-[11px] font-semibold">Water Meter</div>
                        <div className="mt-0.5">
                          {selectedUserDetail.status === 'pending' || (!selectedUserDetail.is_verified && selectedUserDetail.status !== 'active') ? (
                            <div>
                              <input
                                type="text"
                                value={pendingMeterInput}
                                onChange={(e) => setPendingMeterInput(e.target.value)}
                                className="w-full px-2 py-1 text-xs font-mono font-bold border border-black/30 rounded focus:border-[#1E6FD9] outline-none"
                                placeholder="e.g. MTR-SIN-0004"
                                title="Admin can correct meter number before verifying"
                              />
                              <span className="text-[10px] text-black/50 block mt-0.5">
                                Submitted meter (editable by admin before verification)
                              </span>
                            </div>
                          ) : selectedUserDetail.customer_profile.meter ? (
                            <span className="font-mono font-bold text-[#1E6FD9] bg-[#1E6FD9]/10 px-2 py-0.5 rounded border border-[#1E6FD9]/20 inline-block">
                              {selectedUserDetail.customer_profile.meter.meter_number}
                            </span>
                          ) : (
                            <span className="text-black/40 italic font-medium">No meter linked yet</span>
                          )}
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <div className="text-black/50 text-[11px] font-semibold">Installation Address</div>
                        <div className="font-bold text-black mt-0.5">
                          {selectedUserDetail.customer_profile.address || 'Sinacaban, Misamis Occidental'}
                        </div>
                      </div>

                      {/* Section 2.2: Home Location shown next to details */}
                      {selectedUserDetail.customer_profile.latitude && selectedUserDetail.customer_profile.longitude && (
                        <div className="sm:col-span-2 mt-1">
                          <div className="text-black/50 text-[11px] font-semibold mb-1">
                            Home Location Pin (Centered on Sinacaban)
                          </div>
                          <div className="p-2.5 bg-slate-50 border border-black/15 rounded flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-[#1E6FD9] flex items-center gap-1.5">
                              <span>📍</span>
                              <span>
                                {Number(selectedUserDetail.customer_profile.latitude).toFixed(6)},{' '}
                                {Number(selectedUserDetail.customer_profile.longitude).toFixed(6)}
                              </span>
                            </span>
                            <span className="text-[11px] text-black/60 font-medium">
                              {selectedUserDetail.customer_profile.barangay?.name || 'Sinacaban'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Staff Field Assignment Details */}
                {selectedUserDetail.staff_profile && (
                  <div className="border border-black/10 rounded-md p-4 bg-white space-y-3">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-black/60 flex items-center justify-between border-b border-black/10 pb-2">
                      <span>Field Assignment</span>
                      <span className="text-[11px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded border border-purple-300">
                        Operational Crew
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-black/50 text-[11px] font-semibold">Assigned Barangay</div>
                        <div className="font-bold text-black mt-0.5">
                          {selectedUserDetail.staff_profile.assigned_barangay?.name || 'General Utility / All Areas'}
                        </div>
                      </div>
                      <div>
                        <div className="text-black/50 text-[11px] font-semibold">Active Work Orders</div>
                        <div className="mt-0.5">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-xs inline-block ${
                              (staffOpenTasksCount[selectedUserDetail.id] || 0) > 0
                                ? 'bg-[#FB8C00]/15 text-[#D97706]'
                                : 'bg-[#43A047]/15 text-[#43A047]'
                            }`}
                          >
                            {staffOpenTasksCount[selectedUserDetail.id] || 0} Open Task{(staffOpenTasksCount[selectedUserDetail.id] || 0) !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Action Buttons */}
              <div className="border-t border-black/10 px-6 py-3.5 bg-slate-50/80 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
                {/* Left side: Account Lifecycle / Admin security actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedUserDetail.status !== 'pending' && (
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => handleToggleDeactivate(selectedUserDetail)}
                        leftIcon={
                          selectedUserDetail.status === 'active' ? (
                            <IconBan size={15} />
                          ) : (
                            <IconRefresh size={15} />
                          )
                        }
                        className={
                          selectedUserDetail.status === 'active'
                            ? 'text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100/80 border-amber-300'
                            : 'text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100/80 border-emerald-300'
                        }
                      >
                        {selectedUserDetail.status === 'active' ? 'Deactivate' : 'Reactivate'}
                      </Button>

                      <Button
                        variant="secondary"
                        onClick={() => handleIssueTempPassword(selectedUserDetail)}
                        leftIcon={<IconKey size={15} />}
                        title="Issue fallback temporary password"
                      >
                        Temp Pass
                      </Button>
                    </>
                  )}
                </div>

                {/* Right side: Primary & secondary actions */}
                <div className="flex items-center justify-end gap-2 flex-wrap">
                  {/* Section 2.2: Pending registration decisions (Decline or Approve) */}
                  {selectedUserDetail.status === 'pending' ||
                  (!selectedUserDetail.is_verified && selectedUserDetail.status !== 'active') ? (
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => handleDeclineUser(selectedUserDetail)}
                        leftIcon={<IconX size={15} />}
                        className="text-[#E53935] hover:bg-red-50 border-[#E53935]/30 font-bold"
                      >
                        Decline
                      </Button>
                      <Button
                        onClick={() => handleApproveUser(selectedUserDetail, pendingMeterInput)}
                        leftIcon={<IconCheck size={15} stroke={2.5} />}
                        className="bg-[#43A047] hover:bg-emerald-700 text-white font-bold"
                        aria-label="Approve Account"
                      >
                        Approve & Verify
                      </Button>
                    </>
                  ) : (
                    <>
                      {/* If user is verified and has customer profile, option to print QR */}
                      {selectedUserDetail.customer_profile && (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            const user = selectedUserDetail;
                            setSelectedUserDetail(null);
                            setSelectedCustomerForTag(user);
                          }}
                          leftIcon={<IconQrcode size={15} />}
                        >
                          Print QR Tag
                        </Button>
                      )}

                      {/* Update button for verified accounts */}
                      <Button
                        variant="primary"
                        onClick={() => {
                          const user = selectedUserDetail;
                          setSelectedUserDetail(null);
                          handleOpenEditModal(user);
                        }}
                        leftIcon={<IconPencil size={15} />}
                      >
                        Update Info
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </div>,
          document.body
        )}

      {/* 2. Meter Tag Printable Modal */}
      {selectedCustomerForTag &&
        typeof document !== 'undefined' &&
        createPortal(
          <MeterTagModal
            customer={selectedCustomerForTag}
            onClose={() => setSelectedCustomerForTag(null)}
          />,
          document.body
        )}

      {/* 2.5 Register Customer Modal */}
      {showAddCustomerModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-white p-5 rounded-md shadow-2xl border border-black/15 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-[#1E6FD9]/10 text-[#1E6FD9] flex items-center justify-center">
                    <IconUsers size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-black leading-tight">
                      Add Consumer Account
                    </h3>
                    <p className="text-[11px] text-black/50">
                      Provision official municipal water account with meter
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAddCustomerModal(false);
                    setCustCreatedSuccess(null);
                  }}
                  className="p-1 text-black/50 hover:text-black cursor-pointer rounded hover:bg-black/5"
                >
                  <IconX size={18} />
                </button>
              </div>

              {custCreatedSuccess ? (
                <div className="space-y-4">
                  <div className="p-3.5 bg-green-50 border border-green-200 rounded text-black space-y-1.5">
                    <div className="flex items-center gap-2 text-green-700 font-bold text-xs sm:text-sm">
                      <IconCheck size={18} className="shrink-0" />
                      <span>Consumer Account Registered Successfully!</span>
                    </div>
                    <p className="text-[11px] text-black/70">
                      Account is active and verified. Provide these login details to the customer.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-black/15 rounded p-3.5 space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-black/5">
                      <span className="text-black/60 font-medium">Customer Name:</span>
                      <span className="font-bold text-black">{custCreatedSuccess.user.name}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-black/5">
                      <span className="text-black/60 font-medium">Account Number:</span>
                      <span className="font-mono font-bold text-[#1E6FD9]">
                        {custCreatedSuccess.user.customer_profile?.account_number || `ACC-2026-${String(custCreatedSuccess.user.id).slice(-4)}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-black/5">
                      <span className="text-black/60 font-medium">Meter Number:</span>
                      <span className="font-mono font-bold text-black">
                        {custCreatedSuccess.user.customer_profile?.meter?.meter_number || custCreatedSuccess.user.customer_profile?.meter_number}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-black/5">
                      <span className="text-black/60 font-medium">Mobile Number:</span>
                      <span className="font-mono font-bold text-black">{custCreatedSuccess.user.mobile_number}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 bg-white px-2.5 rounded border border-black/10 mt-1">
                      <span className="text-black/70 font-semibold flex items-center gap-1">
                        <IconKey size={13} className="text-[#1E6FD9]" />
                        <span>Temporary Password:</span>
                      </span>
                      <span className="font-mono font-bold text-sm text-[#1E6FD9] tracking-wider select-all">
                        {custCreatedSuccess.tempPassword}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-black/10 pt-3">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => {
                        const mtr = custCreatedSuccess.user.customer_profile?.meter?.meter_number || '';
                        const acc = custCreatedSuccess.user.customer_profile?.account_number || '';
                        const info = `AquaTrack Consumer Account:\nName: ${custCreatedSuccess.user.name}\nAccount: ${acc}\nMeter: ${mtr}\nMobile: ${custCreatedSuccess.user.mobile_number}\nTemporary Password: ${custCreatedSuccess.tempPassword}\nPortal: ${window.location.origin}/login`;
                        navigator.clipboard.writeText(info);
                        setCopiedCustCredentials(true);
                        setTimeout(() => setCopiedCustCredentials(false), 2500);
                      }}
                      className="flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <IconCopy size={14} />
                      <span>{copiedCustCredentials ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
                    </Button>

                    <Button
                      variant="primary"
                      type="button"
                      onClick={() => {
                        setActiveRole('consumer');
                        setShowAddCustomerModal(false);
                        setCustCreatedSuccess(null);
                      }}
                      className="text-xs font-semibold"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAddCustomerSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-black mb-1">
                      Full Name <span className="text-[#E53935]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maria Santos"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-black border border-black/20 rounded outline-none focus:border-[#1E6FD9]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-black mb-1">
                        Meter Number <span className="text-[#E53935]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. MTR-SIN-0004"
                        value={newCustMeter}
                        onChange={(e) => setNewCustMeter(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 bg-white text-black font-mono font-medium border border-black/20 rounded outline-none focus:border-[#1E6FD9]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-black mb-1">
                        Mobile Number <span className="text-[#E53935]">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="09171234567"
                        value={newCustMobile}
                        onChange={(e) => setNewCustMobile(e.target.value)}
                        className="w-full px-3 py-2 bg-white text-black border border-black/20 rounded outline-none focus:border-[#1E6FD9]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-black mb-1">
                        Barangay <span className="text-[#E53935]">*</span>
                      </label>
                      <select
                        value={newCustBarangayId}
                        onChange={(e) => setNewCustBarangayId(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white text-black border border-black/20 rounded outline-none focus:border-[#1E6FD9]"
                        required
                      >
                        {barangays.map((bg) => (
                          <option key={bg.id} value={bg.id}>
                            {bg.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-black mb-1">Email (Optional)</label>
                      <input
                        type="email"
                        placeholder="maria@example.com"
                        value={newCustEmail}
                        onChange={(e) => setNewCustEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-white text-black border border-black/20 rounded outline-none focus:border-[#1E6FD9]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-black mb-1">
                      Specific Address / Purok <span className="text-[#E53935]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Purok 2, Near Chapel"
                      value={newCustAddress}
                      onChange={(e) => setNewCustAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-black border border-black/20 rounded outline-none focus:border-[#1E6FD9]"
                    />
                  </div>

                  {/* Temporary Password */}
                  <div className="pt-2 border-t border-black/10">
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-black flex items-center gap-1.5">
                        <IconKey size={14} className="text-[#1E6FD9]" />
                        <span>Temporary Password</span>
                        <span className="text-[10px] text-black/50 font-normal">(Initial login)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setNewCustTempPassword('Aqua' + Math.floor(1000 + Math.random() * 9000) + '!')}
                        className="text-[11px] font-semibold text-[#1E6FD9] hover:underline flex items-center gap-1 cursor-pointer"
                        title="Generate random secure password"
                      >
                        <IconRefresh size={12} />
                        <span>Regenerate</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showCustTempPassword ? 'text' : 'password'}
                        required
                        value={newCustTempPassword}
                        onChange={(e) => setNewCustTempPassword(e.target.value)}
                        className="w-full pl-3 pr-10 py-2 bg-white text-black font-mono font-medium border border-black/20 rounded outline-none focus:border-[#1E6FD9]"
                        placeholder="e.g. Aqua2026!"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCustTempPassword(!showCustTempPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black/50 hover:text-black cursor-pointer p-0.5"
                        title={showCustTempPassword ? 'Hide password' : 'Show password'}
                      >
                        {showCustTempPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                      </button>
                    </div>
                    <p className="text-[11px] text-black/50 mt-1">
                      Customer will use this password to sign in and will be asked to update it upon first login.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-black/10 pt-3">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setShowAddCustomerModal(false)}
                      disabled={isSubmittingCust}
                    >
                      Cancel
                    </Button>
                    <Button variant="primary" type="submit" disabled={isSubmittingCust}>
                      {isSubmittingCust ? 'Registering...' : 'Register Customer'}
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          </div>,
          document.body
        )}

      {/* 3. Register Staff Modal */}
      {showAddStaffModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-white p-5 rounded-md shadow-2xl border border-black/15 space-y-4">
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-[#1E6FD9]/10 text-[#1E6FD9] flex items-center justify-center">
                    <IconUsers size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-black leading-tight">
                      Register Field Technician
                    </h3>
                    <p className="text-[11px] text-black/50">
                      Provision staff account with temporary password & assigned area
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (staffCreatedSuccess) {
                      setActiveRole('staff');
                    }
                    setShowAddStaffModal(false);
                    setStaffCreatedSuccess(null);
                  }}
                  className="p-1 text-black/50 hover:text-black cursor-pointer rounded hover:bg-black/5"
                >
                  <IconX size={18} />
                </button>
              </div>

              {addStaffNotice && (
                <div className="p-2.5 text-xs bg-red-50 text-red-700 border border-red-200 rounded">
                  {addStaffNotice}
                </div>
              )}

              {staffCreatedSuccess ? (
                <div className="space-y-4">
                  <div className="p-3.5 bg-green-50 border border-green-200 rounded text-black space-y-1.5">
                    <div className="flex items-center gap-2 text-green-700 font-bold text-xs sm:text-sm">
                      <IconCheck size={18} className="shrink-0" />
                      <span>Staff Account Provisioned Successfully!</span>
                    </div>
                    <p className="text-[11px] text-black/70">
                      The account is active. Provide these temporary credentials to the technician. They will be required to create a new password on first login.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-black/15 rounded p-3.5 space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-black/5">
                      <span className="text-black/60 font-medium">Technician Name:</span>
                      <span className="font-bold text-black">{staffCreatedSuccess.user.name}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-black/5">
                      <span className="text-black/60 font-medium">Login Mobile Number:</span>
                      <span className="font-mono font-bold text-black">{staffCreatedSuccess.user.mobile_number}</span>
                    </div>
                    {staffCreatedSuccess.user.email && (
                      <div className="flex justify-between items-center py-1 border-b border-black/5">
                        <span className="text-black/60 font-medium">Email Address:</span>
                        <span className="font-mono text-black">{staffCreatedSuccess.user.email}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-1.5 bg-white px-2.5 rounded border border-black/10 mt-1">
                      <span className="text-black/70 font-semibold flex items-center gap-1">
                        <IconKey size={13} className="text-[#1E6FD9]" />
                        <span>Temporary Password:</span>
                      </span>
                      <span className="font-mono font-bold text-sm text-[#1E6FD9] tracking-wider select-all">
                        {staffCreatedSuccess.tempPassword}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-black/10 pt-3">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => {
                        const info = `AquaTrack Staff Credentials:\nName: ${staffCreatedSuccess.user.name}\nMobile: ${staffCreatedSuccess.user.mobile_number}\nTemporary Password: ${staffCreatedSuccess.tempPassword}\nPortal: ${window.location.origin}/login`;
                        navigator.clipboard.writeText(info);
                        setCopiedCredentials(true);
                        setTimeout(() => setCopiedCredentials(false), 2500);
                      }}
                      className="flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <IconCopy size={14} />
                      <span>{copiedCredentials ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
                    </Button>

                    <Button
                      variant="primary"
                      type="button"
                      onClick={() => {
                        setActiveRole('staff');
                        setShowAddStaffModal(false);
                        setStaffCreatedSuccess(null);
                      }}
                      className="text-xs font-semibold"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAddStaffSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-black mb-1">
                      Full Name <span className="text-[#E53935]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pedro Penduko"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-black border border-black/20 rounded outline-none focus:border-[#1E6FD9]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-black mb-1">
                      Mobile Number <span className="text-[#E53935]">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="09123456789"
                      value={newStaffMobile}
                      onChange={(e) => setNewStaffMobile(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-black border border-black/20 rounded outline-none focus:border-[#1E6FD9]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-black mb-1">Email Address (Optional)</label>
                    <input
                      type="email"
                      placeholder="pedro@sinacaban.gov.ph"
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-black border border-black/20 rounded outline-none focus:border-[#1E6FD9]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-black mb-1">Primary Assigned Barangay</label>
                    <select
                      value={newStaffBarangayId}
                      onChange={(e) => setNewStaffBarangayId(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white text-black border border-black/20 rounded outline-none focus:border-[#1E6FD9]"
                    >
                      <option value="">General Municipal Utility (All Barangays)</option>
                      {barangays.map((bg) => (
                        <option key={bg.id} value={bg.id}>
                          {bg.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Temporary Password Field (Editable with generator and toggle) */}
                  <div className="pt-1 border-t border-black/10">
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-black flex items-center gap-1.5">
                        <IconKey size={14} className="text-[#1E6FD9]" />
                        <span>Temporary Password</span>
                        <span className="text-[10px] text-black/50 font-normal">(Initial login)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setNewStaffTempPassword(generateStaffPassword())}
                        className="text-[11px] font-semibold text-[#1E6FD9] hover:underline flex items-center gap-1 cursor-pointer"
                        title="Generate random secure password"
                      >
                        <IconRefresh size={12} />
                        <span>Regenerate</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showTempPassword ? 'text' : 'password'}
                        required
                        value={newStaffTempPassword}
                        onChange={(e) => setNewStaffTempPassword(e.target.value)}
                        className="w-full pl-3 pr-10 py-2 bg-white text-black font-mono font-medium border border-black/20 rounded outline-none focus:border-[#1E6FD9]"
                        placeholder="e.g. Staff2026!"
                      />
                      <button
                        type="button"
                        onClick={() => setShowTempPassword(!showTempPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black/50 hover:text-black cursor-pointer p-0.5"
                        title={showTempPassword ? 'Hide password' : 'Show password'}
                      >
                        {showTempPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                      </button>
                    </div>
                    <p className="text-[11px] text-black/50 mt-1">
                      You can keep this generated password or enter a custom one. The staff member will be required to change it upon first login.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-black/10 pt-3">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setShowAddStaffModal(false)}
                      disabled={isSubmittingStaff}
                    >
                      Cancel
                    </Button>
                    <Button variant="primary" type="submit" disabled={isSubmittingStaff}>
                      {isSubmittingStaff ? 'Registering...' : 'Register Staff'}
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          </div>,
          document.body
        )}

      {/* 4. Update User Information Modal */}
      {showEditUserModal && userToEdit &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-white p-5 rounded-md shadow-2xl border border-black/15 space-y-4">
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <div className="flex items-center gap-2">
                  <IconPencil size={18} className="text-[#1E6FD9]" />
                  <h3 className="text-base font-bold text-black">
                    Update User Information
                  </h3>
                </div>
                <button
                  onClick={() => setShowEditUserModal(false)}
                  className="p-1 text-black/50 hover:text-black cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEditUser} className="space-y-3 text-xs">
                {/* Profile Photo Preview & Change */}
                <div className="flex items-center gap-3 p-3 bg-black/5 rounded-md border border-black/10">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-black/20 shrink-0 bg-[#1E6FD9]/15 flex items-center justify-center">
                    <img
                      src={editAvatar || getUserPhoto(userToEdit)}
                      alt={editName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-black block">Profile Photo</span>
                    <span className="text-[11px] text-black/50 block">JPG or PNG (max 2 MB)</span>
                    <label className="mt-1 inline-block text-xs font-semibold text-[#1E6FD9] hover:underline cursor-pointer">
                      Change Photo
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 2 * 1024 * 1024) {
                            setEditPhotoError('Photo must not exceed 2 MB.');
                            return;
                          }
                          setEditPhotoError(null);
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              setEditAvatar(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                    {editPhotoError && (
                      <span className="text-[11px] text-red-600 block">{editPhotoError}</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-black mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-black border border-black/20 rounded outline-none focus:border-[#1E6FD9]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-black mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-black border border-black/20 rounded outline-none focus:border-[#1E6FD9]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-black mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-black border border-black/20 rounded outline-none focus:border-[#1E6FD9]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-black mb-1">Barangay Jurisdiction</label>
                  <select
                    value={editBarangayId}
                    onChange={(e) => setEditBarangayId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white text-black border border-black/20 rounded outline-none focus:border-[#1E6FD9]"
                  >
                    <option value="">None / General Utility</option>
                    {barangays.map((bg) => (
                      <option key={bg.id} value={bg.id}>
                        {bg.name}
                      </option>
                    ))}
                  </select>
                </div>

                {userToEdit.role === 'customer' && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="edit-verified"
                      checked={editIsVerified}
                      onChange={(e) => setEditIsVerified(e.target.checked)}
                      className="w-4 h-4 rounded border-black/20 text-[#1E6FD9] focus:ring-[#1E6FD9] cursor-pointer"
                    />
                    <label htmlFor="edit-verified" className="text-xs font-bold text-black cursor-pointer">
                      Account Verified & Meter Assigned
                    </label>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 border-t border-black/10 pt-3">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setShowEditUserModal(false)}
                    disabled={isSubmittingEdit}
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" disabled={isSubmittingEdit}>
                    {isSubmittingEdit ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>,
          document.body
        )}

      {/* 5. Delete Single User Confirmation Modal */}
      {showDeleteModal && userToDelete &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
            <Card className="w-full max-w-sm bg-white p-5 rounded-md shadow-2xl border border-black/15 space-y-4">
              <div className="flex items-center gap-3 text-[#E53935]">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <IconAlertTriangle size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-black">
                    Delete User Account
                  </h3>
                  <p className="text-xs text-black/60">
                    Are you sure you want to remove this account?
                  </p>
                </div>
              </div>

              <div className="p-3 bg-black/5 rounded text-xs space-y-1">
                <div className="font-bold text-black">{getUserDisplayName(userToDelete)}</div>
                <div className="text-black/60">{userToDelete.email || userToDelete.mobile_number}</div>
                <div className="text-[11px] text-black/50 capitalize">Role: {userToDelete.role}</div>
              </div>

              {userToDelete.role === 'staff' && (staffOpenTasksCount[userToDelete.id] || 0) > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded text-xs text-amber-900 font-medium">
                  This staff member has {staffOpenTasksCount[userToDelete.id]} open task(s) (Assigned or In progress) and cannot be deactivated until the tasks are reassigned.
                </div>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-black/10 pt-3">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </Button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={userToDelete.role === 'staff' && (staffOpenTasksCount[userToDelete.id] || 0) > 0}
                  className="px-3.5 py-1.5 text-xs font-bold rounded bg-[#E53935] hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </Card>
          </div>,
          document.body
        )}

      {/* 6. Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
            <Card className="w-full max-w-sm bg-white p-5 rounded-md shadow-2xl border border-black/15 space-y-4">
              <div className="flex items-center gap-3 text-[#E53935]">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <IconTrash size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-black">
                    Bulk Delete Accounts
                  </h3>
                  <p className="text-xs text-black/60">
                    This action will delete {selectedUserIds.length} selected user accounts.
                  </p>
                </div>
              </div>

              <p className="text-xs text-black/70 bg-black/5 p-3 rounded">
                You are about to permanently delete <strong>{selectedUserIds.length}</strong> selected accounts from AquaTrack. An undo action will be available temporarily.
              </p>

              <div className="flex items-center justify-end gap-2 border-t border-black/10 pt-3">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowBulkDeleteModal(false)}
                >
                  Cancel
                </Button>
                <button
                  type="button"
                  onClick={handleConfirmBulkDelete}
                  className="px-3.5 py-1.5 text-xs font-bold rounded bg-[#E53935] hover:bg-red-700 text-white transition-colors cursor-pointer"
                >
                  Delete {selectedUserIds.length} Users
                </button>
              </div>
            </Card>
          </div>,
          document.body
        )}

      {/* Modern System Modal for alerts, credentials & confirmations */}
      <SystemModal
        isOpen={systemModal.isOpen}
        onClose={() => setSystemModal((m) => ({ ...m, isOpen: false }))}
        type={systemModal.type}
        title={systemModal.title}
        message={systemModal.message}
        confirmText={systemModal.confirmText}
        cancelText={systemModal.cancelText}
        onConfirm={systemModal.onConfirm}
        isDestructive={systemModal.isDestructive}
        credentials={systemModal.credentials}
        details={systemModal.details}
      />
    </AdminLayout>
  );
}
