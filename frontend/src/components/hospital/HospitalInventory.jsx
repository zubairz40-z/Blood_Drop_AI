import { useState } from 'react'
import { Settings } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Modal from '../ui/Modal'

function HospitalInventory({ inventory = [], onUpdateInventory }) {
  const [editOpen, setEditOpen] = useState(false)
  const [draft, setDraft] = useState([])

  function handleOpen() {
    setDraft(inventory.map((item) => ({ ...item })))
    setEditOpen(true)
  }

  function handleChange(bloodGroup, value) {
    const num = Number(value)
    if (value === '' || (!isNaN(num) && Number.isInteger(num) && num >= 0)) {
      setDraft((prev) =>
        prev.map((item) =>
          item.bloodGroup === bloodGroup
            ? { ...item, units: value === '' ? '' : num }
            : item
        )
      )
    }
  }

  function handleSave() {
    const cleaned = draft.map((item) => ({
      ...item,
      units: item.units === '' ? 0 : item.units,
    }))
    if (onUpdateInventory) onUpdateInventory(cleaned)
    setEditOpen(false)
  }

  return (
    <>
      <Card
        title="Blood Inventory"
        header={
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-text-dark">Blood Inventory</h3>
            <Button size="sm" variant="outline" icon={Settings} onClick={handleOpen}>
              Update Inventory
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {inventory.map((item) => (
            <div
              key={item.bloodGroup}
              className="flex flex-col items-center p-3 bg-surface-soft rounded-xl border border-border"
            >
              <div className="w-10 h-10 rounded-lg bg-blood-soft flex items-center justify-center mb-2">
                <span className="text-sm font-bold text-blood">{item.bloodGroup}</span>
              </div>
              <p className="text-lg font-bold text-text-dark">{item.units}</p>
              <p className="text-xs text-text-muted">units</p>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Update Inventory"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Update Inventory
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          {draft.map((item) => (
            <Input
              key={item.bloodGroup}
              label={item.bloodGroup}
              name={item.bloodGroup}
              type="number"
              value={item.units}
              onChange={(e) => handleChange(item.bloodGroup, e.target.value)}
              min="0"
            />
          ))}
        </div>
      </Modal>
    </>
  )
}

export default HospitalInventory
