import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button, Icon, IconButton, TextField } from '../../../components/ui';
import { useLearningProgress } from '../hooks/ProgressProvider';

export function AccountControls() {
  const account = useLearningProgress();
  const dialog = useRef<HTMLDialogElement>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  useEffect(() => {
    if (account.accountOpen) dialog.current?.showModal();
    else { dialog.current?.close(); setPassword(''); }
  }, [account.accountOpen]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (await account.signIn({ username, password })) setPassword('');
  }

  return <>
    <Button variant="secondary" className="account-trigger" onClick={account.openAccount} disabled={account.loading}>
      <Icon name={account.user ? 'bookmark' : 'book'} size={15} />
      <span>{account.loading ? 'Account…' : account.user ? 'My account' : 'Sign in'}</span>
    </Button>
    <dialog className="account-dialog" ref={dialog} aria-labelledby="account-heading" onClose={account.closeAccount}
      onClick={(event) => { if (event.target === event.currentTarget && !account.busy) account.closeAccount(); }}>
      <div className="account-dialog-header"><span className="progress-eyebrow">YOUR ALEXANDRIA</span><IconButton aria-label="Close account" onClick={account.closeAccount}><Icon name="x" /></IconButton></div>
      <h2 id="account-heading">{account.user ? `Hello, ${account.user.displayName}.` : 'Keep your place.'}</h2>
      <p>{account.user ? 'Your reading, XP, and goals are saved to your account on this server.' : 'Sign in to save your reading, collect XP, and choose a weekly goal. Every course is open to explore.'}</p>
      {account.error && <p className="progress-error" role="alert">{account.error}</p>}
      {account.user ? <Button variant="secondary" disabled={account.busy} onClick={() => void account.signOut()}>{account.busy ? 'Please wait…' : 'Sign out'}</Button>
        : <form onSubmit={(event) => void submit(event)}>
          <TextField id="account-username" label="Username" autoComplete="username" required maxLength={40} value={username} disabled={account.busy} onChange={(event) => setUsername(event.target.value)} />
          <TextField id="account-password" label="Password" type="password" autoComplete="current-password" required maxLength={256} value={password} disabled={account.busy} onChange={(event) => setPassword(event.target.value)} />
          <Button type="submit" disabled={account.busy}>{account.busy ? 'Signing in…' : 'Sign in'}<Icon name="arrow-right" size={16} /></Button>
          <p className="account-help">Use an account created by your Alexandria administrator.</p>
        </form>}
    </dialog>
  </>;
}
