/**
 * §10 step 5 — Distance buffers and placement prohibitions (pre-computed exclusion polygons).
 *
 * Universal buffers (both vendor types) are checked first, then type-specific ones.
 * MFV-specific: crosswalk. GV-specific (also applies to First Amendment, which follows §20-465
 * placement rules): corner, bus shelter, newsstand, ADA ramp.
 *
 * Distances are encoded in the data layer; the engine only reads the resolved boolean facts.
 */
import { CITES } from '../citations';
import type { Reason, Rule, VerdictStatus } from '../types';

function prohibited(reason: Reason, mockLayers?: string[]): {
  stop: true;
  status: VerdictStatus;
  title: string;
  reasons: Reason[];
  mockLayers?: string[];
} {
  return { stop: true, status: 'prohibited', title: reason.title, reasons: [reason], mockLayers };
}

export const distanceBuffers: Rule = ({ config, facts }) => {
  const followsGvPlacement = config.vendorType !== 'food'; // merch + First Amendment

  // --- Universal placement prohibitions ---
  if (facts.inBikeLane) {
    return prohibited({
      icon: '🚲',
      code: 'BIKE_LANE',
      title: 'In a bike lane',
      detail: 'No cart, stand, or goods may be placed within a bicycle lane.',
      citation: CITES.NO_BIKE_LANE,
    });
  }

  if (facts.onMedian) {
    return prohibited({
      icon: '🛣️',
      code: 'MEDIAN',
      title: 'On a road median',
      detail: 'No vending on the median strip of a divided roadway unless it is a designated pedestrian mall.',
      citation: CITES.NO_MEDIAN,
    });
  }

  if (facts.withinSubwayBuffer) {
    return prohibited({
      icon: '🚇',
      code: 'SUBWAY_BUFFER',
      title: 'Too close to a subway entrance',
      detail: 'Both vendor types must stay at least 10 ft from a subway entrance or exit.',
      citation: CITES.SUBWAY_BUFFER,
    });
  }

  if (facts.withinBuildingEntranceBuffer) {
    return prohibited({
      icon: '🚪',
      code: 'BUILDING_ENTRANCE_BUFFER',
      title: 'Too close to a building entrance',
      detail: 'Must stay at least 20 ft from a building entrance or exit.',
      citation: CITES.BUILDING_ENTRANCE_BUFFER,
    });
  }

  if (facts.withinSidewalkCafeBuffer) {
    return prohibited({
      icon: '☕',
      code: 'SIDEWALK_CAFE_BUFFER',
      title: 'Too close to a sidewalk café',
      detail: 'Must stay at least 20 ft from a licensed sidewalk café or stoop-line stand.',
      citation: CITES.SIDEWALK_CAFE_BUFFER,
    });
  }

  if (facts.withinDrivewayBuffer) {
    return prohibited(
      {
        icon: '🚗',
        code: 'DRIVEWAY_BUFFER',
        title: 'Too close to a driveway or curb cut',
        detail:
          'Must stay at least 10 ft from a driveway or curb cut. (No authoritative citywide map exists — this is approximated and may be imprecise.)',
        citation: CITES.DRIVEWAY_BUFFER,
      },
      ['Driveway / curb-cut buffer (approximated — GAP-001)'],
    );
  }

  if (facts.withinBusStopOrTaxiStand) {
    return prohibited({
      icon: '🚌',
      code: 'BUS_STOP',
      title: 'In a bus stop or taxi stand',
      detail: 'No vending within a marked bus-stop or taxi-stand boundary.',
      citation: CITES.BUS_STOP,
    });
  }

  if (facts.abutsHospitalNoStanding) {
    return prohibited({
      icon: '🏥',
      code: 'HOSPITAL_NO_STANDING',
      title: 'Hospital no-standing zone',
      detail: 'No vending on a sidewalk abutting a no-standing zone next to a hospital.',
      citation: CITES.HOSPITAL_NO_STANDING,
    });
  }

  // --- MFV-specific ---
  if (config.vendorType === 'food' && facts.withinCrosswalkBuffer) {
    return prohibited({
      icon: '🚶',
      code: 'CROSSWALK_BUFFER',
      title: 'Too close to a crosswalk',
      detail: 'Food vendors must stay at least 10 ft from a crosswalk.',
      citation: CITES.CROSSWALK_BUFFER,
    });
  }

  // --- GV-specific (merch + First Amendment) ---
  if (followsGvPlacement) {
    if (facts.withinCornerBuffer) {
      return prohibited({
        icon: '📐',
        code: 'CORNER_BUFFER',
        title: 'Too close to the corner',
        detail: 'General vendors must stay at least 10 ft from a street corner / intersection.',
        citation: CITES.CORNER_BUFFER,
      });
    }
    if (facts.withinBusShelterBuffer) {
      return prohibited({
        icon: '🚏',
        code: 'BUS_SHELTER_BUFFER',
        title: 'Too close to a bus shelter',
        detail: 'General vendors must stay at least 5 ft from a bus shelter.',
        citation: CITES.BUS_SHELTER_BUFFER,
      });
    }
    if (facts.withinNewsstandBuffer) {
      return prohibited({
        icon: '🗞️',
        code: 'NEWSSTAND_BUFFER',
        title: 'Too close to a newsstand',
        detail: 'General vendors must stay at least 5 ft from a newsstand.',
        citation: CITES.NEWSSTAND_BUFFER,
      });
    }
    if (facts.withinAdaRampBuffer) {
      return prohibited({
        icon: '♿',
        code: 'ADA_RAMP_BUFFER',
        title: 'Too close to an accessibility ramp',
        detail: 'General vendors must stay at least 5 ft from a disabled-access ramp.',
        citation: CITES.ADA_RAMP_BUFFER,
      });
    }
  }

  return { stop: false };
};
