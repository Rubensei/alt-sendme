use serde::{Deserialize, Serialize};

/// Public device metadata persisted on disk (no secret key).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceMetaFile {
    pub version: u32,
    pub endpoint_id: String,
    pub display_name: String,
    pub device_type: String,
    pub created_at: u64,
}

impl DeviceMetaFile {
    pub const VERSION: u32 = 1;

    pub fn new(endpoint_id: String, display_name: String, device_type: String) -> Self {
        Self {
            version: Self::VERSION,
            endpoint_id,
            display_name,
            device_type,
            created_at: unix_now_ms(),
        }
    }
}

/// Paired remote device record (persisted).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct PairedDevice {
    pub endpoint_id: String,
    pub display_name: String,
    pub device_type: String,
    pub paired_at: u64,
    pub last_seen_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PairedDeviceList {
    pub devices: Vec<PairedDevice>,
}

pub fn unix_now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

pub fn default_display_name() -> String {
    std::env::var("HOSTNAME")
        .or_else(|_| std::env::var("COMPUTERNAME"))
        .unwrap_or_else(|_| "AltSendme Device".to_string())
}

pub fn default_device_type() -> String {
    if cfg!(target_os = "macos") {
        "laptop".to_string()
    } else if cfg!(any(target_os = "ios", target_os = "android")) {
        "phone".to_string()
    } else {
        "desktop".to_string()
    }
}
