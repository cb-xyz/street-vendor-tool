/**
 * Vendor configuration lives in URL params so a configured spot is shareable and there is no
 * localStorage dependency for core function (CLAUDE.md). Example:
 *   ?type=food&lic=borough&boro=Brooklyn
 */
import { useCallback, useEffect, useState } from 'react';
import type { Borough, LicenseSubType, VendorConfig, VendorType } from '../engine/types';

export interface PartialConfig {
  vendorType?: VendorType;
  license?: LicenseSubType;
  permittedBorough?: Borough;
  greenCartPrecinct?: string;
}

function read(): PartialConfig {
  const p = new URLSearchParams(window.location.search);
  const cfg: PartialConfig = {};
  const type = p.get('type');
  if (type === 'food' || type === 'merch' || type === 'firstAmendment') cfg.vendorType = type;
  const lic = p.get('lic');
  if (lic) cfg.license = lic as LicenseSubType;
  const boro = p.get('boro');
  if (boro) cfg.permittedBorough = boro as Borough;
  const precinct = p.get('precinct');
  if (precinct) cfg.greenCartPrecinct = precinct;
  return cfg;
}

function write(cfg: PartialConfig): void {
  const p = new URLSearchParams();
  if (cfg.vendorType) p.set('type', cfg.vendorType);
  if (cfg.license) p.set('lic', cfg.license);
  if (cfg.permittedBorough) p.set('boro', cfg.permittedBorough);
  if (cfg.greenCartPrecinct) p.set('precinct', cfg.greenCartPrecinct);
  const qs = p.toString();
  window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
}

export function useVendorConfig() {
  const [config, setConfig] = useState<PartialConfig>(read);

  useEffect(() => {
    write(config);
  }, [config]);

  const update = useCallback((patch: PartialConfig) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback((patch: PartialConfig) => {
    setConfig(patch);
  }, []);

  /** A complete config is ready to evaluate when type + license (and any required extra) are set. */
  const complete: VendorConfig | null =
    config.vendorType && config.license
      ? {
          vendorType: config.vendorType,
          license: config.license,
          ...(config.permittedBorough ? { permittedBorough: config.permittedBorough } : {}),
          ...(config.greenCartPrecinct ? { greenCartPrecinct: config.greenCartPrecinct } : {}),
        }
      : null;

  return { config, complete, update, reset };
}
