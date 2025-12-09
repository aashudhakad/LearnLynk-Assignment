'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function TaskDashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  async function fetchTasks() {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  async function markAsComplete(taskId: string) {
    setUpdating(taskId);

    const { error } = await supabase
      .from('tasks')
      .update({ status: 'completed' })
      .eq('id', taskId);

    if (error) {
      alert('Error updating task');
      console.error(error);
    } else {
      await fetchTasks();
    }
    setUpdating(null);
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', backgroundColor: '#111', minHeight: '100vh', color: 'white' }}>
      <h1 style={{ marginBottom: '20px', textAlign: 'center', fontWeight: 'bold' }}>Tasks Due Today</h1>

      {loading ? (
        <p>Loading tasks...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#222', borderRadius: '8px', overflow: 'hidden' }}>
          <thead>
            <tr style={{ backgroundColor: '#333', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>TASK TITLE</th>
              <th style={{ padding: '12px' }}>RELATED APP ID</th>
              <th style={{ padding: '12px' }}>DUE DATE</th>
              <th style={{ padding: '12px' }}>STATUS</th>
              <th style={{ padding: '12px' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                  No tasks due today.
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.id} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '12px' }}>{task.title || 'Untitled'}</td>
                  <td style={{ padding: '12px', fontSize: '12px', color: '#aaa' }}>{task.related_id}</td>
                  <td style={{ padding: '12px' }}>
                    {new Date(task.due_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: task.status === 'completed' ? '#2e7d32' : '#ed6c02',
                        color: 'white',
                      }}
                    >
                      {task.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {task.status !== 'completed' && (
                      <button
                        onClick={() => markAsComplete(task.id)}
                        disabled={updating === task.id}
                        style={{
                          padding: '6px 12px',
                          cursor: 'pointer',
                          backgroundColor: '#1976d2',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          opacity: updating === task.id ? 0.7 : 1,
                        }}
                      >
                        {updating === task.id ? 'Updating...' : 'Mark Complete'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}