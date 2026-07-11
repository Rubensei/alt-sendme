use anyhow::Context;

const SERVICE: &str = "alt-sendme";
const USER: &str = "iroh-secret";

pub fn load_secret_hex() -> anyhow::Result<Option<String>> {
    let entry = keyring::Entry::new(SERVICE, USER).context("keyring entry")?;
    match entry.get_password() {
        Ok(value) => Ok(Some(value)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(err) => Err(err.into()),
    }
}

pub fn save_secret_hex(hex: &str) -> anyhow::Result<()> {
    let entry = keyring::Entry::new(SERVICE, USER).context("keyring entry")?;
    entry
        .set_password(hex)
        .context("failed to save secret to keyring")
}

pub fn delete_secret() -> anyhow::Result<()> {
    let entry = keyring::Entry::new(SERVICE, USER).context("keyring entry")?;
    match entry.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(err) => Err(err.into()),
    }
}
