import { useState } from 'react'
import {
  Heart, Users, Clock, ArrowRight,
  AlertTriangle, Search, FileText, Activity, Plus,
} from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import Card from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Table from '../components/ui/Table'
import Alert from '../components/ui/Alert'
import Avatar from '../components/ui/Avatar'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import PageHeader from '../components/common/PageHeader'
import NotificationBell from '../components/common/NotificationBell'
import SearchBar from '../components/common/SearchBar'

const sampleNotifications = [
  { id: 1, message: 'Emergency blood request received for O+ Platelets', time: '2 min ago', unread: true },
  { id: 2, message: 'Donor Rahim accepted your request', time: '15 min ago', unread: true },
  { id: 3, message: 'You are eligible to donate again on Aug 25', time: '1 hour ago', unread: false },
]

const sampleColumns = [
  { key: 'name', header: 'Name' },
  { key: 'bloodGroup', header: 'Blood Group' },
  { key: 'status', header: 'Status' },
  { key: 'distance', header: 'Distance' },
]

const sampleData = [
  { id: 1, name: 'Rahim Ahmed', bloodGroup: 'O+', status: 'Available', distance: '2.4 km' },
  { id: 2, name: 'Fatima Khan', bloodGroup: 'A+', status: 'Available', distance: '5.1 km' },
  { id: 3, name: 'Sakib Hasan', bloodGroup: 'B+', status: 'Busy', distance: '8.7 km' },
  { id: 4, name: 'Nusrat Jahan', bloodGroup: 'AB+', status: 'Available', distance: '12.3 km' },
]

const bloodGroupOptions = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
]

function Section({ title, children }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-text-dark border-b border-border pb-3">
        {title}
      </h2>
      {children}
    </section>
  )
}

function DesignSystem() {
  const [modalOpen, setModalOpen] = useState(false)
  const [notifCount] = useState(2)

  return (
    <div className="min-h-screen bg-bg">
      <div className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <img src="/blood-drop.png" alt="BloodDrop AI" className="w-8 h-8" />
            <h1 className="text-3xl font-bold text-text-dark">BloodDrop AI</h1>
          </div>
          <p className="text-text-muted text-base">
            Design System &amp; Component Library — Visual foundation for the BloodDrop health-tech platform.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">

        {/* Hero Demo */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-8 sm:p-12">
          <div className="relative z-10 max-w-xl">
            <Badge variant="primary" className="mb-4">AI-Powered</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-3">
              Find blood. Save lives. Faster.
            </h2>
            <p className="text-neutral-300 text-base mb-6 leading-relaxed">
              BloodDrop AI connects donors, patients, and hospitals through intelligent multi-agent coordination.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" icon={ArrowRight} iconPosition="right">
                Request Blood
              </Button>
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Become a Donor
              </Button>
            </div>
          </div>
          <div className="absolute top-6 right-6 opacity-10">
            <Heart className="w-40 h-40 text-[#F72585]" />
          </div>
        </section>

        {/* Brand Colors */}
        <Section title="Brand Colors">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { name: 'Primary', color: '#F72585', text: 'white' },
              { name: 'Primary Hover', color: '#E91E72', text: 'white' },
              { name: 'Primary Soft', color: '#FDE7F1', text: '#E91E72' },
              { name: 'Blood Red', color: '#DC2626', text: 'white' },
              { name: 'Blood Red Soft', color: '#FEE2E2', text: '#B91C1C' },
              { name: 'Success', color: '#10B981', text: 'white' },
            ].map((c) => (
              <div
                key={c.name}
                className="rounded-xl h-20 flex items-end p-3 border border-border"
                style={{ backgroundColor: c.color, color: c.text }}
              >
                <div>
                  <p className="text-xs font-semibold">{c.name}</p>
                  <p className="text-[10px] opacity-80">{c.color}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { name: 'Dark', color: '#171717', text: 'white' },
              { name: 'Charcoal', color: '#262626', text: 'white' },
              { name: 'Secondary', color: '#525252', text: 'white' },
              { name: 'Muted', color: '#737373', text: 'white' },
              { name: 'Background', color: '#F7F7F8', text: '#262626' },
              { name: 'Surface', color: '#FFFFFF', text: '#262626' },
            ].map((c) => (
              <div
                key={c.name}
                className="rounded-xl h-16 flex items-end p-2 border border-border"
                style={{ backgroundColor: c.color, color: c.text }}
              >
                <div>
                  <p className="text-[10px] font-semibold">{c.name}</p>
                  <p className="text-[9px] opacity-70">{c.color}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Typography */}
        <Section title="Typography">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-text-dark">Page Heading — BloodDrop AI</h1>
            <h2 className="text-2xl font-bold text-text-dark">Section Heading</h2>
            <h3 className="text-lg font-semibold text-text-charcoal">Card Heading</h3>
            <p className="text-base text-text-secondary">
              Body text — BloodDrop connects donors, patients, and hospitals through intelligent coordination.
            </p>
            <p className="text-sm text-text-muted">
              Muted text — Supporting descriptions and helper content.
            </p>
            <p className="text-xs text-text-light uppercase tracking-wider font-medium">
              Small Label — Status Indicator
            </p>
          </div>
        </Section>

        {/* Buttons */}
        <Section title="Buttons">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" size="sm">Small</Button>
              <Button variant="primary" size="md">Medium</Button>
              <Button variant="primary" size="lg">Large</Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" icon={Heart}>With Icon</Button>
              <Button variant="primary" icon={ArrowRight} iconPosition="right">Next Step</Button>
              <Button variant="primary" loading>Processing</Button>
              <Button variant="primary" disabled>Disabled</Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="danger" icon={AlertTriangle}>Cancel Request</Button>
              <Button variant="outline" icon={Search}>Search Donors</Button>
            </div>
          </div>
        </Section>

        {/* Form Elements */}
        <Section title="Form Elements">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input label="Full Name" placeholder="Enter your name" />
              <Input label="Email" type="email" placeholder="you@example.com" helperText="We will never share your email." />
              <Input label="Phone" type="tel" icon={Search} placeholder="Search or enter phone" />
              <Input label="Error Example" placeholder="Invalid input" error="This field is required." />
              <Input label="Disabled" placeholder="Cannot edit" disabled />
            </div>
            <div className="space-y-4">
              <Select label="Blood Group" options={bloodGroupOptions} placeholder="Select blood group" />
              <Select label="Donation Type" options={[
                { value: 'whole', label: 'Whole Blood' },
                { value: 'plasma', label: 'Plasma' },
                { value: 'platelets', label: 'Platelets' },
                { value: 'double_red', label: 'Double Red Cells' },
              ]} placeholder="Select type" />
              <Select label="Emergency Level" options={[
                { value: 'normal', label: 'NORMAL' },
                { value: 'urgent', label: 'URGENT' },
                { value: 'critical', label: 'CRITICAL' },
              ]} />
              <Select label="Disabled Select" options={[]} placeholder="Cannot select" disabled />
            </div>
          </div>
        </Section>

        {/* Cards */}
        <Section title="Cards">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="Default Card" subtitle="Standard white surface with subtle shadow">
              <p className="text-sm text-text-secondary">
                This is a standard card with white background, soft border, and subtle shadow. Used for most dashboard content.
              </p>
            </Card>
            <Card variant="outlined" title="Outlined Card" subtitle="No shadow, visible border">
              <p className="text-sm text-text-secondary">
                A variant with more prominent borders but no shadow. Useful for emphasis.
              </p>
            </Card>
          </div>
          <Card variant="glass" className="text-white">
            <h3 className="text-lg font-semibold mb-2">Glass Card</h3>
            <p className="text-sm text-neutral-300">
              Translucent dark surface with backdrop blur. Used for overlays on photographic or dark backgrounds such as hero sections.
            </p>
          </Card>
          <Card header={<div className="flex items-center gap-2"><Activity className="w-4 h-4 text-brand" /><span className="font-semibold text-sm">Custom Header</span></div>} footer={<p className="text-xs text-text-muted">Card footer content</p>}>
            <p className="text-sm text-text-secondary">
              Cards support custom header and footer slots for flexible layouts.
            </p>
          </Card>
        </Section>

        {/* Stat Cards */}
        <Section title="Stat Cards">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Active Donors" value="247" icon={Users} trend="+12% this month" trendUp />
            <StatCard title="Blood Requests" value="58" icon={FileText} trend="8 urgent" trendUp={false} />
            <StatCard title="Completed Donations" value="183" icon={Heart} trend="+5% this week" trendUp />
            <StatCard title="Average Response" value="4.2m" icon={Clock} description="Minutes to accept" />
          </div>
        </Section>

        {/* Badges */}
        <Section title="Badges">
          <div className="flex flex-wrap gap-2">
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success">Eligible</Badge>
            <Badge variant="success">Available</Badge>
            <Badge variant="info">Pending</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Critical</Badge>
            <Badge variant="neutral">Neutral</Badge>
          </div>
        </Section>

        {/* Alerts */}
        <Section title="Alerts">
          <div className="space-y-3">
            <Alert variant="success" title="Donation Confirmed">
              Your donation has been successfully recorded. Thank you for saving lives.
            </Alert>
            <Alert variant="info" title="AI Manager Activated">
              The AI coordination system is now searching for compatible donors.
            </Alert>
            <Alert variant="warning" title="Eligibility Reminder">
              You are not yet eligible to donate. Next eligible date: August 25, 2026.
            </Alert>
            <Alert variant="error" title="Request Failed">
              Unable to process the blood request. Please try again.
            </Alert>
          </div>
        </Section>

        {/* Avatars */}
        <Section title="Avatars">
          <div className="flex flex-wrap items-end gap-4">
            <Avatar name="Rahim Ahmed" size="sm" />
            <Avatar name="Fatima Khan" size="md" status="online" />
            <Avatar name="Sakib Hasan" size="lg" status="away" />
            <Avatar name="Nusrat Jahan" size="xl" status="busy" />
            <Avatar size="lg" />
            <Avatar name="AB" size="lg" />
          </div>
        </Section>

        {/* Table */}
        <Section title="Table">
          <Table columns={sampleColumns} data={sampleData} rowKey="id" />
          <p className="text-xs text-text-muted mt-2">Demonstration data only — not connected to real donors.</p>
        </Section>

        {/* Search & Notification */}
        <Section title="Search & Notifications">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <SearchBar placeholder="Search donors, requests..." className="w-full sm:w-72" />
            <NotificationBell count={notifCount} notifications={sampleNotifications} />
          </div>
        </Section>

        {/* Loading & Empty */}
        <Section title="Loading & Empty States">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <LoadingSpinner label="Loading donors..." />
            </Card>
            <Card>
              <EmptyState
                icon={FileText}
                title="No donation history"
                description="Your completed donations will appear here."
              />
            </Card>
          </div>
        </Section>

        {/* Page Header */}
        <Section title="Page Header">
          <Card>
            <PageHeader
              title="Donor Dashboard"
              description="Manage your donation activity and availability."
              eyebrow="Dashboard"
            />
          </Card>
          <Card>
            <PageHeader
              title="Blood Requests"
              description="View and manage incoming requests."
              action={<Button size="sm" icon={Plus}>New Request</Button>}
            />
          </Card>
        </Section>

        {/* Modal Demo */}
        <Section title="Modal">
          <Button onClick={() => setModalOpen(true)} icon={AlertTriangle}>Open Modal</Button>
          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Confirm Donation"
            footer={
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button onClick={() => setModalOpen(false)}>Confirm</Button>
              </div>
            }
          >
            <p className="text-sm text-text-secondary">
              Are you sure you want to accept this blood request? A critical patient is waiting at ABC Medical College.
            </p>
          </Modal>
        </Section>
      </div>
    </div>
  )
}

export default DesignSystem
