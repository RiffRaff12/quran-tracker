import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface PendingUser {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
}

export default function AdminPendingUsers() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  // Check if current user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();
      if (error || !data?.is_admin) {
        setIsAdmin(false);
      } else {
        setIsAdmin(true);
      }
      setLoading(false);
    };
    checkAdmin();
  }, []);

  // Fetch pending users
  useEffect(() => {
    if (!isAdmin) return;
    const fetchPending = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('pending_users')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error loading pending users',
          description: error.message,
        });
      } else {
        setPendingUsers(data || []);
      }
      setLoading(false);
    };
    fetchPending();
  }, [isAdmin]);

  // Approve user: create auth user, create user_profiles, remove from pending_users
  const handleApprove = async (user: PendingUser) => {
    setLoading(true);
    // 1. Create user in Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email: user.email,
      email_confirm: false,
    });
    if (signUpError || !signUpData?.user) {
      toast({
        variant: 'destructive',
        title: 'Error creating user',
        description: signUpError?.message || 'No user returned',
      });
      setLoading(false);
      return;
    }
    // 2. Create user_profiles row
    const { error: profileError } = await supabase.from('user_profiles').insert({
      user_id: signUpData.user.id,
      is_admin: false,
    });
    if (profileError) {
      toast({
        variant: 'destructive',
        title: 'Error creating profile',
        description: profileError.message,
      });
      setLoading(false);
      return;
    }
    // 3. Remove from pending_users
    const { error: deleteError } = await supabase.from('pending_users').delete().eq('id', user.id);
    if (deleteError) {
      toast({
        variant: 'destructive',
        title: 'Error removing pending user',
        description: deleteError.message,
      });
    } else {
      toast({
        title: 'User approved',
        description: `${user.email} has been approved.`,
      });
      setPendingUsers((prev) => prev.filter((u) => u.id !== user.id));
    }
    setLoading(false);
  };

  // Reject user: remove from pending_users
  const handleReject = async (user: PendingUser) => {
    setLoading(true);
    const { error } = await supabase.from('pending_users').delete().eq('id', user.id);
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error removing pending user',
        description: error.message,
      });
    } else {
      toast({
        title: 'User rejected',
        description: `${user.email} has been rejected.`,
      });
      setPendingUsers((prev) => prev.filter((u) => u.id !== user.id));
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }
  if (!isAdmin) {
    return <div className="p-8 text-center text-red-600 font-semibold">Access denied. Admins only.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex items-center justify-center p-2 sm:p-4 w-full max-w-full">
      <Card className="w-full max-w-2xl p-2 sm:p-4">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Pending User Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingUsers.length === 0 ? (
            <div className="text-center text-gray-600 py-8">No pending users.</div>
          ) : (
            <div className="space-y-4">
              {/* Mobile: stacked cards, Desktop: table */}
              <div className="block md:hidden w-full">
                {pendingUsers.map((user) => (
                  <div key={user.id} className="border rounded-lg p-3 flex flex-col gap-2 w-full">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-sm break-all">{user.email}</span>
                      <span className="text-xs text-gray-500">Requested: {new Date(user.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col gap-2 mt-2">
                      <Button
                        variant="default"
                        className="h-12 w-full"
                        onClick={() => handleApprove(user)}
                        disabled={loading}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        className="h-12 w-full"
                        onClick={() => handleReject(user)}
                        disabled={loading}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden md:block">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border-b">Email</th>
                      <th className="py-2 px-4 border-b">Requested At</th>
                      <th className="py-2 px-4 border-b">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="py-2 px-4 border-b break-all">{user.email}</td>
                        <td className="py-2 px-4 border-b">{new Date(user.created_at).toLocaleString()}</td>
                        <td className="py-2 px-4 border-b">
                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              className="h-10"
                              onClick={() => handleApprove(user)}
                              disabled={loading}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              className="h-10"
                              onClick={() => handleReject(user)}
                              disabled={loading}
                            >
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 