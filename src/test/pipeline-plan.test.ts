import { describe, expect, it } from "vitest";
import { BASE_CITY } from "@/engine/city";
import { PLAN_WAIT, PLAN_FULL } from "@/engine/plans";
import { runSim } from "@/engine/sim";

describe("Simulation Engine: Pipeline failure plan comparison", () => {
  it("loses more person-hours with 'Wait it out' than with 'Full triage' when the main pipeline fails", () => {
    const waitResult = runSim(BASE_CITY, ["PIPE1"], PLAN_WAIT);
    const fullResult = runSim(BASE_CITY, ["PIPE1"], PLAN_FULL);

    expect(waitResult.personHoursLost).toBeGreaterThan(fullResult.personHoursLost);
    expect(waitResult.personHoursLost).toBeGreaterThan(0);
    expect(fullResult.personHoursLost).toBeGreaterThanOrEqual(0);
  });
});
