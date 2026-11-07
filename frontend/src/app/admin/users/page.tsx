"use client";

import { useMemo, useState } from "react";
import { KeyRound, Pencil, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage, queryString } from "@/lib/api";
import { useApi, useDebounced } from "@/lib/use-api";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { formatDate, formatStatus } from "@/lib/format";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField, Input, Select, CheckRow } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { DataTable, type Column } from "@/components/ui/table";
import { EmptyState, ErrorState } from "@/components/ui/feedback";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

const roles = ["super_admin", "teacher", "student", "guardian", "customer"] as const;

export default function AdminUsersPage() {
  const { locale } = useLanguage();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const debounced = useDebounced(search);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "customer",
    isActive: true
  });
  const [saving, setSaving] = useState(false);
  const [resetFor, setResetFor] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  const users = useApi<{ items: AdminUser[] }>(`/admin/users${queryString({ search: debounced, role })}`);
  const rows = useMemo(() => users.data?.items || [], [users.data]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", email: "", phone: "", password: "", role: "customer", isActive: true });
    setFormOpen(true);
  };

  const openEdit = (user: AdminUser) => {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      password: "",
      role: user.role,
      isActive: user.isActive !== false
    });
    setFormOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api(`/admin/users/${editing._id}`, {
          method: "PATCH",
          body: { name: form.name, phone: form.phone, role: form.role, isActive: form.isActive }
        });
        toast.success("User updated");
      } else {
        await api("/admin/users", {
          method: "POST",
          body: {
            name: form.name,
            email: form.email,
            phone: form.phone,
            password: form.password,
            role: form.role
          }
        });
        toast.success("User created");
      }
      setFormOpen(false);
      users.reload();
    } catch (caught) {
      toast.error(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  const submitReset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resetFor) return;
    setResetting(true);
    try {
      await api(`/admin/users/${resetFor._id}/reset-password`, {
        method: "POST",
        body: { password: newPassword }
      });
      toast.success("Password reset");
      setResetFor(null);
      setNewPassword("");
    } catch (caught) {
      toast.error(errorMessage(caught));
    } finally {
      setResetting(false);
    }
  };

  const columns: Column<AdminUser>[] = [
    {
      key: "name",
      label: "User",
      render: (user) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-950/5 text-xs font-semibold text-brand-900">
            {user.name.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <p className="font-medium text-brand-950">
              {user.name} {currentUser?.id === user._id ? <span className="text-[10px] text-gold-700">(you)</span> : null}
            </p>
            <p className="text-xs text-muted">{user.email}</p>
          </div>
        </div>
      )
    },
    { key: "phone", label: "Phone", render: (user) => user.phone || "—" },
    {
      key: "role",
      label: "Role",
      render: (user) => <Badge tone={user.role === "super_admin" ? "gold" : "neutral"}>{formatStatus(user.role, locale)}</Badge>
    },
    {
      key: "isActive",
      label: "Status",
      render: (user) =>
        user.isActive === false ? <Badge tone="danger">Disabled</Badge> : <Badge tone="success">Active</Badge>
    },
    {
      key: "lastLoginAt",
      label: "Last login",
      render: (user) => (user.lastLoginAt ? formatDate(user.lastLoginAt, locale, true) : "—")
    },
    {
      key: "actions",
      label: "",
      className: "text-end whitespace-nowrap",
      headerClassName: "text-end",
      render: (user) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Reset password"
            onClick={() => {
              setResetFor(user);
              setNewPassword("");
            }}
          >
            <KeyRound className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" title="Edit" onClick={() => openEdit(user)}>
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold-700">System</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-brand-950">Users</h1>
          <p className="mt-1 text-sm text-muted">Portal accounts, roles and access.</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add user
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or email…"
              className="ps-9"
            />
          </div>
          <Select value={role} onChange={(event) => setRole(event.target.value)} className="w-48">
            <option value="">All roles</option>
            {roles.map((value) => (
              <option key={value} value={value}>
                {formatStatus(value, locale)}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {users.error ? (
        <ErrorState description={users.error} onRetry={users.reload} />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          keyFor={(user) => user._id}
          loading={users.loading}
          empty={<EmptyState title="No users found" description="Adjust your filters or create a user." />}
        />
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit user" : "Add user"}
        description={editing ? editing.email : "Create a portal account with a role."}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="user-form" loading={saving}>
              Save user
            </Button>
          </div>
        }
      >
        <form id="user-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <FormField label="Full name" required>
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </FormField>
          <FormField label="Role" required>
            <Select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
              {roles.map((value) => (
                <option key={value} value={value}>
                  {formatStatus(value, locale)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Email" required>
            <Input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              disabled={Boolean(editing)}
              required={!editing}
            />
          </FormField>
          <FormField label="Phone">
            <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </FormField>
          {!editing ? (
            <FormField label="Temporary password" required hint="Minimum 8 characters with a letter and a number." className="sm:col-span-2">
              <Input
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
              />
            </FormField>
          ) : (
            <div className="sm:col-span-2">
              <CheckRow label="Account active" hint="Disabled users cannot sign in.">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-brand-900"
                  checked={form.isActive}
                  onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
                  disabled={currentUser?.id === editing?._id}
                />
              </CheckRow>
            </div>
          )}
        </form>
      </Modal>

      <Modal
        open={Boolean(resetFor)}
        onClose={() => setResetFor(null)}
        title="Reset password"
        description={resetFor ? `${resetFor.name} · ${resetFor.email}` : undefined}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setResetFor(null)}>
              Cancel
            </Button>
            <Button type="submit" form="reset-form" loading={resetting}>
              Reset password
            </Button>
          </div>
        }
      >
        <form id="reset-form" onSubmit={submitReset} className="space-y-4">
          <FormField label="New password" required hint="Minimum 8 characters with a letter and a number.">
            <Input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
