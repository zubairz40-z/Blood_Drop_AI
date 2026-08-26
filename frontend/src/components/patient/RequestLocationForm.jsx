import { useState } from 'react'
import { Navigation, Loader2 } from 'lucide-react'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Alert from '../ui/Alert'


function RequestLocationForm({ form, errors, onChange, onLocationChange, hospitals = [], hospitalsLoading }) {
  const [locating, setLocating] = useState(false)
  const [locationMessage, setLocationMessage] = useState(null)

  const hospitalOptions = hospitals.map((h) => ({
    value: h.id,
    label: h.address ? `${h.name} — ${h.address}` : h.name,
  }))

  function handleGetLocation() {
    if (!navigator.geolocation) {
      setLocationMessage({ type: 'error', text: 'Location services are not supported by this browser. Enter your location manually instead.' })
      return
    }

    setLocating(true)
    setLocationMessage(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6)
        const lng = position.coords.longitude.toFixed(6)
        onLocationChange({ mode: 'current', address: `${lat}, ${lng}`, latitude: lat, longitude: lng })
        setLocating(false)
        setLocationMessage({ type: 'success', text: 'Current location captured successfully.' })
      },
      (err) => {
        setLocating(false)
        if (err.code === 1) {
          setLocationMessage({ type: 'error', text: 'Location permission was denied. You can enter your location manually instead.' })
        } else {
          setLocationMessage({ type: 'error', text: 'Your current location could not be determined. Try again or enter your location manually.' })
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  }

  function handleLocationFieldChange(e) {
    onLocationChange({ ...form.location, address: e.target.value, mode: 'manual', latitude: null, longitude: null })
  }

  function handleModeChange(mode) {
    if (mode === 'current') {
      handleGetLocation()
    } else {
      onLocationChange({ mode: 'manual', address: form.location.address || '', latitude: null, longitude: null })
      setLocationMessage(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
            <Select
            label="Hospital"
            name="hospital"
            value={form.hospital}
            onChange={onChange}
            options={hospitalOptions}
            placeholder={hospitalsLoading ? 'Loading hospitals...' : 'Select hospital'}
            required
            error={errors.hospital}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-text-charcoal">Request Location</p>
          <button
            type="button"
            onClick={() => handleModeChange('current')}
            className="inline-flex items-center gap-1.5 text-sm text-brand hover:text-brand-hover transition-colors cursor-pointer"
          >
            {locating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
            {locating ? 'Getting location...' : 'Use Current Location'}
          </button>
        </div>

        {form.location.mode === 'current' && form.location.latitude ? (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <Navigation className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-emerald-800 font-medium">Current location captured</p>
              <p className="text-xs text-emerald-700">{form.location.latitude}, {form.location.longitude}</p>
            </div>
          </div>
        ) : (
          <Input
            name="locationAddress"
            value={form.location.address}
            onChange={handleLocationFieldChange}
            placeholder="e.g. Dhanmondi, Dhaka"
            error={errors.location}
          />
        )}
        <p className="text-xs text-text-muted">Enter the hospital area, neighborhood, city, or nearby landmark.</p>
      </div>

      {locationMessage && (
        <Alert variant={locationMessage.type} onDismiss={() => setLocationMessage(null)}>
          {locationMessage.text}
        </Alert>
      )}
    </div>
  )
}

export default RequestLocationForm
