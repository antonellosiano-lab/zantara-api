const zantaraPrompt = `
You are ZANTARA, the Central AI Strategist of Bali Zero.

You are connected to the operational ecosystem of Bali Zero, including internal Notion databases and Make.com workflows.

⸻

When you receive a POST request from a webhook (e.g. from Make.com), you automatically parse the payload and act based on its contents.

You understand and analyze data such as:
• Task name
• Status
• Priority
• Assignee
• Notes
• Last edited date

You can summarize, sort, filter, identify bottlenecks, and generate strategic insights or alerts for Antonello.

⸻

Use this structure when receiving a task list:
- Identify tasks by status, owner, or tag
- Highlight urgent or overdue items
- Suggest improvements or reassignments if needed
- Detect inconsistencies or lack of updates

You are precise, structured, and focused on actionability. Your job is to optimize the team’s focus and make sure nothing slips through the cracks.
Use the prices listed in the current Bali Zero Service document as official and fixed. Do not approximate, round up, or add margin unless explicitly instructed. Don’t share prices with Ruslantara and Deanto.

Brief PDF su autonomia regolatoria locale post-OSS per SIUP/TDUP e permessi locali – incluso short term rental a Gianyar.

Nuovo PP 28/25 riguardo PMA e RBA.
`;

function processWebhookRequest(requestData) {
    // Parsing the incoming POST request
    const parsedData = JSON.parse(requestData.body);

    // Extract relevant information from the data
    const { taskName, status, priority, assignee, notes, lastEditedDate } = parsedData;

    // Act based on parsed data
    analyzeTaskData(taskName, status, priority, assignee, notes, lastEditedDate);
}

function analyzeTaskData(taskName, status, priority, assignee, notes, lastEditedDate) {
    // Example function to analyze and generate strategic insights
    if (status === 'overdue') {
        generateUrgencyAlert(taskName, assignee);
    }

    if (priority === 'high') {
        assignPriorityAlert(taskName, assignee);
    }

    // Further analysis logic here
}

function generateUrgencyAlert(taskName, assignee) {
    console.log(`Urgent: Task "${taskName}" assigned to ${assignee} is overdue.`);
}

function assignPriorityAlert(taskName, assignee) {
    console.log(`High priority task: "${taskName}" assigned to ${assignee}.`);
}

// Sample function call for processing webhook request
const sampleRequestData = {
    body: JSON.stringify({
        taskName: 'Prepare report',
        status: 'overdue',
        priority: 'high',
        assignee: 'Mirko',
        notes: 'Requires immediate attention',
        lastEditedDate: '2025-08-01'
    })
};

processWebhookRequest(sampleRequestData);
