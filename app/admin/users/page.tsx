'use client';

import { useEffect, useState } from 'react';
import { Users, Search } from 'lucide-react';
import { AdminLayout } from '@/components/admin-layout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClientComponentClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';
import type { Profile } from '@/lib/types';

export default function AdminUsersPage() {
  return (
    <AdminLayout>
      <UsersContent />
    </AdminLayout>
  );
}

function UsersContent() {
  const supabase = createClientComponentClient();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error);
        setUsers((data as Profile[]) ?? []);
        setLoading(false);
      });
  }, [supabase]);

  const updateRole = async (id: string, role: string) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) {
      toast.error('Failed to update role');
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: role as Profile['role'] } : u)));
    toast.success('Role updated');
  };

  const filtered = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold">Customers</h1>
      <p className="text-sm text-muted-foreground">Manage customer accounts</p>

      <div className="mt-4 relative max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="mt-6 p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">No customers found.</p>
        </Card>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="p-3 text-left text-sm font-medium">Name</th>
                <th className="hidden p-3 text-left text-sm font-medium sm:table-cell">Email</th>
                <th className="hidden p-3 text-left text-sm font-medium sm:table-cell">Joined</th>
                <th className="p-3 text-left text-sm font-medium">Role</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-medium text-primary">
                        {(u.full_name ?? 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{u.full_name ?? 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden p-3 text-sm sm:table-cell">{u.email}</td>
                  <td className="hidden p-3 text-sm sm:table-cell">{formatDate(u.created_at)}</td>
                  <td className="p-3">
                    <Select value={u.role} onValueChange={(v) => updateRole(u.id, v)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="vendor">Vendor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
