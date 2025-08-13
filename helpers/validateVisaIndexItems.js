import { visaIndexSchema } from "../constants/visaIndex.js";

export function validateVisaIndexItems(items) {
  return items.every((item) =>
    visaIndexSchema.required.every((key) => {
      const expectedType = visaIndexSchema.properties[key].type;
      return typeof item[key] === expectedType;
    })
  );
}

