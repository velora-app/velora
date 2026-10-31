'use client'

import { useEffect, useState } from 'react'
import { Modal, Input, Button } from '@/components'

interface SaveQueryModalProps {
  open: boolean
  onClose: () => void
  onSave: (name: string) => void
  connectionName: string
  initialName?: string
}

export default function SaveQueryModal({
  open,
  onClose,
  onSave,
  connectionName,
  initialName = '',
}: SaveQueryModalProps) {
  const [name, setName] = useState(initialName)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(initialName)
      setError(null)
    }
  }, [open, initialName])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Give this query a name.')
      return
    }
    onSave(trimmed)
  }

  return (
    <Modal open={open} onClose={onClose} title="Save query" size="sm">
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <p className="text-sm text-slate-600">
          Saved for <span className="font-medium text-pink-600">{connectionName}</span>. It stays on
          this connection.
        </p>
        {error && (
          <div
            className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}
        <Input
          label="Name"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            setError(null)
          }}
          placeholder="Orders this week"
          maxLength={120}
          autoFocus
          required
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Save
          </Button>
        </div>
      </form>
    </Modal>
  )
}
