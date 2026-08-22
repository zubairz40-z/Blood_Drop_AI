// Temporary frontend demo chatbot responses.
// Replace with Gemini API responses during backend integration.

const responses = {
  'how does blooddrop work': 'BloodDrop AI coordinates blood donation requests by matching patients with compatible donors, verifying eligibility, and coordinating logistics. The platform supports donors, patients, hospitals, and volunteers working together.',

  'how do i request blood': 'Go to your Patient Dashboard and choose "Create Blood Request." Add the blood group, donation type, required units, hospital, emergency level, and location, then choose "Find Donor." BloodDrop will begin coordinating the request.',

  'how do i track my request': 'After creating a blood request, open "My Requests" from the patient sidebar. Select your active request and click "Track Request" to see the coordination timeline. You can also view "AI Coordination" for detailed system activity.',

  'how do i become a donor': 'Register for a BloodDrop account and select the Donor role during setup. Once registered, complete your donor profile, set your availability, and you will start receiving nearby emergency requests.',

  'how do i update my donor profile': 'Open the Donor Dashboard and navigate to "Profile" from the sidebar. You can update your personal information, donation preferences, and location availability.',

  'how do i change donor availability': 'Go to your Donor Profile and find the Location & Availability section. You can toggle between manual address and current browser location to set when and where you are available to donate.',

  'what donation types are supported': 'BloodDrop supports Whole Blood, Plasma, Platelets, and Double Red Cells.',

  'how do emergency requests work': 'Emergency requests are created with an urgency level (Normal, Urgent, or Critical). BloodDrop activates its coordination workflow to find compatible donors, check eligibility, and notify nearby candidates as quickly as possible.',

  'what can hospitals do': 'Hospitals can create blood requests, review donor matches, confirm donors, mark donations as complete, and update blood inventory from the Hospital Dashboard.',

  'what can volunteers do': 'Volunteers assist during active blood donation coordination. They can call donors, provide transportation assistance, guide donors to hospitals, and confirm assistance completion from the Volunteer Dashboard.',

  'what is ai coordination': 'AI Coordination is BloodDrop\'s internal workflow that manages request matching, eligibility checking, geo coordination, and donor notification. The system uses five internal agents to coordinate each request.',

  'what are the five agents': 'BloodDrop uses five internal agents: AI Manager, Donor Matching, Eligibility & Scheduling, Geo Coordination, and Risk & Advisor. These coordinate the blood donation workflow for each request.',
}

const fallback = 'This frontend demo can currently answer common questions about using BloodDrop. Gemini integration will be connected later for broader conversational support.'

const medicalDisclaimer = 'BloodDrop\'s eligibility process will use verified eligibility rules during backend integration. For personal medical eligibility, follow guidance from qualified healthcare professionals.'

const emergencyGuide = 'If you need to create an urgent blood request, open the Patient Dashboard and choose "Create Blood Request," then select the appropriate emergency level (Urgent or Critical).'

function findResponse(input) {
  const lower = input.toLowerCase().trim()

  if (lower.includes('medically eligible') || lower.includes('eligible to donate') || lower.includes('can i donate')) {
    return medicalDisclaimer
  }

  if (lower.includes('need blood urgent') || lower.includes('urgent blood') || lower.includes('emergency blood')) {
    return emergencyGuide
  }

  for (const [key, value] of Object.entries(responses)) {
    if (lower.includes(key)) {
      return value
    }
  }

  return fallback
}

export default findResponse
