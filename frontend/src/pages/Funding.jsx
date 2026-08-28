import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Copy, Check, HandHeart } from 'lucide-react'
import PublicNavbar from '../components/home/PublicNavbar'
import PublicFooter from '../components/home/PublicFooter'
import FadeIn from '../components/motion/FadeIn'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Alert from '../components/ui/Alert'
import BkashLogo from '../components/icons/BkashLogo'

const amounts = ['100', '500', '1000']
const BKASH_NUMBER = '01954273593'

const instructions = [
  'Open bKash',
  'Select Send Money',
  `Send the amount to ${BKASH_NUMBER}`,
  'Enter the Transaction ID',
  'Submit the support information',
]

const phonePattern = /^01[3-9]\d{8}$/

function Funding() {
  const [searchParams] = useSearchParams()
  const rawAmount = searchParams.get('amount')
  const isCustomParam = rawAmount === 'custom'
  const initialAmount = !isCustomParam && rawAmount ? rawAmount : ''

  const [selectedAmount, setSelectedAmount] = useState(
    isCustomParam || !amounts.includes(initialAmount) ? 'custom' : initialAmount
  )
  const [customAmount, setCustomAmount] = useState(
    !isCustomParam && initialAmount && !amounts.includes(initialAmount) ? initialAmount : ''
  )

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [message, setMessage] = useState('')

  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})

  const effectiveAmount = selectedAmount === 'custom' ? customAmount : selectedAmount
  const parsedAmount = Number(effectiveAmount)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(BKASH_NUMBER)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable — the number is still shown for manual copy.
    }
  }

  function validate() {
    const next = {}
    if (!parsedAmount || parsedAmount < 1) next.amount = 'Enter a valid amount.'
    if (!name.trim()) next.name = 'Name is required.'
    if (!phonePattern.test(phone.trim())) next.phone = 'Enter a valid Bangladeshi phone number.'
    if (!transactionId.trim()) next.transactionId = 'Transaction ID is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    // Frontend-only for now: this records the sender's own claim of a manual
    // bKash transfer. Nothing here marks the support as fulfilled — that is
    // a separate, later reconciliation step.
    await new Promise((resolve) => setTimeout(resolve, 700))
    setSubmitting(false)
    setSubmitted(true)
  }

  function handleReset() {
    setSubmitted(false)
    setName('')
    setPhone('')
    setTransactionId('')
    setMessage('')
    setErrors({})
  }

  return (
    <div className="min-h-screen">
      <PublicNavbar />

      <main className="pt-16">
        <section className="py-14 sm:py-20 bg-bg">
          <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn className="text-center mb-8">
              <p className="text-xs font-semibold text-brand uppercase tracking-wider mb-2">Contribute</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-text-dark mb-3">Support BloodDrop</h1>
              <p className="text-sm text-text-muted leading-relaxed">
                Blood is never paid for. Your support helps us continue development and reach more communities.
              </p>
            </FadeIn>

            <FadeIn>
              <Card>
                <>
                  {submitted ? (
                    <div className="text-center py-6">
                      <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                        <Check className="w-7 h-7 text-emerald-600" />
                      </div>
                      <h2 className="text-lg font-semibold text-text-dark mb-2">
                        Support information submitted successfully.
                      </h2>
                      <p className="text-sm text-text-muted mb-6">
                        Thank you for supporting BloodDrop AI.
                      </p>
                      <Button variant="outline" onClick={handleReset}>
                        Submit another
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Payment method */}
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <span className="text-sm font-medium text-text-dark">Payment Method</span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 border border-pink-200 rounded-full text-sm font-semibold text-pink-700">
                          <BkashLogo className="w-4 h-4" /> bKash
                        </span>
                      </div>

                      {/* Send money to */}
                      <div className="p-4 bg-bg rounded-xl border border-border mb-5">
                        <p className="text-xs text-text-muted mb-1">Send Money To</p>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-lg font-bold text-text-dark tracking-wide">{BKASH_NUMBER}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant={copied ? 'secondary' : 'outline'}
                            icon={copied ? Check : Copy}
                            onClick={handleCopy}
                          >
                            {copied ? 'Copied' : 'Copy'}
                          </Button>
                        </div>
                      </div>

                      {/* Instructions */}
                      <ol className="space-y-1.5 mb-6">
                        {instructions.map((step, i) => (
                          <li key={step} className="flex items-start gap-2 text-sm text-text-secondary">
                            <span className="shrink-0 w-5 h-5 rounded-full bg-brand-soft text-brand text-xs font-semibold flex items-center justify-center mt-0.5">
                              {i + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>

                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-text-charcoal mb-2">
                            Amount<span className="text-blood ml-0.5">*</span>
                          </p>
                          <div className="flex flex-wrap gap-2.5">
                            {amounts.map((a) => (
                              <button
                                key={a}
                                type="button"
                                onClick={() => setSelectedAmount(a)}
                                className={`w-20 py-2.5 text-sm font-semibold rounded-xl border transition-colors cursor-pointer ${
                                  selectedAmount === a
                                    ? 'border-brand bg-brand-soft text-brand'
                                    : 'border-border-dark bg-white text-text-dark hover:border-brand hover:text-brand'
                                }`}
                              >
                                ৳{a}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => setSelectedAmount('custom')}
                              className={`px-4 py-2.5 text-sm font-semibold rounded-xl border border-dashed transition-colors cursor-pointer ${
                                selectedAmount === 'custom'
                                  ? 'border-brand bg-brand-soft text-brand'
                                  : 'border-border-dark bg-white text-text-muted hover:border-brand hover:text-brand'
                              }`}
                            >
                              Custom
                            </button>
                          </div>
                          {selectedAmount === 'custom' && (
                            <Input
                              className="mt-3"
                              name="customAmount"
                              type="number"
                              min="1"
                              value={customAmount}
                              onChange={(e) => setCustomAmount(e.target.value)}
                              placeholder="Enter amount (৳)"
                              error={errors.amount}
                            />
                          )}
                          {selectedAmount !== 'custom' && errors.amount && (
                            <p className="text-xs text-blood mt-1.5">{errors.amount}</p>
                          )}
                        </div>

                        <Input
                          label="Name"
                          name="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          error={errors.name}
                          required
                        />

                        <Input
                          label="Phone Number"
                          name="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="01XXXXXXXXX"
                          error={errors.phone}
                          required
                        />

                        <Input
                          label="bKash Transaction ID"
                          name="transactionId"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                          placeholder="e.g. 9AC3B7D2E1"
                          error={errors.transactionId}
                          required
                        />

                        <Input
                          label="Message (optional)"
                          name="message"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Anything you'd like us to know"
                        />

                        <Button
                          type="submit"
                          size="lg"
                          icon={HandHeart}
                          loading={submitting}
                          disabled={submitting}
                          className="w-full"
                        >
                          Confirm Support
                        </Button>
                      </form>

                      <Alert variant="info" className="mt-5 text-xs">
                        BloodDrop will never ask for your bKash PIN, OTP, or password.
                      </Alert>
                    </>
                  )}
                </>
              </Card>
            </FadeIn>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}

export default Funding
