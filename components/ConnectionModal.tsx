'use client'

import { useState } from 'react'
import { Database } from 'lucide-react'
import { DatabaseConnection, DatabaseType } from '@/types'
import { Modal, Input, Select, Checkbox, Button, type SelectOption } from '@/components'

interface ConnectionModalProps {
  connection?: DatabaseConnection | null
  onClose: () => void
  onSave: (connection: DatabaseConnection) => void
}

const DATABASE_TYPES: { value: DatabaseType; label: string; defaultPort: number }[] = [
  { value: 'postgresql', label: 'PostgreSQL', defaultPort: 5432 },
  { value: 'mysql', label: 'MySQL', defaultPort: 3306 },
  { value: 'sqlite', label: 'SQLite', defaultPort: 0 },
  { value: 'mongodb', label: 'MongoDB', defaultPort: 27017 },
  { value: 'redis', label: 'Redis', defaultPort: 6379 },
]

const DATABASE_TYPE_OPTIONS: SelectOption[] = DATABASE_TYPES.map((t) => ({
  value: t.value,
  label: t.label,
}))

function blankConnection(): Partial<DatabaseConnection> {
  return {
    name: '',
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: '',
    username: '',
    password: '',
    ssl: false,
  }
}

export default function ConnectionModal({
  connection = null,
  onClose,
  onSave,
}: ConnectionModalProps) {
  const isEditing = connection !== null
  const [formData, setFormData] = useState<Partial<DatabaseConnection>>(
    connection === null
      ? blankConnection()
      : {
          name: connection.name,
          type: connection.type,
          host: connection.host,
          port: connection.port,
          database: connection.database,
          username: connection.username,
          password: connection.password,
          ssl: connection.ssl ?? false,
        }
  )
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)
    const name = formData.name?.trim() ?? ''
    const host = formData.host?.trim() ?? ''
    const database = formData.database?.trim() ?? ''
    if (!name || !formData.type || !host || !database) {
      setValidationError('Please fill in all required fields (name, host, database).')
      return
    }

    const saved: DatabaseConnection = {
      id: connection?.id ?? `conn-${Date.now()}`,
      name,
      type: formData.type,
      host,
      port:
        formData.port ?? DATABASE_TYPES.find((t) => t.value === formData.type)?.defaultPort ?? 5432,
      database,
      username: formData.username?.trim() ?? '',
      password: formData.password ?? '',
      ssl: formData.ssl ?? false,
    }

    onSave(saved)
  }

  const handleTypeChange = (type: DatabaseType) => {
    const defaultPort = DATABASE_TYPES.find((t) => t.value === type)?.defaultPort ?? 5432
    setFormData((prev) => ({ ...prev, type, port: defaultPort }))
  }

  const clearValidation = () => setValidationError(null)
  const isSQLite = formData.type === 'sqlite'

  return (
    <Modal
      open
      onClose={onClose}
      title={isEditing ? 'Edit connection' : 'New Connection'}
      icon={<Database className="text-pink-500" size={24} />}
      size="md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {validationError && (
          <div
            className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {validationError}
          </div>
        )}

        <Input
          label="Connection Name *"
          type="text"
          value={formData.name ?? ''}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, name: e.target.value }))
            clearValidation()
          }}
          placeholder="My Database"
          required
        />

        <Select
          label="Database Type *"
          options={DATABASE_TYPE_OPTIONS}
          value={formData.type ?? 'postgresql'}
          onChange={(e) => handleTypeChange(e.target.value as DatabaseType)}
        />

        {!isSQLite && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Host *"
                type="text"
                value={formData.host ?? ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, host: e.target.value }))}
                placeholder="localhost"
                required
              />
              <Input
                label="Port *"
                type="number"
                value={formData.port ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, port: parseInt(e.target.value, 10) || 0 }))
                }
                required
              />
            </div>

            <Input
              label="Database *"
              type="text"
              value={formData.database ?? ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, database: e.target.value }))}
              placeholder="mydb"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Username"
                type="text"
                value={formData.username ?? ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                placeholder="user"
              />
              <Input
                label="Password"
                type="password"
                value={formData.password ?? ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
              />
            </div>

            {(formData.type === 'postgresql' || formData.type === 'mysql') && (
              <Checkbox
                label="Use SSL"
                id="ssl"
                checked={formData.ssl ?? false}
                onChange={(e) => setFormData((prev) => ({ ...prev, ssl: e.target.checked }))}
              />
            )}
          </>
        )}

        {isSQLite && (
          <Input
            label="Database File Path *"
            type="text"
            value={formData.database ?? formData.host ?? ''}
            onChange={(e) => {
              const value = e.target.value
              setFormData((prev) => ({ ...prev, database: value, host: value }))
            }}
            placeholder="/path/to/database.db"
            required
          />
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {isEditing ? 'Save' : 'Connect'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
