import { getDistance } from "./getDistance";
import { describe, expect, it } from "@jest/globals";

describe("getDistance", () => {
  it("retourne 0 pour deux points identiques", () => {
    const point = { lng: 2.3522, lat: 48.8566 };
    expect(getDistance(point, point)).toBeCloseTo(0, 6);
  });

  it("retourne une distance positive pour deux points différents", () => {
    const point1 = { lng: 0, lat: 0 };
    const point2 = { lng: 1, lat: 1 };

    const distance = getDistance(point1, point2);

    // En km (environ 157.25 km)
    expect(distance).toBeCloseTo(157.25, 2);
  });
});