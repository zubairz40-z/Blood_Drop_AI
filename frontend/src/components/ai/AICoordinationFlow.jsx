import { BrainCircuit, Users, ShieldCheck, MapPin, ArrowDown } from 'lucide-react'
import AIAgentCard from './AIAgentCard'
import BestMatchCard from './BestMatchCard'
import NotificationStatusCard from './NotificationStatusCard'
import RiskAdvisorStatus from './RiskAdvisorStatus'

function Connector() {
  return (
    <div className="flex justify-center py-1">
      <ArrowDown className="w-4 h-4 text-text-light" />
    </div>
  )
}

function AICoordinationFlow({ coordination }) {
  if (!coordination) return null

  return (
    <div className="space-y-1">
      <AIAgentCard
        icon={BrainCircuit}
        title="AI Manager"
        status={coordination.manager.status}
        description={coordination.manager.description}
        outputs={coordination.manager.outputs}
      />

      <Connector />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AIAgentCard
          icon={Users}
          title="Donor Matching"
          status={coordination.matching.status}
          description={coordination.matching.description}
        >
          <div className="mt-3 pt-3 border-t border-border">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 bg-surface-soft rounded-lg">
                <p className="text-lg font-bold text-text-dark">{coordination.matching.candidatesReviewed}</p>
                <p className="text-[10px] text-text-muted">Reviewed</p>
              </div>
              <div className="text-center p-2 bg-surface-soft rounded-lg">
                <p className="text-lg font-bold text-brand">{coordination.matching.compatibleCandidates}</p>
                <p className="text-[10px] text-text-muted">Compatible</p>
              </div>
            </div>
            {coordination.matching.criteria && (
              <ul className="mt-3 space-y-1">
                {coordination.matching.criteria.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                    <span className="text-emerald-500 mt-0.5 shrink-0">&#10003;</span>
                    {c}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </AIAgentCard>

        <AIAgentCard
          icon={ShieldCheck}
          title="Eligibility & Scheduling"
          status={coordination.eligibility.status}
          description={coordination.eligibility.description}
        >
          <div className="mt-3 pt-3 border-t border-border">
            <div className="text-center p-2 bg-surface-soft rounded-lg">
              <p className="text-lg font-bold text-brand">{coordination.eligibility.eligibleCandidates}</p>
              <p className="text-[10px] text-text-muted">Eligible candidates</p>
            </div>
          </div>
        </AIAgentCard>

        <AIAgentCard
          icon={MapPin}
          title="Geo Coordination"
          status={coordination.geo.status}
          description={coordination.geo.description}
        >
          <div className="mt-3 pt-3 border-t border-border">
            <div className="text-center p-2 bg-surface-soft rounded-lg">
              <p className="text-lg font-bold text-brand">{coordination.geo.nearestDistance} km</p>
              <p className="text-[10px] text-text-muted">Nearest compatible</p>
            </div>
          </div>
        </AIAgentCard>
      </div>

      <Connector />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <BestMatchCard match={coordination.bestMatch} />
        </div>
        <div className="lg:col-span-1">
          <RiskAdvisorStatus risk={coordination.riskAdvisor} />
        </div>
      </div>

      <Connector />

      <NotificationStatusCard notification={coordination.notification} />
    </div>
  )
}

export default AICoordinationFlow
