export const visaIndexSchema = {
  type: "object",
  required: ["id", "visa_type", "title", "description"],
  properties: {
    id: { type: "number" },
    visa_type: { type: "string" },
    title: { type: "string" },
    description: { type: "string" }
  }
};

export const visaIndexItems = [
  {
    id: 1,
    visa_type: "tourist",
    title: "Tourist Visa",
    description: "Short stay for tourism"
  },
  {
    id: 2,
    visa_type: "business",
    title: "Business Visa",
    description: "For business travelers"
  }
];

