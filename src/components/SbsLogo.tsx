/** Official NYC Small Business Services logo (bundled asset), seated on a white chip so the
 *  green/gray lockup stays legible on the navy header. */
import logoUrl from '../assets/sbs-logo.png';

export function SbsLogo() {
  return (
    <span className="sbslogo">
      <img src={logoUrl} alt="NYC Small Business Services" />
    </span>
  );
}
