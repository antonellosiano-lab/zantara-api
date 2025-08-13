import Ajv from "ajv";

const ajv = new Ajv();

const schema = {
  type: "object",
  properties: {
    nationality: { type: "string" },
    goal: { type: "string" },
    requester: { type: "string" }
  },
  required: ["nationality", "goal"],
  additionalProperties: false
};

export const analyzeSchema = ajv.compile(schema);
