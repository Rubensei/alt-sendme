use std::path::{Path, PathBuf};

use anyhow::Context;
use data_encoding::HEXLOWER;
use iroh::SecretKey;
use protocol::{
    default_device_type, default_display_name, DeviceMetaFile, PairedDevice, PairedDeviceList,
};
use serde::{Deserialize, Serialize};

use crate::secret_store;

#[derive(Debug, Clone)]
pub struct DeviceIdentity {
    pub secret_key: SecretKey,
    pub meta: DeviceMetaFile,
}

impl DeviceIdentity {
    pub fn endpoint_id(&self) -> String {
        self.meta.endpoint_id.clone()
    }

    pub fn display_name(&self) -> &str {
        &self.meta.display_name
    }
}

pub struct PairedDeviceStore {
    path: PathBuf,
}

impl PairedDeviceStore {
    pub fn new(data_dir: &Path) -> Self {
        Self {
            path: data_dir.join("paired-devices.json"),
        }
    }

    pub fn list(&self) -> anyhow::Result<Vec<PairedDevice>> {
        let file = self.read_file()?;
        Ok(file.devices)
    }

    pub fn get(&self, endpoint_id: &str) -> anyhow::Result<Option<PairedDevice>> {
        let id = endpoint_id.to_lowercase();
        Ok(self
            .list()?
            .into_iter()
            .find(|d| d.endpoint_id.to_lowercase() == id))
    }

    pub fn remember(&self, device: PairedDevice) -> anyhow::Result<PairedDevice> {
        let mut file = self.read_file()?;
        let id = device.endpoint_id.to_lowercase();
        if let Some(existing) = file
            .devices
            .iter_mut()
            .find(|d| d.endpoint_id.to_lowercase() == id)
        {
            existing.display_name = device.display_name;
            existing.device_type = device.device_type;
            existing.last_seen_at = device.last_seen_at;
            let saved = existing.clone();
            self.write_file(&file)?;
            return Ok(saved);
        }
        file.devices.push(device.clone());
        self.write_file(&file)?;
        Ok(device)
    }

    pub fn forget(&self, endpoint_id: &str) -> anyhow::Result<()> {
        let mut file = self.read_file()?;
        let id = endpoint_id.to_lowercase();
        file.devices
            .retain(|d| d.endpoint_id.to_lowercase() != id);
        self.write_file(&file)?;
        Ok(())
    }

    pub fn touch(&self, endpoint_id: &str, last_seen_at: u64) -> anyhow::Result<()> {
        let mut file = self.read_file()?;
        let id = endpoint_id.to_lowercase();
        if let Some(existing) = file
            .devices
            .iter_mut()
            .find(|d| d.endpoint_id.to_lowercase() == id)
        {
            existing.last_seen_at = last_seen_at;
            self.write_file(&file)?;
        }
        Ok(())
    }

    fn read_file(&self) -> anyhow::Result<PairedDeviceList> {
        if !self.path.exists() {
            return Ok(PairedDeviceList::default());
        }
        let raw = std::fs::read_to_string(&self.path)
            .with_context(|| format!("read {}", self.path.display()))?;
        Ok(serde_json::from_str(&raw).unwrap_or_default())
    }

    fn write_file(&self, list: &PairedDeviceList) -> anyhow::Result<()> {
        if let Some(parent) = self.path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let tmp = self.path.with_extension("json.tmp");
        std::fs::write(&tmp, serde_json::to_string_pretty(list)?)?;
        std::fs::rename(&tmp, &self.path)?;
        Ok(())
    }
}

pub fn load_or_create_identity(data_dir: &Path) -> anyhow::Result<DeviceIdentity> {
    std::fs::create_dir_all(data_dir)?;
    let meta_path = data_dir.join("device.json");

    let secret = load_secret_key()?;
    let endpoint_id = HEXLOWER.encode(secret.public().as_bytes());

    let meta = if meta_path.exists() {
        let raw = std::fs::read_to_string(&meta_path)?;
        let mut meta: DeviceMetaFile = serde_json::from_str(&raw)
            .context("invalid device.json")?;
        if meta.endpoint_id.to_lowercase() != endpoint_id {
            tracing::warn!("device.json endpoint_id mismatch; updating to keychain identity");
            meta.endpoint_id = endpoint_id;
        }
        meta
    } else {
        DeviceMetaFile::new(
            endpoint_id,
            default_display_name(),
            default_device_type(),
        )
    };

    std::fs::write(&meta_path, serde_json::to_string_pretty(&meta)?)?;

    Ok(DeviceIdentity { secret_key: secret, meta })
}

fn load_secret_key() -> anyhow::Result<SecretKey> {
    if let Ok(hex) = std::env::var("IROH_SECRET") {
        return parse_secret_hex(&hex);
    }
    if let Some(hex) = secret_store::load_secret_hex()? {
        return parse_secret_hex(&hex);
    }
    let secret = SecretKey::generate();
    let hex = HEXLOWER.encode(&secret.to_bytes());
    secret_store::save_secret_hex(&hex)?;
    Ok(secret)
}

fn parse_secret_hex(hex: &str) -> anyhow::Result<SecretKey> {
    let bytes = HEXLOWER
        .decode(hex.trim().as_bytes())
        .context("invalid IROH_SECRET hex")?;
    anyhow::ensure!(bytes.len() == 32, "secret key must be 32 bytes");
    let mut arr = [0u8; 32];
    arr.copy_from_slice(&bytes);
    Ok(SecretKey::from_bytes(&arr))
}

/// Serializable device info for the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceInfo {
    pub endpoint_id: String,
    pub display_name: String,
    pub device_type: String,
}

impl From<&DeviceIdentity> for DeviceInfo {
    fn from(id: &DeviceIdentity) -> Self {
        Self {
            endpoint_id: id.endpoint_id(),
            display_name: id.meta.display_name.clone(),
            device_type: id.meta.device_type.clone(),
        }
    }
}
