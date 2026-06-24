import { useMemo, useState } from 'react';
import { AlertCircle, BellRing, Filter, MailOpen, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Skeleton } from '@/components/ui/Loader';
import { useAsync } from '@/hooks/useAsync';
import { useAppContext } from '@/context/AppContext';
import { listNotifications, markNotificationRead } from '@/services/notificationService';
import { formatDateTimeDetailed } from '@/utils/formatters';

function NotificationSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
    </div>
  );
}

function getNotificationId(note) {
  return note?._id || note?.id || '';
}

export function Notifications() {
  const { runWithLoading } = useAppContext();
  const { data, loading, error, execute, setData } = useAsync(() => listNotifications({ limit: 100 }));
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [readFilter, setReadFilter] = useState('all');

  const notifications = data?.data || [];
  const categories = useMemo(() => [...new Set(notifications.map((item) => item.category).filter(Boolean))], [notifications]);

  const filtered = useMemo(() => {
    return notifications.filter((note) => {
      const values = [note.title, note.body, note.category, note.priority];
      const matchesSearch =
        search.trim().length === 0 || values.some((value) => String(value || '').toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || note.category === categoryFilter;
      const matchesRead =
        readFilter === 'all' ||
        (readFilter === 'read' && note.read) ||
        (readFilter === 'unread' && !note.read);
      return matchesSearch && matchesCategory && matchesRead;
    });
  }, [categoryFilter, notifications, readFilter, search]);

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setReadFilter('all');
  };

  const markAllRead = async () => {
    await runWithLoading(
      async () => {
        await Promise.all(
          notifications.filter((note) => !note.read).map((note) => markNotificationRead(getNotificationId(note), true)),
        );
        await execute();
        toast.success('All notifications marked as read');
      },
      { errorMessage: 'Unable to update notifications' },
    );
  };

  const toggleRead = async (note) => {
    await runWithLoading(
      async () => {
        const nextRead = !note.read;
        const response = await markNotificationRead(getNotificationId(note), nextRead);
        setData((current) => ({
          ...current,
          data: (current?.data || []).map((item) => {
            if (getNotificationId(item) !== getNotificationId(note)) return item;
            return response.data || { ...item, read: nextRead };
          }),
        }));
        toast.success(nextRead ? 'Marked as read' : 'Marked as unread');
      },
      { errorMessage: 'Unable to update notification' },
    );
  };

  if (loading && !data) {
    return <NotificationSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <ErrorMessage title="Notifications unavailable" message={error.message} icon={AlertCircle} />
        <Button onClick={execute}>Retry</Button>
      </div>
    );
  }

  if (!notifications.length) {
    return (
      <EmptyState
        title="No notifications"
        description="Once events are logged, reminders and readiness updates will appear here."
        actionLabel="Refresh"
        onAction={execute}
      />
    );
  }

  const unreadCount = notifications.filter((note) => !note.read).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Activity feed"
        title="Notifications center"
        description="Filter read and unread events, sort by category, and keep track of placement updates."
        actions={<Button variant="secondary" icon={MailOpen} onClick={markAllRead}>Mark all read</Button>}
      />

      <Card>
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr_0.7fr_auto]">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-200">Search notifications</span>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, body, category"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </div>
          </label>
          <Select label="Category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
          <Select label="Read state" value={readFilter} onChange={(event) => setReadFilter(event.target.value)}>
            <option value="all">All</option>
            <option value="unread">Unread only</option>
            <option value="read">Read only</option>
          </Select>
          <div className="flex items-end">
            <Button variant="secondary" icon={Filter} onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Badge tone="warning">{unreadCount} unread</Badge>
        <Badge tone="info">{notifications.length} total</Badge>
      </div>

      {filtered.length ? (
        <div className="space-y-4">
          {filtered.map((note, index) => (
            <motion.div
              key={getNotificationId(note)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <Card className={!note.read ? 'border-brand-400/30 bg-brand-500/10' : ''}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-brand-200">
                      <BellRing className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">{note.title}</h3>
                        {!note.read ? <Badge tone="warning">Unread</Badge> : <Badge tone="success">Read</Badge>}
                      </div>
                      <p className="text-sm leading-6 text-slate-400">{note.body}</p>
                      <p className="text-xs text-slate-500">{formatDateTimeDetailed(note.createdAt || note.updatedAt)}</p>
                    </div>
                  </div>
                  <Badge tone={note.priority === 'high' ? 'warning' : note.priority === 'medium' ? 'info' : 'neutral'}>
                    {note.category}
                  </Badge>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Button variant="secondary" size="sm" onClick={() => toggleRead(note)}>
                    {note.read ? 'Mark unread' : 'Mark read'}
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No notifications match your filters"
          description="Try clearing the filters or search another category to see more events."
          actionLabel="Clear filters"
          onAction={clearFilters}
        />
      )}
    </div>
  );
}
