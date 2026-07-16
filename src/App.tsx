/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Mail, LogOut, Loader2, ArrowLeft, Trash2, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { EmailConfig, EmailMeta, EmailBody } from './types';

export default function App() {
  const [config, setConfig] = useState<EmailConfig | null>(null);
  
  if (!config) {
    return <LoginForm onLogin={setConfig} />;
  }
  
  return <EmailDashboard config={config} onLogout={() => setConfig(null)} />;
}

function LoginForm({ onLogin }: { onLogin: (config: EmailConfig) => void }) {
  const [protocol, setProtocol] = useState<'IMAP' | 'POP3'>('IMAP');
  const [host, setHost] = useState('imap.yandex.com');
  const [port, setPort] = useState(993);
  const [secure, setSecure] = useState(true);
  const [email, setEmail] = useState('ople.test@yandex.com');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({ protocol, host, port, secure, email, password });
  };

  const handleProtocolChange = (newProtocol: 'IMAP' | 'POP3') => {
    setProtocol(newProtocol);
    if (newProtocol === 'IMAP') {
      setHost('imap.yandex.com');
      setPort(993);
    } else {
      setHost('pop.yandex.com');
      setPort(995);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-blue-600">
          <Mail className="w-12 h-12" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your Email
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          App passwords are required for Gmail, Yandex, etc.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={protocol === 'IMAP'}
                  onChange={() => handleProtocolChange('IMAP')}
                  className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="text-sm font-medium text-gray-700">IMAP</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={protocol === 'POP3'}
                  onChange={() => handleProtocolChange('POP3')}
                  className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="text-sm font-medium text-gray-700">POP3</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">App Password</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Server Host</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={host}
                    onChange={e => setHost(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Port</label>
                <div className="mt-1">
                  <input
                    type="number"
                    required
                    value={port}
                    onChange={e => setPort(parseInt(e.target.value, 10))}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="secure"
                type="checkbox"
                checked={secure}
                onChange={e => setSecure(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="secure" className="ml-2 block text-sm text-gray-900">
                Use Secure Connection (SSL/TLS)
              </label>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Connect Inbox
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function EmailDashboard({ config, onLogout }: { config: EmailConfig, onLogout: () => void }) {
  const [emails, setEmails] = useState<EmailMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [localReadIds, setLocalReadIds] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [showSnippets, setShowSnippets] = useState<boolean>(true);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [deleteProgress, setDeleteProgress] = useState<{current: number, total: number} | null>(null);

  const fetchEmails = async () => {
    setLoading(true);
    setError(null);
    setSelectedForDelete(new Set());
    try {
      const res = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch emails');
      }
      const data = await res.json();
      setEmails(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (selectedEmailId) {
        if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'h') {
          setSelectedEmailId(null);
        } else if (e.key === 'd') {
          handleDelete(selectedEmailId);
        }
      } else {
        if (e.key === 'j') {
          setFocusedIndex(prev => Math.min(emails.length - 1, prev + 1));
        } else if (e.key === 'k') {
          setFocusedIndex(prev => Math.max(0, prev - 1));
        } else if (e.key === 'Enter') {
          if (focusedIndex >= 0 && focusedIndex < emails.length) {
            handleSelectEmail(emails[focusedIndex].id);
          }
        } else if (e.key === 'd') {
          if (focusedIndex >= 0 && focusedIndex < emails.length) {
            handleDelete(emails[focusedIndex].id);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEmailId, emails, focusedIndex]);

  const handleSelectEmail = (id: string) => {
    setSelectedEmailId(id);
    setLocalReadIds(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
  };

  const handleBulkDelete = async () => {
    setLoading(true);
    setDeleteProgress({ current: 0, total: selectedForDelete.size });
    let current = 0;
    try {
      for (const id of Array.from(selectedForDelete)) {
        const res = await fetch(`/api/emails/${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to delete email');
        }
        current++;
        setDeleteProgress({ current, total: selectedForDelete.size });
      }
      setSelectedForDelete(new Set());
      fetchEmails();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    } finally {
      setDeleteProgress(null);
    }
  };

  const toggleSelectForDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedForDelete(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedForDelete(new Set(emails.map(e => e.id)));
    } else {
      setSelectedForDelete(new Set());
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    
    
    try {
      const res = await fetch(`/api/emails/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete email');
      }
      if (selectedEmailId === id) setSelectedEmailId(null);
      fetchEmails(); // refresh list
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (selectedEmailId) {
    return (
      <EmailViewer 
        id={selectedEmailId} 
        config={config} 
        onBack={() => setSelectedEmailId(null)}
        onDelete={() => handleDelete(selectedEmailId)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-900">
            <Mail className="w-6 h-6 text-blue-600" />
            <h1 className="text-lg font-semibold">Inbox ({config.email})</h1>
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md">{config.protocol}</span>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Disconnect</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center bg-gray-50">
            <div className="flex items-center space-x-4">
              <input 
                type="checkbox"
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                checked={emails.length > 0 && selectedForDelete.size === emails.length}
                onChange={toggleSelectAll}
                title="Select All"
              />
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Messages</h3>
            </div>
            <div className="flex items-center space-x-4">
              {selectedForDelete.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  disabled={loading}
                  className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-800 disabled:opacity-50 font-medium bg-red-50 px-2 py-1 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Selected ({selectedForDelete.size})</span>
                </button>
              )}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showSnippets} 
                  onChange={(e) => setShowSnippets(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-sm text-gray-600 select-none">Show snippets</span>
              </label>
              <button 
                onClick={fetchEmails}
                disabled={loading}
                className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
          </div>
          
          {deleteProgress && (
            <div className="px-4 py-3 bg-red-50 border-b border-red-100">
              <div className="flex justify-between text-sm text-red-700 mb-1 font-medium">
                <span>Deleting emails...</span>
                <span>{deleteProgress.current} / {deleteProgress.total}</span>
              </div>
              <div className="w-full bg-red-200 rounded-full h-2">
                <div 
                  className="bg-red-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(deleteProgress.current / deleteProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {loading ? (
            <ul className="divide-y divide-gray-200">
              {[...Array(5)].map((_, i) => (
                <li key={i} className="px-4 py-4 sm:px-6 flex items-center justify-between animate-pulse">
                  <div className="min-w-0 flex-1 pr-4 space-y-3 py-1">
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="ml-2 h-3 bg-gray-200 rounded w-20" />
                    </div>
                    <div className="mt-2">
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0 w-5 h-5 bg-gray-200 rounded" />
                </li>
              ))}
            </ul>
          ) : error ? (
            <div className="p-12 flex flex-col items-center justify-center text-center text-red-600">
              <ShieldAlert className="w-12 h-12 mb-4 opacity-50" />
              <p>{error}</p>
              <button 
                onClick={onLogout}
                className="mt-4 text-sm text-blue-600 underline"
              >
                Check credentials and try again
              </button>
            </div>
          ) : emails.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No recent emails found.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {emails.map((email, index) => {
                const isUnread = config.protocol === 'IMAP' 
                  ? !email.flags.includes('\\Seen') && !localReadIds.has(email.id)
                  : !localReadIds.has(email.id);
                const isFocused = index === focusedIndex;
                  
                return (
                <li 
                  key={email.id} 
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${isUnread ? 'bg-blue-50/30' : ''} ${isFocused ? 'ring-2 ring-inset ring-blue-500 bg-blue-50/50' : ''}`}
                  onClick={() => handleSelectEmail(email.id)}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                    <div className="mr-4 flex-shrink-0 flex items-center">
                      <input 
                        type="checkbox" 
                        checked={selectedForDelete.has(email.id)}
                        onChange={(e) => toggleSelectForDelete(email.id, e as any)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                    </div>
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 truncate">
                          {isUnread && <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" title="Unread" />}
                          <p className={`text-sm truncate ${isUnread ? 'font-bold text-blue-700' : 'font-medium text-blue-600'}`}>
                            {email.sender}
                          </p>
                        </div>
                        <div className={`ml-2 flex-shrink-0 flex text-sm ${isUnread ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                          {format(new Date(email.date), 'MMM d, h:mm a')}
                        </div>
                      </div>
                      <div className="mt-2 flex flex-col">
                        <div className="sm:flex flex-1 min-w-0">
                          <p className={`flex items-center text-sm truncate ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-900'}`}>
                            {email.subject || '(No Subject)'}
                          </p>
                        </div>
                        {showSnippets && email.snippet && (
                          <p className="mt-1 text-sm text-gray-500 truncate">
                            {email.snippet}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <button
                        onClick={(e) => handleDelete(email.id, e)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                        title="Delete Email"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

function EmailViewer({ id, config, onBack, onDelete }: { id: string, config: EmailConfig, onBack: () => void, onDelete: () => void }) {
  const [email, setEmail] = useState<EmailBody | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const res = await fetch(`/api/emails/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to fetch email');
        }
        const data = await res.json();
        setEmail(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEmail();
  }, [id]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Inbox</span>
          </button>
          <button 
            onClick={onDelete}
            className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-800 transition-colors px-3 py-1.5 rounded-md hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {loading ? (
          <div className="flex justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-600">
            {error}
          </div>
        ) : email ? (
          <article className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-8 border-b border-gray-100 pb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{email.subject || '(No Subject)'}</h1>
              <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row text-sm text-gray-600">
                <div className="mb-2 sm:mb-0">
                  <div className="font-medium text-gray-900">{email.sender}</div>
                  {email.recipient && <div className="text-gray-500 mt-0.5">To: {email.recipient}</div>}
                </div>
                <div>{email.date ? format(new Date(email.date), 'MMMM d, yyyy h:mm a') : ''}</div>
              </div>
            </header>
            
            <div className="prose max-w-none prose-blue">
              {email.html ? (
                <div 
                  dangerouslySetInnerHTML={{ __html: email.html }} 
                  className="email-body-content [&_a]:text-blue-600 [&_a]:underline [&_a]:hover:text-blue-800 transition-colors"
                />
              ) : (
                <p className="whitespace-pre-wrap text-gray-800">No content available.</p>
              )}
            </div>
          </article>
        ) : null}
      </main>
    </div>
  );
}
