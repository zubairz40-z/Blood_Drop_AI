import RequestTrackingStage from './RequestTrackingStage'

function RequestTrackingTimeline({ stages = [] }) {
  return (
    <div>
      {stages.map((stage, index) => (
        <RequestTrackingStage
          key={stage.key}
          stage={stage}
          isLast={index === stages.length - 1}
        />
      ))}
    </div>
  )
}

export default RequestTrackingTimeline
