import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Database } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Badge from '../../components/ui/Badge'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import HospitalInventory from '../../components/hospital/HospitalInventory'
import { fetchInventory, updateInventory, initializeInventory } from '../../api/inventoryApi'

const WHOLE_BLOOD = 'WHOLE_BLOOD'

function HospitalInventoryPage() {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [alert, setAlert] = useState(null)

  const loadInventory = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let items = await fetchInventory()

      // If hospital has no inventory rows yet, initialize and re-fetch
      if (!items || items.length === 0) {
        await initializeInventory()
        items = await fetchInventory()
      }

      // Filter to WHOLE_BLOOD only — matches the existing grid UI
      const wholeBlood = items
        .filter((row) => row.component === WHOLE_BLOOD)
        .map((row) => ({ bloodGroup: row.bloodGroup, units: row.units }))

      setInventory(wholeBlood)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load inventory'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInventory()
  }, [loadInventory])

  async function handleUpdateInventory(newInventory) {
    try {
      // Map the simplified { bloodGroup, units } back to backend format
      const items = newInventory.map((item) => ({
        bloodGroup: item.bloodGroup,
        component: WHOLE_BLOOD,
        units: item.units,
      }))

      const updated = await updateInventory(items)

      const wholeBlood = updated
        .filter((row) => row.component === WHOLE_BLOOD)
        .map((row) => ({ bloodGroup: row.bloodGroup, units: row.units }))

      setInventory(wholeBlood)
      setAlert('Inventory updated successfully.')
      setTimeout(() => setAlert(null), 3000)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update inventory'
      setError(msg)
      setTimeout(() => setError(null), 4000)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <PageHeader
            title="Blood Inventory"
            description="Monitor and update blood unit availability across all groups."
          />
          <Badge variant="role-hospital">Hospital</Badge>
        </div>
      </div>

      {alert && (
        <Alert variant="success" onDismiss={() => setAlert(null)}>
          {alert}
        </Alert>
      )}

      {error && (
        <Alert variant="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <LoadingSpinner size="lg" label="Loading inventory..." className="py-16" />
      ) : inventory.length === 0 ? (
        <EmptyState
          icon={Database}
          title="No inventory data"
          description="Initialize your hospital's blood inventory to get started."
          action={
            <Button onClick={loadInventory}>Initialize Inventory</Button>
          }
        />
      ) : (
        <HospitalInventory
          inventory={inventory}
          onUpdateInventory={handleUpdateInventory}
        />
      )}
    </motion.div>
  )
}

export default HospitalInventoryPage
