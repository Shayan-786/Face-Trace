import { TERMS_VERSION } from '../../services/validation'

export default function Terms() {
  return (
    <article className="terms-page page-stack container">
      <h1>Terms & Conditions</h1>
      <p className="muted">Version {TERMS_VERSION}</p>
      <section>
        <h2>Using Face Trace</h2>
        <p>
          Use this research frontend responsibly. Select only media you own or have
          permission to use. Do not use the service to harass others, impersonate people,
          or share unlawful content.
        </p>
      </section>
      <section>
        <h2>Your account and saved information</h2>
        <p>
          This frontend stores account details, a derived password hash, terms acceptance,
          and saved file-check details in your browser. It does not upload or retain the
          original video files. Clearing browser storage removes locally saved
          information.
        </p>
      </section>
      <section>
        <h2>Administrator controls</h2>
        <p>
          The administrator can activate or deactivate user accounts, delete accounts with
          their associated saved records, and delete individual records, including when
          addressing misuse or violations of these terms. Deactivated accounts cannot sign
          in; their records remain until deleted and the account can be reactivated.
        </p>
        <p>
          Deleting an account or record is permanent in this browser. It does not delete
          the original video from your device. Administrative access and these controls
          currently apply only to data in the same browser.
        </p>
      </section>
      <section>
        <h2>Frontend limitations</h2>
        <p>
          File checks confirm supported file details, not authenticity. This frontend does
          not provide an AI verdict. Local account controls are a demonstration and do not
          provide server-enforced security.
        </p>
      </section>
      <section>
        <h2>Agreement</h2>
        <p>
          When signing up, read these terms and select the agreement checkbox. The
          accepted version and time are saved with your account.
        </p>
      </section>
    </article>
  )
}
