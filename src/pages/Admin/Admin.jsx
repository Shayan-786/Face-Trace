import { useState, useSyncExternalStore } from 'react'
import Button from '../../components/Button/Button'
import Card from '../../components/Card/Card'
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog'
import ConfidenceBar from '../../components/ConfidenceBar/ConfidenceBar'
import { getCurrentUser, getAdminUsers, setUserActive } from '../../services/auth'
import { getAdminRecords, deleteAdminRecord } from '../../services/analysis'
import { subscribeToStorage } from '../../services/storage'

function getSnapshot() {
  if (getCurrentUser()?.role !== 'admin') {
    return '{"users":[],"records":[]}'
  }
  return JSON.stringify({ users: getAdminUsers(), records: getAdminRecords() })
}

function Admin() {
  const snapshot = useSyncExternalStore(subscribeToStorage, getSnapshot)
  const { users, records } = JSON.parse(snapshot)

  const [tab, setTab] = useState('users')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [pending, setPending] = useState(null)
  const [message, setMessage] = useState('')
  const search = query.trim().toLowerCase()
  const filteredUsers = users.filter((user) =>
    `${user.username} ${user.email}`.toLowerCase().includes(search),
  )
  const filteredRecords = records.filter((record) =>
    `${record.filename} ${users.find((user) => user.id === record.ownerId)?.username}`
      .toLowerCase()
      .includes(search),
  )

  function confirmAction() {
    try {
      if (pending.kind === 'user') {
        setUserActive(pending.email, pending.active)
        setMessage('User status updated.')
      } else {
        deleteAdminRecord(pending.id)
        if (selected?.id === pending.id) {
          setSelected(null)
        }
        setMessage('Video record removed.')
      }
    } catch (failure) {
      setMessage(failure.message)
    }
    setPending(null)
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1>Admin panel</h1>
          <p className="muted">User management and analysis record review.</p>
        </div>
      </div>
      <p className="notice">
        Browser-local administration: these totals cover users and saved video details in
        this browser only. Actual uploads and secure permissions require the backend.
      </p>
      <div className="two-column">
        <Card title="Registered users">
          <strong>{users.length}</strong>
          <p>{users.filter((user) => user.active).length} active</p>
        </Card>
        <Card title="Total video records">
          <strong>{records.length}</strong>
          <p>Saved file details across all users</p>
        </Card>
      </div>
      <div
        className="admin-tabs"
        role="group"
        aria-label="Admin views"
      >
        <Button
          variant={tab === 'users' ? 'primary' : 'secondary'}
          aria-pressed={tab === 'users'}
          onClick={() => {
            setTab('users')
            setQuery('')
            setSelected(null)
          }}
        >
          Users ({users.length})
        </Button>
        <Button
          variant={tab === 'records' ? 'primary' : 'secondary'}
          aria-pressed={tab === 'records'}
          onClick={() => {
            setTab('records')
            setQuery('')
          }}
        >
          Analysis records ({records.length})
        </Button>
      </div>
      <label className="search-field">
        {tab === 'users' ? 'Search users' : 'Search records'}
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={tab === 'users' ? 'Name or email' : 'Filename or user'}
        />
      </label>
      <p
        className="status-message"
        role="status"
      >
        {message}
      </p>
      <Card
        title={tab === 'users' ? 'Registered users' : 'All video records'}
        noPadding
      >
        <div
          className="records-table-wrap"
          role="region"
          aria-label={tab === 'users' ? 'Registered users' : 'All video records'}
          tabIndex={0}
        >
          {tab === 'users' ? (
            <table className="records-table">
              <thead>
                <tr>
                  <th scope="col">User</th>
                  <th scope="col">Email</th>
                  <th scope="col">Videos</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.email}>
                    <th scope="row">{user.username}</th>
                    <td>{user.email}</td>
                    <td>
                      {records.filter((record) => record.ownerId === user.id).length}
                    </td>
                    <td>{user.active ? 'Active' : 'Suspended'}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          setPending({
                            kind: 'user',
                            email: user.email,
                            active: !user.active,
                            title: `${user.active ? 'Suspend' : 'Reactivate'} ${user.username}?`,
                            label: user.active ? 'Suspend user' : 'Reactivate user',
                          })
                        }
                      >
                        {user.active ? 'Suspend' : 'Reactivate'}
                      </Button>
                    </td>
                  </tr>
                ))}
                {!filteredUsers.length && (
                  <tr>
                    <td colSpan={5}>
                      {users.length
                        ? 'No users match your search.'
                        : 'No registered users yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="records-table">
              <thead>
                <tr>
                  <th scope="col">File</th>
                  <th scope="col">User</th>
                  <th scope="col">Visual prediction</th>
                  <th scope="col">Model score</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <th scope="row">{record.filename}</th>
                    <td>
                      {record.ownerId === 'local-admin'
                        ? 'Administrator'
                        : users.find((user) => user.id === record.ownerId)?.username ||
                          'Unknown user'}
                    </td>
                    <td>{record.visual || 'Not analysed'}</td>
                    <td>
                      <ConfidenceBar value={record.confidence} />
                    </td>
                    <td>
                      <div className="action-row">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelected(record)}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`Delete ${record.filename}`}
                          onClick={() =>
                            setPending({
                              kind: 'record',
                              id: record.id,
                              title: 'Delete video record?',
                              label: 'Delete record',
                            })
                          }
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filteredRecords.length && (
                  <tr>
                    <td colSpan={5}>No records match your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>
      {selected && (
        <Card title={`Video record: ${selected.filename}`}>
          <dl className="details-list">
            <dt>Visual prediction</dt>
            <dd>{selected.visual || 'Not analysed'}</dd>
            <dt>Audio assessment</dt>
            <dd>{selected.audio || 'Not analysed'}</dd>
            <dt>Model score</dt>
            <dd>
              <ConfidenceBar value={selected.confidence} />
            </dd>
          </dl>
          <Button
            variant="ghost"
            onClick={() => setSelected(null)}
          >
            Close details
          </Button>
        </Card>
      )}
      <ConfirmDialog
        open={Boolean(pending)}
        title={pending?.title || 'Confirm action'}
        description={
          pending?.kind === 'user'
            ? 'Suspended users cannot sign in. Their records are kept, and you can reactivate them here.'
            : 'Permanently delete this saved record from this browser and the user history? The original video file is not affected.'
        }
        confirmLabel={pending?.label || 'Confirm'}
        onCancel={() => setPending(null)}
        onConfirm={confirmAction}
      />
    </div>
  )
}

export default Admin
