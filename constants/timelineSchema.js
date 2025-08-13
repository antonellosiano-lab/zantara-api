export function timelineSchema(step) {
  return (
    step &&
    typeof step.id === "string" &&
    typeof step.title === "string" &&
    typeof step.date === "string" &&
    typeof step.status === "string"
  );
}
