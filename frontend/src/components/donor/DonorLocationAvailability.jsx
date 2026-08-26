import { useState } from 'react'
import { MapPin, Pencil, Navigation, Loader2, CheckCircle2 } from 'lucide-react'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Alert from '../ui/Alert'

function DonorLocationAvailability({ location, onLocationChange, available, onAvailabilityChange, error }) {
  const [locationMode, setLocationMode] = useState(location.mode || 'manual')
  const [locating, setLocating] = useState(false)
  const [locationMessage, setLocationMessage] = useState(null)

  function handleModeChange(mode) {
    setLocationMode(mode)
    setLocationMessage(null)
    if (mode !== location.mode) {
      if (mode === 'manual') {
        onLocationChange({ ...location, mode: 'manual', address: location.address || '', latitude: null, longitude: null })
      } else {
        onLocationChange({ ...location, mode: 'current', address: '' })
      }
    }
  }

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
        onLocationChange({ ...location, mode: 'current', address: '', latitude: lat, longitude: lng })
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

  function handleAddressChange(e) {
    onLocationChange({ ...location, address: e.target.value })
  }

  const hasCoordinates = location.latitude && location.longitude
  const hasManualAddress = location.mode === 'manual' && location.address.trim()

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-text-charcoal mb-1">Location</p>

        <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-xl border border-border mb-4">
          <MapPin className="w-4 h-4 text-text-light flex-shrink-0" />
          {hasManualAddress ? (
            <div className="min-w-0">
              <p className="text-sm text-text-dark truncate">{location.address}</p>
              <p className="text-xs text-text-muted">Manual location</p>
            </div>
          ) : hasCoordinates ? (
            <div className="min-w-0">
              <p className="text-sm text-text-dark">Current location captured</p>
              <p className="text-xs text-text-muted">{location.latitude}, {location.longitude}</p>
            </div>
          ) : (
            <p className="text-sm text-text-muted">Location not set</p>
          )}
        </div>

        <p className="text-sm text-text-secondary mb-3">How would you like to add your location?</p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleModeChange('manual')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium border-2 transition-all cursor-pointer ${
              locationMode === 'manual'
                ? 'border-brand bg-brand-soft/40 text-brand'
                : 'border-border-dark bg-white text-text-secondary hover:bg-neutral-50'
            }`}
          >
            <Pencil className="w-4 h-4" />
            Enter Location
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('current')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium border-2 transition-all cursor-pointer ${
              locationMode === 'current'
                ? 'border-brand bg-brand-soft/40 text-brand'
                : 'border-border-dark bg-white text-text-secondary hover:bg-neutral-50'
            }`}
          >
            <Navigation className="w-4 h-4" />
            Use Current Location
          </button>
        </div>
      </div>

      {locationMode === 'manual' ? (
        <div>
          <Input
            label="Your Location"
            name="address"
            value={location.address}
            onChange={handleAddressChange}
            placeholder="e.g. Mirpur 10, Dhaka"
            error={error}
          />
          <p className="text-xs text-text-muted mt-1.5">
            Enter your area, neighborhood, city, or a nearby landmark.
          </p>
        </div>
      ) : (
        <div className="text-center py-4">
          {hasCoordinates ? (
            <div className="space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <div>
                <p className="text-sm font-medium text-text-dark">Current location captured</p>
                <p className="text-xs text-text-muted mt-0.5">{location.latitude}, {location.longitude}</p>
              </div>
              <Button
                variant="secondary"
                icon={Loader2}
                onClick={handleGetLocation}
                disabled={locating}
                className="mx-auto"
              >
                Update Current Location
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-14 h-14 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto">
                <Navigation className="w-6 h-6 text-text-light" />
              </div>
              <p className="text-sm text-text-secondary">No location captured yet</p>
              <Button
                variant="secondary"
                icon={locating ? Loader2 : Navigation}
                onClick={handleGetLocation}
                disabled={locating}
                className="mx-auto"
              >
                {locating ? 'Getting location...' : 'Use My Current Location'}
              </Button>
            </div>
          )}
          {error && (
            <p className="text-xs text-blood mt-2" role="alert">{error}</p>
          )}
        </div>
      )}

      <p className="text-xs text-text-muted">
        Your location is used for nearby donor coordination.
      </p>

      {locationMessage && (
        <Alert
          variant={locationMessage.type}
          onDismiss={() => setLocationMessage(null)}
        >
          {locationMessage.text}
        </Alert>
      )}

      <div className="pt-4 border-t border-border">
        <p className="text-sm font-medium text-text-charcoal mb-3">Availability</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onAvailabilityChange(true)}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium border-2 transition-all cursor-pointer ${
              available
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-border-dark bg-white text-text-secondary hover:bg-neutral-50'
            }`}
          >
            Available
          </button>
          <button
            type="button"
            onClick={() => onAvailabilityChange(false)}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium border-2 transition-all cursor-pointer ${
              !available
                ? 'border-amber-500 bg-amber-50 text-amber-700'
                : 'border-border-dark bg-white text-text-secondary hover:bg-neutral-50'
            }`}
          >
            Busy
          </button>
        </div>
      </div>
    </div>
  )
}

export default DonorLocationAvailability
